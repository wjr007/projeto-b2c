/**
 * frame-exporter.js
 * Implements deterministic frame-by-frame 360° rendering and packaging into ZIP:
 * - 360 frames (frame_0000.png to frame_0359.png)
 * - 1080 x 1080 pixels
 * - Angle: i * 360 / 360 degrees
 * - Manifest in JSON and CSV format
 * - In-browser ZIP bundling with JSZip
 */

export class FrameExporter {
  /**
   * @param {StudioScene} studioScene - Studio scene controller
   * @param {TumblerCupModel} cupModel - Cup 3D model
   * @param {Object} JSZip - JSZip library reference
   */
  constructor(studioScene, cupModel, JSZip) {
    this.studio = studioScene;
    this.cup = cupModel;
    this.JSZip = JSZip;
    this.isExporting = false;
    this.shouldCancel = false;

    // Dedicated offscreen canvas for 1080x1080 export rendering
    this.exportCanvas = document.createElement('canvas');
    this.exportCanvas.width = 1080;
    this.exportCanvas.height = 1080;
  }

  /**
   * Captures a single snapshot of the current view at 1080x1080
   * @returns {Promise<Blob>}
   */
  async captureCurrentSnapshot(width = 1080, height = 1080) {
    return new Promise((resolve) => {
      this.studio.renderExportFrame(width, height);
      this.studio.canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Deterministically renders and exports the full 360° sequence
   *
   * @param {Object} config
   * @param {number} config.totalFrames - 360 default
   * @param {number} config.fps - 60 default
   * @param {number} config.cycleSeconds - 6.0 default
   * @param {number} config.resolution - 1080 default
   * @param {Function} config.onProgress - Progress callback ({ current, total, percentage, angle, etaSec })
   * @param {Function} config.onComplete - Completion callback ({ zipBlob, manifest })
   * @param {Function} config.onError - Error callback
   */
  async exportSequence(config = {}) {
    if (this.isExporting) return;
    this.isExporting = true;
    this.shouldCancel = false;

    const totalFrames = config.totalFrames || 360;
    const fps = config.fps || 60;
    const cycleSeconds = config.cycleSeconds || 6.0;
    const res = config.resolution || 1080;
    const onProgress = config.onProgress || (() => {});
    const onComplete = config.onComplete || (() => {});
    const onError = config.onError || console.error;

    // Verify JSZip
    if (!this.JSZip) {
      this.isExporting = false;
      onError(new Error('JSZip library is not loaded. Cannot bundle files into ZIP.'));
      return;
    }

    const zip = new this.JSZip();
    const framesFolder = zip.folder('frames');
    const manifestFrames = [];
    let csvContent = 'index,filename,angle_degrees,angle_radians,time_seconds\n';

    const startTime = performance.now();

    try {
      // Ensure studio camera is strictly in standard fixed view
      this.studio.setInspectionMode(false);
      this.studio.resetToStudioView();

      for (let i = 0; i < totalFrames; i++) {
        if (this.shouldCancel) {
          this.isExporting = false;
          onProgress({ cancelled: true });
          return;
        }

        // Exact angle calculation as per specification:
        // Angle i: i * 360 / totalFrames degrees (does not duplicate 0° at the end)
        const angleDeg = (i * 360.0) / totalFrames;
        const angleRad = (angleDeg * Math.PI) / 180.0;
        const timeSec = Number((i * (cycleSeconds / totalFrames)).toFixed(4));
        const filename = `frame_${String(i).padStart(4, '0')}.png`;

        // 1. Rotate the cup itself around its vertical Y axis
        this.cup.setRotationY(angleRad);

        // 2. Render deterministic frame to export canvas
        this.studio.renderExportFrame(res, res);

        // 3. Extract PNG data blob
        const blob = await new Promise((resolve) => {
          this.studio.canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
        });

        // 4. Add to ZIP folder
        framesFolder.file(filename, blob);

        // 5. Record metadata in manifest
        const frameMeta = {
          index: i,
          filename: filename,
          angle_degrees: Number(angleDeg.toFixed(2)),
          angle_radians: Number(angleRad.toFixed(6)),
          time_seconds: timeSec
        };
        manifestFrames.push(frameMeta);

        csvContent += `${i},${filename},${angleDeg.toFixed(2)},${angleRad.toFixed(6)},${timeSec}\n`;

        // Progress telemetry
        const elapsedSec = (performance.now() - startTime) / 1000;
        const framesDone = i + 1;
        const framesLeft = totalFrames - framesDone;
        const avgTimePerFrame = elapsedSec / framesDone;
        const etaSec = Math.round(framesLeft * avgTimePerFrame);
        const percentage = Math.round((framesDone / totalFrames) * 100);

        onProgress({
          current: framesDone,
          total: totalFrames,
          percentage: percentage,
          angleDeg: angleDeg.toFixed(1),
          filename: filename,
          etaSec: etaSec
        });

        // Allow UI to update / breathe
        if (i % 5 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      // Generate Manifest Object
      const manifest = {
        project: 'Apresentação 3D - Copo Personalizado Cargill',
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        configuration: {
          total_frames: totalFrames,
          fps: fps,
          cycle_duration_seconds: cycleSeconds,
          resolution: `${res}x${res}`,
          image_format: 'image/png',
          naming_convention: 'frame_{index:04d}.png',
          rotation_axis: 'Y (vertical)',
          first_frame_angle_deg: 0.0,
          last_frame_angle_deg: Number(((totalFrames - 1) * 360.0 / totalFrames).toFixed(2)),
          angular_step_deg: Number((360.0 / totalFrames).toFixed(4)),
          camera_mode: 'Fixed Studio Camera',
          lighting: 'Studio 3-Point Lighting'
        },
        key_check_angles: {
          '0_degrees': 'frame_0000.png (Frente / Logotipo Cargill®)',
          '90_degrees': `frame_${String(Math.round(totalFrames * 0.25)).padStart(4, '0')}.png (Lateral Direita / Fitas Verdes)`,
          '180_degrees': `frame_${String(Math.round(totalFrames * 0.50)).padStart(4, '0')}.png (Traseira / Continuidade)`,
          '270_degrees': `frame_${String(Math.round(totalFrames * 0.75)).padStart(4, '0')}.png (Lateral Esquerda / Entrada do Logo)`
        },
        frames: manifestFrames
      };

      // Add manifest.json and manifest.csv to ZIP root
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('manifest.csv', csvContent);

      // Add a comprehensive README.txt inside the ZIP
      const readmeTxt = `APRESENTAÇÃO 3D - COPO PERSONALIZADO CARGILL
=============================================
Exportação Determinística 360° Frame a Frame

Configurações do Pacote:
- Total de frames: ${totalFrames} imagens PNG
- Resolução: ${res} x ${res} pixels
- Duração da rotação: ${cycleSeconds} segundos
- Taxa de quadros: ${fps} fps
- Arquivos: frame_0000.png a frame_${String(totalFrames - 1).padStart(4, '0')}.png
- Ângulo do frame i: i × 360 / ${totalFrames} graus

Ângulos Canônicos para Conferência:
- 0°   (Frente):   frame_0000.png -> Logotipo Cargill® centralizado com folha verde
- 90°  (Direita):  frame_${String(Math.round(totalFrames * 0.25)).padStart(4, '0')}.png -> Ondas esmeralda e lima
- 180° (Traseira): frame_${String(Math.round(totalFrames * 0.50)).padStart(4, '0')}.png -> Continuidade perfeita das fitas sem corte
- 270° (Esquerda): frame_${String(Math.round(totalFrames * 0.75)).padStart(4, '0')}.png -> Transição para a blindagem branca do logo

Arquivos de Manifesto inclusos:
- manifest.json: Metadados estruturados de cada frame (índice, nome, ângulo deg/rad, timestamp)
- manifest.csv:  Tabela com cabeçalho compatível com planilhas e pipelines de automação

Desenvolvido com Three.js e PBR shaders.
`;
      zip.file('README.txt', readmeTxt);

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        onProgress({
          zipping: true,
          zipPercentage: Math.round(metadata.percent)
        });
      });

      this.isExporting = false;
      onComplete({ zipBlob, manifest });

    } catch (err) {
      this.isExporting = false;
      onError(err);
    }
  }

  cancelExport() {
    this.shouldCancel = true;
  }
}

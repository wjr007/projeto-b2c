/**
 * reference-comparator.js
 * Provides visual side-by-side angle validation comparing the 3D model
 * with the original reference photographs at canonical angles:
 * 0° (Front), 90° (Right), 180° (Back), and 270° (Left).
 */

export class ReferenceComparator {
  constructor(cupModel, studioScene) {
    this.cup = cupModel;
    this.studio = studioScene;

    this.referenceData = {
      '0': {
        angle: 0,
        title: '0° - Vista Frontal (Logotipo Cargill®)',
        photoUrl: 'assets/references/media_1790908552692.png',
        analysis: [
          'Formato: Copo cônico duplo com boca larga e base reduzida.',
          'Logotipo: Cargill® em itálico negro, folha verde arqueada sobre "argi".',
          'Área de Fundo: Escudo/folha orgânica branca sobre fundo esmeralda.',
          'Bordas Metálicas: Borda superior em inox escovado (~2cm) e base inferior (~2.4cm).'
        ],
        approximations: 'A escala métrica foi calibrada para 16.8 cm (tamanho padrão de tumbler térmico de 473-500ml).'
      },
      '90': {
        angle: 90,
        title: '90° - Lateral Direita (Ondas Dinâmicas)',
        photoUrl: 'assets/references/media_1790908552739.png',
        analysis: [
          'Transição: O escudo branco do logo afunila para a direita.',
          'Fitas Verdes: Faixas diagonais em esmeralda, verde folha e lima claro.',
          'Linhas de Contorno: Traços finos brancos delimitando o fluxo das fitas.'
        ],
        approximations: 'Curvatura e espessura dos traços vetorizados recriados sem sombras fotográficas.'
      },
      '180': {
        angle: 180,
        title: '180° - Traseira (Continuidade da Arte)',
        photoUrl: 'assets/references/media_1790908552764.png',
        analysis: [
          'Continuidade 360°: Padrão orgânico sem emenda perceptível no fecho U=0/U=1.',
          'Ausência de inscrições: Não há logotipos adicionais na face posterior.',
          'Degradê: Transições suaves entre verde-esmeralda e lima.'
        ],
        approximations: 'Emenda U=0/U=1 alinhada com continuidade tangencial de curvas Bézier.'
      },
      '270': {
        angle: 270,
        title: '270° - Lateral Esquerda (Entrada do Logo)',
        photoUrl: 'assets/references/media_1790908552782.png',
        analysis: [
          'Enquadramento: Fitas convergem e expandem na área branca do logotipo.',
          'Acabamento: Verniz brilhante com reflexo especular na pintura e escovado nos metais.'
        ],
        approximations: 'Reflexos de estúdio fotográfico reais foram substituídos por iluminação PBR neutra.'
      }
    };
  }

  getAngleData(angleKey) {
    return this.referenceData[String(angleKey)] || this.referenceData['0'];
  }
}

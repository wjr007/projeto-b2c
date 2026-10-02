/**
 * texture-generator.js
 * Generates dynamic ultra-high-resolution (2048 x 1024 / 4096 x 2048) cylindrical wrap textures
 * supporting:
 * 1. Base color variations (Verde Cargill Oficial, Preto Fosco, Branco Neve, Azul Marinho, Terracota, Aço Inox).
 * 2. Dynamic Name Engraving ("Grave seu nome") in real time with multiple color options.
 */

export class TumblerTextureGenerator {
  constructor(options = {}) {
    this.width = options.width || 2048;
    this.height = options.height || 1024;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');

    this.currentVariation = 'cargill';
    this.customName = '';
    this.customColor = '#ffffff';
    this.isNameActive = true;
    this.threeTexture = null;
  }

  /**
   * Initializes or updates the texture
   */
  generateTexture(THREE) {
    this.THREE = THREE;
    this.redraw();

    if (!this.threeTexture) {
      this.threeTexture = new THREE.CanvasTexture(this.canvas);
      this.threeTexture.wrapS = THREE.RepeatWrapping;
      this.threeTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.threeTexture.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
      this.threeTexture.anisotropy = 8;
      this.threeTexture.generateMipmaps = true;
    }

    this.threeTexture.needsUpdate = true;
    return this.threeTexture;
  }

  /**
   * Updates variation or personalization parameters and re-renders to canvas
   */
  updateConfig({ variation, name, color, isActive }) {
    if (variation !== undefined) this.currentVariation = variation;
    if (name !== undefined) this.customName = name.trim();
    if (color !== undefined) this.customColor = color;
    if (isActive !== undefined) this.isNameActive = isActive;

    this.redraw();

    if (this.threeTexture) {
      this.threeTexture.needsUpdate = true;
    }
  }

  redraw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentVariation === 'cargill') {
      this.drawCargillArtwork();
    } else {
      this.drawSolidColorBody();
    }

    // Draw customized engraved name if provided
    if (this.isNameActive && this.customName.length > 0) {
      this.drawCustomName();
    }
  }

  drawCargillArtwork() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const colors = {
      darkForest: '#04391e',
      deepEmerald: '#07522d',
      emerald: '#0b6e3d',
      leafGreen: '#1b8b4c',
      vibrantGreen: '#2cb05f',
      lightLime: '#71c043',
      softLime: '#90d45d',
      white: '#ffffff',
      darkText: '#101720',
      cargillLeafGreen: '#008542'
    };

    // 1. Base gradient
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0, colors.darkForest);
    baseGrad.addColorStop(0.35, colors.deepEmerald);
    baseGrad.addColorStop(0.7, colors.emerald);
    baseGrad.addColorStop(1, colors.darkForest);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Wave streams
    const wave1Grad = ctx.createLinearGradient(0, 0, w, h);
    wave1Grad.addColorStop(0, colors.deepEmerald);
    wave1Grad.addColorStop(0.5, colors.leafGreen);
    wave1Grad.addColorStop(1, colors.vibrantGreen);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25);
    ctx.bezierCurveTo(w * 0.25, h * 0.05, w * 0.45, h * 0.45, w * 0.65, h * 0.2);
    ctx.bezierCurveTo(w * 0.85, h * 0.02, w * 0.95, h * 0.15, w, h * 0.25);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = wave1Grad;
    ctx.fill();
    ctx.restore();

    // Ribbon B
    const ribbonGrad1 = ctx.createLinearGradient(w * 0.3, 0, w * 0.9, h);
    ribbonGrad1.addColorStop(0, colors.emerald);
    ribbonGrad1.addColorStop(0.4, colors.lightLime);
    ribbonGrad1.addColorStop(0.7, colors.vibrantGreen);
    ribbonGrad1.addColorStop(1, colors.deepEmerald);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.85);
    ctx.bezierCurveTo(w * 0.15, h * 0.95, w * 0.35, h * 0.7, w * 0.55, h * 0.88);
    ctx.bezierCurveTo(w * 0.75, h * 1.05, w * 0.9, h * 0.75, w, h * 0.85);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = ribbonGrad1;
    ctx.fill();
    ctx.restore();

    // Lime ribbon
    const limeGrad = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
    limeGrad.addColorStop(0, colors.lightLime);
    limeGrad.addColorStop(0.3, colors.softLime);
    limeGrad.addColorStop(0.6, colors.vibrantGreen);
    limeGrad.addColorStop(1, colors.lightLime);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    ctx.bezierCurveTo(w * 0.15, h * 0.3, w * 0.3, h * 0.55, w * 0.48, h * 0.35);
    ctx.bezierCurveTo(w * 0.62, h * 0.18, w * 0.78, h * 0.45, w * 0.92, h * 0.32);
    ctx.bezierCurveTo(w * 0.96, h * 0.28, w * 0.98, h * 0.36, w, h * 0.42);
    ctx.bezierCurveTo(w * 0.95, h * 0.55, w * 0.8, h * 0.68, w * 0.65, h * 0.5);
    ctx.bezierCurveTo(w * 0.45, h * 0.65, w * 0.3, h * 0.75, w * 0.15, h * 0.58);
    ctx.bezierCurveTo(w * 0.08, h * 0.5, w * 0.03, h * 0.46, 0, h * 0.42);
    ctx.closePath();
    ctx.fillStyle = limeGrad;
    ctx.fill();
    ctx.restore();

    // White ribbon accents
    ctx.save();
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = w * 0.012;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18);
    ctx.bezierCurveTo(w * 0.18, h * 0.08, w * 0.32, h * 0.28, w * 0.48, h * 0.14);
    ctx.bezierCurveTo(w * 0.68, h * -0.02, w * 0.85, h * 0.22, w, h * 0.18);
    ctx.stroke();

    ctx.lineWidth = w * 0.008;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.bezierCurveTo(w * 0.15, h * 0.58, w * 0.38, h * 0.82, w * 0.58, h * 0.65);
    ctx.bezierCurveTo(w * 0.78, h * 0.48, w * 0.9, h * 0.8, w, h * 0.72);
    ctx.stroke();

    ctx.lineWidth = w * 0.0022;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.32);
    ctx.bezierCurveTo(w * 0.22, h * 0.18, w * 0.4, h * 0.42, w * 0.6, h * 0.25);
    ctx.bezierCurveTo(w * 0.78, h * 0.12, w * 0.9, h * 0.4, w, h * 0.32);
    ctx.stroke();
    ctx.restore();

    // Front White Shield (U = 0.5 is center front)
    const centerX = w * 0.5;
    const centerY = h * 0.5;

    ctx.save();
    ctx.shadowColor = 'rgba(2, 40, 20, 0.45)';
    ctx.shadowBlur = w * 0.015;
    ctx.beginPath();
    const whiteTopX = centerX + w * 0.03;
    const whiteTopY = h * 0.12;
    ctx.moveTo(whiteTopX, whiteTopY);
    ctx.bezierCurveTo(centerX + w * 0.15, h * 0.16, centerX + w * 0.18, h * 0.38, centerX + w * 0.12, h * 0.58);
    ctx.bezierCurveTo(centerX + w * 0.08, h * 0.72, centerX + w * 0.02, h * 0.86, centerX - w * 0.04, h * 0.89);
    ctx.bezierCurveTo(centerX - w * 0.08, h * 0.89, centerX - w * 0.14, h * 0.82, centerX - w * 0.13, h * 0.68);
    ctx.bezierCurveTo(centerX - w * 0.12, h * 0.52, centerX - w * 0.16, h * 0.32, centerX - w * 0.08, h * 0.2);
    ctx.bezierCurveTo(centerX - w * 0.04, h * 0.14, centerX - w * 0.01, h * 0.11, whiteTopX, whiteTopY);
    ctx.closePath();
    ctx.fillStyle = colors.white;
    ctx.fill();
    ctx.restore();

    // Cargill Logo
    ctx.save();
    const logoX = centerX - w * 0.01;
    const logoY = centerY + h * 0.03;
    const logoFontSize = Math.round(w * 0.052);

    ctx.font = `italic 900 ${logoFontSize}px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = colors.darkText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Cargill', logoX, logoY);

    const textMetrics = ctx.measureText('Cargill');
    const regX = logoX + textMetrics.width / 2 + (logoFontSize * 0.12);
    const regY = logoY - (logoFontSize * 0.35);
    ctx.font = `bold ${Math.round(logoFontSize * 0.24)}px Arial, sans-serif`;
    ctx.fillText('®', regX, regY);

    // Leaf Emblem
    const leafStartX = logoX - textMetrics.width * 0.28;
    const leafStartY = logoY - logoFontSize * 0.42;
    const leafScale = logoFontSize * 0.95;

    ctx.beginPath();
    ctx.moveTo(leafStartX, leafStartY);
    ctx.bezierCurveTo(
      leafStartX + leafScale * 0.2, leafStartY - leafScale * 0.65,
      leafStartX + leafScale * 0.6, leafStartY - leafScale * 0.55,
      leafStartX + leafScale * 0.85, leafStartY - leafScale * 0.15
    );
    ctx.bezierCurveTo(
      leafStartX + leafScale * 0.55, leafStartY - leafScale * 0.32,
      leafStartX + leafScale * 0.25, leafStartY - leafScale * 0.25,
      leafStartX, leafStartY
    );
    ctx.closePath();
    ctx.fillStyle = colors.cargillLeafGreen;
    ctx.fill();
    ctx.restore();
  }

  drawSolidColorBody() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const variationColors = {
      matteBlack: { top: '#1c1d21', mid: '#121316', bottom: '#0d0e10' },
      glossWhite: { top: '#ffffff', mid: '#f3f4f6', bottom: '#e5e7eb' },
      navyBlue:   { top: '#1e3a8a', mid: '#172554', bottom: '#0f172a' },
      terracotta: { top: '#c2593f', mid: '#9a3412', bottom: '#7c2d12' },
      pureSteel:  { top: '#cbd5e1', mid: '#94a3b8', bottom: '#64748b' }
    };

    const c = variationColors[this.currentVariation] || variationColors.matteBlack;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, c.top);
    grad.addColorStop(0.5, c.mid);
    grad.addColorStop(1, c.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // If pure steel, add subtle brushed grain
    if (this.currentVariation === 'pureSteel') {
      for (let y = 0; y < h; y += 2) {
        const val = 120 + Math.floor(Math.random() * 40);
        ctx.strokeStyle = `rgba(${val}, ${val}, ${val}, 0.25)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }

  /**
   * Draws custom engraved name onto the texture
   * When on Cargill artwork: placed on the back (180° = U=0.0 / 1.0) vertically or horizontally.
   * When on solid color: placed on the front (U=0.5) prominently.
   */
  drawCustomName() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const name = this.customName.toUpperCase();

    ctx.save();

    // Position: Center on front (U = 0.5) for solid colors, or on back (U = 0.0 or 0.98) for Cargill
    const isCargill = (this.currentVariation === 'cargill');
    const posX = isCargill ? (w * 0.02) : (w * 0.5);
    const posY = h * 0.5;

    // Font styling: Modern engraved typography (similar to Gocase laser engraving)
    const fontSize = Math.min(Math.round(w * 0.055), Math.round(h * 0.12));
    ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Laser engraved depth effect (subtle drop shadow / groove)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = this.customColor;

    if (isCargill) {
      // Draw vertically on back
      ctx.save();
      ctx.translate(posX, posY);
      ctx.rotate(-Math.PI / 2);
      ctx.letterSpacing = '8px';
      ctx.fillText(name, 0, 0);
      ctx.restore();

      // Mirror onto the other wrap seam edge for seamless wrap continuity
      ctx.save();
      ctx.translate(w + posX, posY);
      ctx.rotate(-Math.PI / 2);
      ctx.letterSpacing = '8px';
      ctx.fillText(name, 0, 0);
      ctx.restore();
    } else {
      // Draw centered horizontally on front
      ctx.letterSpacing = '6px';
      ctx.fillText(name, posX, posY);

      // Subtle fine underline or brand dot
      ctx.fillStyle = this.customColor;
      ctx.beginPath();
      ctx.arc(posX, posY + fontSize * 0.75, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

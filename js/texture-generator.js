/**
 * texture-generator.js
 * Generates dynamic ultra-high-resolution (4096 x 2048) cylindrical wrap textures
 * supporting:
 * 1. Base color variations (Verde Cargill Oficial, Preto Fosco, Branco Neve, Azul Marinho, Terracota, Aço Inox).
 * 2. Dynamic Name Engraving ("Grave seu nome") in real time with multiple color options.
 */

export class TumblerTextureGenerator {
  constructor(options = {}) {
    this.width = options.width || 4096;
    this.height = options.height || 2048;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');

    this.currentVariation = 'copa';
    this.customName = '';
    this.customColor = '#ffffff';
    this.isNameActive = true;
    this.threeTexture = null;

    // Design image paths and cache
    this.designImages = {
      copa: 'assets/designs/Arte Copo 360 copa.jpg',
      rubroNegro: 'assets/designs/flamengo_rubro_negro.jpg',
      luxuryBotanical: 'assets/designs/luxury_botanical.jpg',
      cyberAurora: 'assets/designs/cyber_aurora.jpg',
      goldMarble: 'assets/designs/gold_marble.jpg'
    };
    this.loadedImages = {};
    this.preloadDesignImages();
  }

  preloadDesignImages() {
    for (const [key, src] of Object.entries(this.designImages)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.loadedImages[key] = img;
        if (this.currentVariation === key) {
          this.redraw();
          if (this.threeTexture) this.threeTexture.needsUpdate = true;
        }
      };
    }
  }

  generateTexture(THREE) {
    this.THREE = THREE;
    this.redraw();

    if (!this.threeTexture) {
      this.threeTexture = new THREE.CanvasTexture(this.canvas);
      this.threeTexture.wrapS = THREE.RepeatWrapping;
      this.threeTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.threeTexture.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
      this.threeTexture.anisotropy = 16;
      this.threeTexture.generateMipmaps = true;
    }

    this.threeTexture.needsUpdate = true;
    return this.threeTexture;
  }

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

    if (this.designImages[this.currentVariation] && this.loadedImages[this.currentVariation]) {
      // Draw loaded full wrap design
      ctx.drawImage(this.loadedImages[this.currentVariation], 0, 0, w, h);
    } else if (this.currentVariation === 'rubroNegro') {
      this.drawRubroNegroArtwork();
    } else if (this.currentVariation === 'cargill') {
      this.drawCargillArtwork();
    } else {
      this.drawSolidColorBody();
    }

    if (this.isNameActive) {
      this.drawCustomName();
    }
  }

  drawRubroNegroArtwork() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Alternating horizontal bands matching print
    const bandHeights = [
      { y0: 0, y1: h * 0.12, color: '#111215' },         // Black top
      { y0: h * 0.12, y1: h * 0.32, color: '#c8102e' },  // Red band 1
      { y0: h * 0.32, y1: h * 0.48, color: '#111215' },  // Black band 2
      { y0: h * 0.48, y1: h * 0.68, color: '#c8102e' },  // Red band 3
      { y0: h * 0.68, y1: h, color: '#111215' }          // Black lower
    ];

    bandHeights.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(0, b.y0, w, b.y1 - b.y0);

      // Carbon honeycomb micro-texture on red bands
      if (b.color === '#c8102e') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        const step = 24;
        for (let x = 0; x < w; x += step) {
          for (let y = b.y0; y < b.y1; y += step) {
            if ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) {
              ctx.fillRect(x, y, step * 0.5, step * 0.5);
            }
          }
        }
      }
    });

    // Subtle edge shading between bands
    bandHeights.forEach(b => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, b.y0, w, 6);
      ctx.fillRect(0, b.y1 - 6, w, 6);
    });
  }


  drawCargillArtwork() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const colors = {
      darkForest: '#022d17',
      deepEmerald: '#054e29',
      emerald: '#09703b',
      leafGreen: '#1e9b52',
      vibrantGreen: '#2ec568',
      lightLime: '#7bc73f',
      softLime: '#9de863',
      white: '#ffffff',
      darkText: '#0f172a',
      cargillLeafGreen: '#008542'
    };

    // 1. Deep rich base gradient
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0, colors.darkForest);
    baseGrad.addColorStop(0.3, colors.deepEmerald);
    baseGrad.addColorStop(0.7, colors.emerald);
    baseGrad.addColorStop(1, colors.darkForest);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Top flowing emerald wave
    const wave1Grad = ctx.createLinearGradient(0, 0, w, h * 0.6);
    wave1Grad.addColorStop(0, colors.deepEmerald);
    wave1Grad.addColorStop(0.4, colors.leafGreen);
    wave1Grad.addColorStop(1, colors.vibrantGreen);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.28);
    ctx.bezierCurveTo(w * 0.22, h * 0.06, w * 0.42, h * 0.48, w * 0.68, h * 0.18);
    ctx.bezierCurveTo(w * 0.88, h * 0.02, w * 0.96, h * 0.16, w, h * 0.28);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = wave1Grad;
    ctx.fill();
    ctx.restore();

    // 3. Bottom sweeping ribbon
    const ribbonGrad1 = ctx.createLinearGradient(w * 0.2, 0, w * 0.85, h);
    ribbonGrad1.addColorStop(0, colors.emerald);
    ribbonGrad1.addColorStop(0.35, colors.lightLime);
    ribbonGrad1.addColorStop(0.7, colors.vibrantGreen);
    ribbonGrad1.addColorStop(1, colors.deepEmerald);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    ctx.bezierCurveTo(w * 0.16, h * 0.96, w * 0.36, h * 0.68, w * 0.58, h * 0.86);
    ctx.bezierCurveTo(w * 0.78, h * 1.04, w * 0.92, h * 0.72, w, h * 0.82);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = ribbonGrad1;
    ctx.fill();
    ctx.restore();

    // 4. Center dynamic lime ribbon
    const limeGrad = ctx.createLinearGradient(0, h * 0.2, w, h * 0.85);
    limeGrad.addColorStop(0, colors.lightLime);
    limeGrad.addColorStop(0.3, colors.softLime);
    limeGrad.addColorStop(0.65, colors.vibrantGreen);
    limeGrad.addColorStop(1, colors.lightLime);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    ctx.bezierCurveTo(w * 0.14, h * 0.28, w * 0.32, h * 0.56, w * 0.50, h * 0.34);
    ctx.bezierCurveTo(w * 0.64, h * 0.16, w * 0.80, h * 0.46, w * 0.94, h * 0.30);
    ctx.bezierCurveTo(w * 0.97, h * 0.26, w * 0.99, h * 0.34, w, h * 0.42);
    ctx.bezierCurveTo(w * 0.96, h * 0.56, w * 0.82, h * 0.68, w * 0.66, h * 0.50);
    ctx.bezierCurveTo(w * 0.46, h * 0.66, w * 0.28, h * 0.76, w * 0.14, h * 0.56);
    ctx.bezierCurveTo(w * 0.07, h * 0.48, w * 0.02, h * 0.45, 0, h * 0.42);
    ctx.closePath();
    ctx.fillStyle = limeGrad;
    ctx.fill();
    ctx.restore();

    // 5. Crisp white accent lines
    ctx.save();
    ctx.strokeStyle = colors.white;
    ctx.lineWidth = w * 0.010;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18);
    ctx.bezierCurveTo(w * 0.18, h * 0.07, w * 0.34, h * 0.29, w * 0.50, h * 0.13);
    ctx.bezierCurveTo(w * 0.70, h * -0.03, w * 0.86, h * 0.23, w, h * 0.18);
    ctx.stroke();

    ctx.lineWidth = w * 0.007;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.74);
    ctx.bezierCurveTo(w * 0.16, h * 0.56, w * 0.40, h * 0.84, w * 0.60, h * 0.64);
    ctx.bezierCurveTo(w * 0.80, h * 0.46, w * 0.92, h * 0.82, w, h * 0.74);
    ctx.stroke();

    ctx.lineWidth = w * 0.0025;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.34);
    ctx.bezierCurveTo(w * 0.22, h * 0.16, w * 0.42, h * 0.44, w * 0.62, h * 0.23);
    ctx.bezierCurveTo(w * 0.80, h * 0.10, w * 0.92, h * 0.42, w, h * 0.34);
    ctx.stroke();
    ctx.restore();

    // 6. Front White Shield (U = 0.5 is center front)
    const centerX = w * 0.5;
    const centerY = h * 0.5;

    ctx.save();
    ctx.shadowColor = 'rgba(2, 40, 20, 0.40)';
    ctx.shadowBlur = w * 0.018;
    ctx.beginPath();
    const whiteTopX = centerX + w * 0.025;
    const whiteTopY = h * 0.10;
    ctx.moveTo(whiteTopX, whiteTopY);
    ctx.bezierCurveTo(centerX + w * 0.16, h * 0.14, centerX + w * 0.19, h * 0.38, centerX + w * 0.13, h * 0.58);
    ctx.bezierCurveTo(centerX + w * 0.09, h * 0.72, centerX + w * 0.03, h * 0.88, centerX - w * 0.035, h * 0.91);
    ctx.bezierCurveTo(centerX - w * 0.08, h * 0.91, centerX - w * 0.15, h * 0.84, centerX - w * 0.14, h * 0.68);
    ctx.bezierCurveTo(centerX - w * 0.13, h * 0.50, centerX - w * 0.18, h * 0.30, centerX - w * 0.09, h * 0.18);
    ctx.bezierCurveTo(centerX - w * 0.04, h * 0.12, centerX - w * 0.01, h * 0.09, whiteTopX, whiteTopY);
    ctx.closePath();
    ctx.fillStyle = colors.white;
    ctx.fill();
    ctx.restore();

    // 7. Cargill Brand Logo Wordmark
    ctx.save();
    const logoX = centerX - w * 0.008;
    const logoY = centerY + h * 0.035;
    const logoFontSize = Math.round(w * 0.054);

    ctx.font = `italic 900 ${logoFontSize}px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = colors.darkText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Cargill', logoX, logoY);

    const textMetrics = ctx.measureText('Cargill');
    const regX = logoX + textMetrics.width / 2 + (logoFontSize * 0.10);
    const regY = logoY - (logoFontSize * 0.32);
    ctx.font = `bold ${Math.round(logoFontSize * 0.22)}px Arial, sans-serif`;
    ctx.fillText('®', regX, regY);

    // 8. Cargill Leaf Emblem
    const leafStartX = logoX - textMetrics.width * 0.28;
    const leafStartY = logoY - logoFontSize * 0.40;
    const leafScale = logoFontSize * 0.98;

    ctx.beginPath();
    ctx.moveTo(leafStartX, leafStartY);
    ctx.bezierCurveTo(
      leafStartX + leafScale * 0.2, leafStartY - leafScale * 0.68,
      leafStartX + leafScale * 0.62, leafStartY - leafScale * 0.58,
      leafStartX + leafScale * 0.88, leafStartY - leafScale * 0.14
    );
    ctx.bezierCurveTo(
      leafStartX + leafScale * 0.56, leafStartY - leafScale * 0.34,
      leafStartX + leafScale * 0.24, leafStartY - leafScale * 0.26,
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

  drawCustomName() {
    if (!this.isNameActive) return;
    if (!this.customName || this.customName.trim().length === 0) {
      return; // Não exibe nada na prévia até que o usuário digite seu nome
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const name = this.customName.trim().toUpperCase();

    ctx.save();

    // Standard Layout: Horizontal Name on FRONT below central graphic
    const posX = w * 0.5;
    const posY = (this.currentVariation === 'copa') ? h * 0.885 : h * 0.61;

    const fontSize = (this.currentVariation === 'copa')
      ? Math.min(Math.round(w * 0.024), Math.round(h * 0.048))
      : Math.min(Math.round(w * 0.026), Math.round(h * 0.052));
    ctx.font = `800 ${fontSize}px "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    if (this.currentVariation === 'copa') {
      ctx.strokeStyle = 'rgba(0, 39, 118, 0.75)';
      ctx.lineWidth = 4;
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px';
      ctx.strokeText(name, posX, posY);
    }

    ctx.fillStyle = this.customColor || '#ffffff';

    if (ctx.letterSpacing !== undefined) {
      ctx.letterSpacing = (this.currentVariation === 'copa') ? '6px' : '7px';
    }
    ctx.fillText(name, posX, posY);

    ctx.restore();
  }
}


/**
 * app.js
 * E-commerce 3D Product Showcase Coordinator
 * Manages Three.js WebGL viewport, color variation selectors,
 * real-time laser engraving ("Grave seu nome"), and smooth 360° user interaction.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { TumblerTextureGenerator } from './texture-generator.js';
import { TumblerCupModel } from './cup-model.js';
import { StudioScene } from './studio-scene.js';

class TumblerProductApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.isPlaying = false; // Manual 360° interaction by default
    this.currentAngleDeg = 0;
    this.targetAngleDeg = null;
    this.rotationSpeed = 0.4; // Deg per frame for auto-spin

    this.variationNames = {
      cargill: 'Verde Cargill (Edição Oficial)',
      matteBlack: 'Preto Fosco',
      glossWhite: 'Branco Neve',
      navyBlue: 'Azul Marinho',
      terracotta: 'Terracota',
      pureSteel: 'Aço Inox Escovado'
    };

    this.init();
  }

  async init() {
    try {
      this.updateLoading('Inicializando texturas de estúdio...', 35);

      // 1. Generate dynamic 4K cylindrical texture
      this.textureGen = new TumblerTextureGenerator({ width: 4096, height: 2048 });
      this.bodyTexture = this.textureGen.generateTexture(THREE);

      this.updateLoading('Construindo modelo 3D do copo com parede dupla...', 70);

      // 2. Build physical tumbler 3D model
      this.cupModel = new TumblerCupModel(THREE, this.bodyTexture);

      this.updateLoading('Configurando iluminação de estúdio fotográfico...', 90);

      // 3. Initialize studio environment and camera
      this.studioScene = new StudioScene(this.canvas, THREE, OrbitControls);
      this.studioScene.scene.add(this.cupModel.group);

      // 4. Wire interactive UI controls
      this.setupConfiguratorEvents();
      this.setupViewerControls();

      // 5. Hide loading overlay
      this.hideLoading();

      // 6. Start animation loop
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

      console.log('TumblerProductApp initialized successfully.');
    } catch (err) {
      console.error('Initialization error:', err);
      this.showError(err.message || 'Falha ao inicializar o ambiente 3D.');
    }
  }

  updateLoading(text, percent) {
    const statusText = document.getElementById('loading-status-text');
    const bar = document.getElementById('loading-progress-bar');
    if (statusText) statusText.textContent = text;
    if (bar) bar.style.width = `${percent}%`;
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => overlay.remove(), 450);
    }
  }

  showError(msg) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.innerHTML = `
        <div style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 24px; border-radius: 12px; max-width: 440px; text-align: center;">
          <h3 style="margin-bottom: 8px;">Erro ao carregar o visualizador 3D</h3>
          <p style="font-size: 0.9rem;">${msg}</p>
          <button onclick="location.reload()" style="margin-top: 14px; background: #ea580c; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Recarregar</button>
        </div>
      `;
    }
  }

  hideInteractionHint() {
    const hint = document.getElementById('interaction-hint');
    if (hint) {
      hint.style.opacity = '0';
      setTimeout(() => { if (hint) hint.style.display = 'none'; }, 350);
    }
  }

  /**
   * Product configurator: color swatches & "Grave seu nome" card
   */
  setupConfiguratorEvents() {
    // 1. Color variation swatches
    const colorSwatches = document.querySelectorAll('.swatch-btn');
    const colorLabel = document.getElementById('selected-color-name');

    colorSwatches.forEach((btn) => {
      btn.addEventListener('click', () => {
        colorSwatches.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const variation = btn.getAttribute('data-variation');
        if (colorLabel && this.variationNames[variation]) {
          colorLabel.textContent = this.variationNames[variation];
        }

        // Update texture and cup material
        this.textureGen.updateConfig({ variation });
        this.cupModel.setVariation(variation);
      });
    });

    // 2. Personalization card: Checkbox toggle
    const toggleEngraveBtn = document.getElementById('btn-toggle-engraving');
    const cardContainer = document.getElementById('personalization-card');
    const nameInput = document.getElementById('input-engrave-name');
    let isEngravingActive = true;

    if (toggleEngraveBtn) {
      toggleEngraveBtn.addEventListener('click', () => {
        isEngravingActive = !isEngravingActive;
        toggleEngraveBtn.classList.toggle('active', isEngravingActive);
        cardContainer.classList.toggle('inactive', !isEngravingActive);
        nameInput.disabled = !isEngravingActive;

        this.textureGen.updateConfig({ isActive: isEngravingActive });
      });
    }

    // 3. Name text input: real-time updates
    if (nameInput) {
      let hasRotatedToEngraving = false;

      nameInput.addEventListener('input', (e) => {
        const val = e.target.value;
        this.textureGen.updateConfig({ name: val });

        // If user is typing and cup is on Cargill variation, smoothly turn to 180° (where name is engraved)
        if (val.trim().length > 0 && !hasRotatedToEngraving && this.textureGen.currentVariation === 'cargill') {
          hasRotatedToEngraving = true;
          this.smoothRotateToAngle(180);
        }
      });
    }

    // 4. Name color swatches (7 colors)
    const nameColorDots = document.querySelectorAll('.name-color-dot');
    nameColorDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        nameColorDots.forEach((d) => d.classList.remove('active'));
        dot.classList.add('active');

        const color = dot.getAttribute('data-color');
        this.textureGen.updateConfig({ color });
      });
    });

    // 5. Add to cart / Buy now mock action
    const btnAddCart = document.getElementById('btn-add-cart');
    const btnBuyNow = document.getElementById('btn-buy-now');

    const handlePurchase = (actionName) => {
      const currentVar = this.variationNames[this.textureGen.currentVariation];
      const name = this.textureGen.customName || '(sem gravação)';
      alert(`Produto selecionado para ${actionName}!\n\n• Modelo: Copo Térmico 473ml\n• Cor: ${currentVar}\n• Gravação personalizada: "${name}"`);
    };

    if (btnAddCart) btnAddCart.addEventListener('click', () => handlePurchase('adicionar ao carrinho'));
    if (btnBuyNow) btnBuyNow.addEventListener('click', () => handlePurchase('compra imediata'));
  }

  /**
   * 3D Viewport Controls & Floating Utilities
   */
  setupViewerControls() {
    // Canvas interactions dismiss hint
    this.canvas.addEventListener('pointerdown', () => this.hideInteractionHint());
    this.canvas.addEventListener('wheel', () => this.hideInteractionHint(), { passive: true });

    // OrbitControls tracking
    if (this.studioScene.controls) {
      this.studioScene.controls.addEventListener('start', () => {
        this.targetAngleDeg = null;
        if (this.isPlaying) {
          this.setPlayState(false);
        }
        this.hideInteractionHint();
      });

      this.studioScene.controls.addEventListener('change', () => {
        const rad = this.studioScene.controls.getAzimuthalAngle();
        this.currentAngleDeg = ((-rad * 180 / Math.PI) % 360 + 360) % 360;
        this.syncActivePerspectiveChip();
      });
    }

    // Perspective Quick Chips (0°, 90°, 180°, 270°)
    const chips = document.querySelectorAll('.chip-btn');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');

        const target = parseFloat(chip.getAttribute('data-angle'));
        this.smoothRotateToAngle(target);
      });
    });

    // Reset View Button
    const btnReset = document.getElementById('btn-reset-view');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.setPlayState(false);
        this.targetAngleDeg = null;
        this.studioScene.resetToStudioView();
        this.currentAngleDeg = 0;
        this.syncActivePerspectiveChip();
      });
    }

    // Toggle Auto-spin Button
    const btnSpin = document.getElementById('btn-toggle-spin');
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        this.setPlayState(!this.isPlaying);
      });
    }

    // Fullscreen Button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (btnFullscreen && canvasWrapper) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          canvasWrapper.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      });
    }
  }

  setPlayState(playing) {
    this.isPlaying = playing;
    this.targetAngleDeg = null;

    const btnSpin = document.getElementById('btn-toggle-spin');
    const textSpin = document.getElementById('text-spin');
    const iconSpin = document.getElementById('icon-spin');

    if (btnSpin) btnSpin.classList.toggle('active', this.isPlaying);
    if (textSpin) textSpin.textContent = this.isPlaying ? 'Pausar' : 'Auto-Girar';
    if (iconSpin) {
      iconSpin.innerHTML = this.isPlaying
        ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        : '<polygon points="5 3 19 12 5 21 5 3"/>';
    }
  }

  smoothRotateToAngle(targetDeg) {
    this.setPlayState(false);
    this.targetAngleDeg = (targetDeg % 360 + 360) % 360;
  }

  syncActivePerspectiveChip() {
    const chips = document.querySelectorAll('.chip-btn');
    const rounded = Math.round(this.currentAngleDeg);

    chips.forEach((chip) => {
      const angle = parseInt(chip.getAttribute('data-angle'), 10);
      const diff = Math.abs(rounded - angle);
      if (diff <= 15 || diff >= 345) {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
      }
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    // 1. Smooth target angle interpolation
    if (this.targetAngleDeg !== null && this.studioScene.controls) {
      const currentRad = this.studioScene.controls.getAzimuthalAngle();
      const currentDeg = ((-currentRad * 180 / Math.PI) % 360 + 360) % 360;
      
      let diff = this.targetAngleDeg - currentDeg;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      if (Math.abs(diff) < 0.8) {
        const targetRad = -this.targetAngleDeg * Math.PI / 180;
        this.setCameraAzimuth(targetRad);
        this.targetAngleDeg = null;
      } else {
        const step = diff * 0.12;
        const newDeg = (currentDeg + step) % 360;
        const newRad = -newDeg * Math.PI / 180;
        this.setCameraAzimuth(newRad);
      }
    }
    // 2. Continuous smooth auto-spin if toggled
    else if (this.isPlaying && this.studioScene.controls) {
      const currentRad = this.studioScene.controls.getAzimuthalAngle();
      const newRad = currentRad - (this.rotationSpeed * Math.PI / 180);
      this.setCameraAzimuth(newRad);
    }

    // 3. Update orbit damping
    if (this.studioScene.controls) {
      this.studioScene.controls.update();
    }

    // 4. Render scene
    this.studioScene.renderer.render(this.studioScene.scene, this.studioScene.camera);
  }

  setCameraAzimuth(azimuthRad) {
    if (!this.studioScene.controls) return;
    const camera = this.studioScene.camera;
    const target = this.studioScene.controls.target;
    const distance = camera.position.distanceTo(target);
    const polarAngle = this.studioScene.controls.getPolarAngle();

    camera.position.x = target.x + distance * Math.sin(polarAngle) * Math.sin(azimuthRad);
    camera.position.z = target.z + distance * Math.sin(polarAngle) * Math.cos(azimuthRad);
    camera.position.y = target.y + distance * Math.cos(polarAngle);
    camera.lookAt(target);
  }
}

// Instantiate application on page load
window.addEventListener('DOMContentLoaded', () => {
  new TumblerProductApp();
});

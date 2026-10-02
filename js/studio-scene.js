/**
 * studio-scene.js
 * Manages the Three.js photographic studio environment, including:
 * - RoomEnvironment IBL (Image-Based Lighting) via PMREMGenerator for authentic studio reflections
 * - Photographic 3-point + dual stripbox studio lighting
 * - Floating product contact shadow and infinity cove backdrop
 * - Studio camera management (Fixed Studio View vs Free OrbitControls Inspection)
 */

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class StudioScene {
  /**
   * @param {HTMLCanvasElement} canvas - Target WebGL canvas
   * @param {Object} THREE - Three.js module
   * @param {Object} OrbitControls - OrbitControls addon class
   */
  constructor(canvas, THREE, OrbitControls) {
    this.canvas = canvas;
    this.THREE = THREE;
    this.OrbitControls = OrbitControls;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xebedf1); // Neutral soft studio grey

    // Renderer setup with ACESFilmic tone mapping and antialiasing
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = false;

    // IBL Environment Map (Studio Room Environment)
    this.setupEnvironment();

    // Studio Camera setup (FOV 38° - studio portrait / product distortion-free lens)
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 100);

    // Elevated studio angle matching reference video (~7° downward angle)
    this.defaultCameraPos = new THREE.Vector3(0, 1.2, 30.5);
    this.defaultCameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    // OrbitControls for 360° click-and-drag interaction
    if (this.OrbitControls) {
      this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.rotateSpeed = 0.85;
      this.controls.zoomSpeed = 1.0;
      this.controls.target.copy(this.defaultCameraTarget);
      this.controls.minDistance = 14;
      this.controls.maxDistance = 50;
      this.controls.minPolarAngle = Math.PI * 0.05; // View directly into top cavity (screenshot 2)
      this.controls.maxPolarAngle = Math.PI * 0.95; // View directly at bottom base (screenshot 1)
      this.controls.enabled = true;
    }

    this.setupLighting();
    this.setupResizeListener();
  }

  /**
   * Generates photorealistic studio IBL environment map
   */
  setupEnvironment() {
    const THREE = this.THREE;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      const roomEnv = new RoomEnvironment();
      const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      this.scene.environment = envTexture;
      this.scene.environmentIntensity = 0.95;
    } catch (e) {
      console.warn('RoomEnvironment fallback to standard lights:', e);
    }
  }

  setupLighting() {
    const THREE = this.THREE;

    // 1. Soft Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    // 2. Key Strip Softbox (Right Front - creates crisp vertical reflection strip on cylinder)
    this.keyLight = new THREE.DirectionalLight(0xfffdfa, 1.9);
    this.keyLight.position.set(15, 14, 18);
    this.keyLight.castShadow = false;
    this.scene.add(this.keyLight);

    // 3. Fill Strip Softbox (Left Front - softer specular line)
    this.fillLight = new THREE.DirectionalLight(0xf2f6ff, 1.1);
    this.fillLight.position.set(-16, 12, 14);
    this.scene.add(this.fillLight);

    // 4. Rim / Kicker Light (Back-Top - defines edge contour and stainless steel crown)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.rimLight.position.set(0, 18, -16);
    this.scene.add(this.rimLight);

    // 5. Top Cavity & Lip Highlight Light
    this.topLight = new THREE.SpotLight(0xffffff, 1.0, 45, Math.PI / 4, 0.45, 1.0);
    this.topLight.position.set(0, 22, 4);
    this.topLight.target.position.set(0, 0, 0);
    this.scene.add(this.topLight);
    this.scene.add(this.topLight.target);
  }




  resetToStudioView() {
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);
    if (this.controls) {
      this.controls.target.copy(this.defaultCameraTarget);
      this.controls.update();
    }
  }

  setInspectionMode(enabled) {
    if (this.controls) {
      this.controls.enabled = enabled;
      if (!enabled) {
        this.resetToStudioView();
      }
    }
  }

  setLightingPreset(preset) {
    const THREE = this.THREE;
    if (preset === 'highContrast') {
      this.ambientLight.intensity = 0.4;
      this.keyLight.intensity = 2.4;
      this.fillLight.intensity = 0.7;
      this.rimLight.intensity = 1.8;
      this.renderer.toneMappingExposure = 1.2;
      this.scene.background = new THREE.Color(0xe2e5e9);
    } else if (preset === 'warmShowcase') {
      this.ambientLight.intensity = 0.7;
      this.ambientLight.color.setHex(0xfff8ee);
      this.keyLight.intensity = 2.0;
      this.keyLight.color.setHex(0xfffae8);
      this.fillLight.intensity = 0.9;
      this.rimLight.intensity = 1.4;
      this.renderer.toneMappingExposure = 1.1;
      this.scene.background = new THREE.Color(0xf4f2ee);
    } else {
      this.ambientLight.intensity = 0.6;
      this.ambientLight.color.setHex(0xffffff);
      this.keyLight.intensity = 1.9;
      this.keyLight.color.setHex(0xfffdfa);
      this.fillLight.intensity = 1.1;
      this.rimLight.intensity = 1.4;
      this.renderer.toneMappingExposure = 1.05;
      this.scene.background = new THREE.Color(0xebedf1);
    }
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
  }

  render() {
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  renderExportFrame(width = 1080, height = 1080) {
    const originalSize = new this.THREE.Vector2();
    this.renderer.getSize(originalSize);
    const originalAspect = this.camera.aspect;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    this.renderer.render(this.scene, this.camera);

    this.camera.aspect = originalAspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(originalSize.x, originalSize.y, false);
  }

  dispose() {
    if (this.controls) this.controls.dispose();
    this.renderer.dispose();
  }
}


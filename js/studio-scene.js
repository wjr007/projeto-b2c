/**
 * studio-scene.js
 * Manages the Three.js photographic studio environment, including:
 * - 3-point studio lighting (key, fill, rim, top cavity light)
 * - Ground plane with soft realistic contact shadow
 * - Camera management (Fixed Studio View vs Free OrbitControls Inspection)
 * - Deterministic frame-by-frame rendering for 1080x1080 export
 */

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
    this.scene.background = new THREE.Color(0xf1f3f5); // Neutral soft studio background

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true, // Needed for screenshot / frame extraction
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Camera setup (FOV 42° - perfect distortion-free product lens)
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 100);

    // Standard fixed studio camera position:
    // Slightly elevated (~8° downward angle) so top lip and interior are subtly visible
    this.defaultCameraPos = new THREE.Vector3(0, 1.8, 30.5);
    this.defaultCameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    // OrbitControls enabled by default for direct 360° click-and-drag interaction
    if (this.OrbitControls) {
      this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.rotateSpeed = 0.85;
      this.controls.zoomSpeed = 1.0;
      this.controls.target.copy(this.defaultCameraTarget);
      this.controls.minDistance = 15;
      this.controls.maxDistance = 48;
      this.controls.minPolarAngle = Math.PI * 0.18; // Lets user look into the top cavity
      this.controls.maxPolarAngle = Math.PI * 0.52; // Stops just above ground plane
      this.controls.enabled = true; // Fully interactive by default!
    }

    this.setupLighting();
    this.setupGroundShadow();
    this.setupResizeListener();
  }

  setupLighting() {
    const THREE = this.THREE;

    // 1. Soft Ambient Fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // 2. Key Light (Front-right dominant light with soft shadow)
    this.keyLight = new THREE.DirectionalLight(0xfffcf7, 1.8);
    this.keyLight.position.set(12, 18, 16);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 10;
    this.keyLight.shadow.camera.far = 40;
    this.keyLight.shadow.camera.left = -10;
    this.keyLight.shadow.camera.right = 10;
    this.keyLight.shadow.camera.top = 15;
    this.keyLight.shadow.camera.bottom = -10;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.radius = 2.5; // Softer PCF shadow edges
    this.scene.add(this.keyLight);

    // 3. Fill Light (Left side gentle fill to prevent harsh dark shadows)
    this.fillLight = new THREE.DirectionalLight(0xf2f7ff, 0.95);
    this.fillLight.position.set(-14, 12, 10);
    this.scene.add(this.fillLight);

    // 4. Rim / Kicker Light (Back-top light providing edge specular highlight on stainless steel)
    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.rimLight.position.set(0, 16, -18);
    this.scene.add(this.rimLight);

    // 5. Top Cavity Light (Gently illuminates the interior wall & rim crown)
    this.topLight = new THREE.SpotLight(0xffffff, 1.1, 40, Math.PI / 4, 0.4);
    this.topLight.position.set(0, 22, 2);
    this.topLight.target.position.set(0, 0, 0);
    this.scene.add(this.topLight);
    this.scene.add(this.topLight.target);
  }

  setupGroundShadow() {
    const THREE = this.THREE;

    // Contact shadow plane sitting immediately under the tumbler base (Y = -8.4)
    const groundGeo = new THREE.PlaneGeometry(50, 50);
    const groundMat = new THREE.ShadowMaterial({
      opacity: 0.22,
      transparent: true
    });

    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -8.41; // Just below the cup base
    this.groundPlane.receiveShadow = true;
    this.scene.add(this.groundPlane);

    // Subtle dark radial gradient disk for contact occlusion directly below base
    const diskCanvas = document.createElement('canvas');
    diskCanvas.width = 256;
    diskCanvas.height = 256;
    const ctx = diskCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const diskTex = new THREE.CanvasTexture(diskCanvas);
    const diskMat = new THREE.MeshBasicMaterial({
      map: diskTex,
      transparent: true,
      depthWrite: false
    });
    const diskGeo = new THREE.PlaneGeometry(9.0, 9.0);
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.rotation.x = -Math.PI / 2;
    diskMesh.position.y = -8.405;
    this.scene.add(diskMesh);
  }

  /**
   * Resets camera to standard centered fixed studio view
   */
  resetToStudioView() {
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);
    if (this.controls) {
      this.controls.target.copy(this.defaultCameraTarget);
      this.controls.update();
    }
  }

  /**
   * Enables or disables free manual OrbitControls inspection
   */
  setInspectionMode(enabled) {
    if (this.controls) {
      this.controls.enabled = enabled;
      if (!enabled) {
        this.resetToStudioView();
      }
    }
  }

  /**
   * Sets lighting preset (neutral, highContrast, warmShowcase)
   */
  setLightingPreset(preset) {
    const THREE = this.THREE;
    if (preset === 'highContrast') {
      this.ambientLight.intensity = 0.4;
      this.keyLight.intensity = 2.4;
      this.fillLight.intensity = 0.6;
      this.rimLight.intensity = 2.0;
      this.renderer.toneMappingExposure = 1.25;
      this.scene.background = new THREE.Color(0xe5e7eb);
    } else if (preset === 'warmShowcase') {
      this.ambientLight.intensity = 0.8;
      this.ambientLight.color.setHex(0xfff8ee);
      this.keyLight.intensity = 1.9;
      this.keyLight.color.setHex(0xfffae8);
      this.fillLight.intensity = 0.8;
      this.rimLight.intensity = 1.5;
      this.renderer.toneMappingExposure = 1.15;
      this.scene.background = new THREE.Color(0xf6f4f0);
    } else {
      // Default Studio Neutral
      this.ambientLight.intensity = 0.7;
      this.ambientLight.color.setHex(0xffffff);
      this.keyLight.intensity = 1.8;
      this.keyLight.color.setHex(0xfffcf7);
      this.fillLight.intensity = 0.95;
      this.rimLight.intensity = 1.6;
      this.renderer.toneMappingExposure = 1.1;
      this.scene.background = new THREE.Color(0xf1f3f5);
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
    this.renderer.setSize(w, h, false);
  }

  /**
   * Render single frame in normal interactive loop
   */
  render() {
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Dedicated render for frame export at exact square dimensions (1080 x 1080)
   */
  renderExportFrame(width = 1080, height = 1080) {
    const originalSize = new this.THREE.Vector2();
    this.renderer.getSize(originalSize);
    const originalAspect = this.camera.aspect;

    // Temporarily adjust to square 1080x1080
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);

    // Ensure fixed studio view
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    // Render frame
    this.renderer.render(this.scene, this.camera);

    // Restore original canvas size
    this.camera.aspect = originalAspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(originalSize.x, originalSize.y, false);
  }

  dispose() {
    if (this.controls) this.controls.dispose();
    this.renderer.dispose();
  }
}

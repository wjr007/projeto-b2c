/**
 * cup-model.js
 * Constructs a physically accurate 3D model of the insulated travel tumbler / cup
 * with brushed stainless steel rim, base, interior double-wall cavity,
 * and seamless cylindrical wrap for the custom printed graphics.
 */

export class TumblerCupModel {
  /**
   * @param {Object} THREE - The Three.js module instance
   * @param {THREE.Texture} bodyTexture - The custom 360° wrap texture
   */
  constructor(THREE, bodyTexture) {
    this.THREE = THREE;
    this.bodyTexture = bodyTexture;

    // Dimensions (scale: 1 unit = 1 cm)
    this.dimensions = {
      totalHeight: 16.8,       // 16.8 cm
      topOuterRadius: 4.35,     // 8.7 cm diameter
      topInnerRadius: 4.19,     // Wall thickness ~ 1.6 mm
      rimHeight: 2.0,           // 2.0 cm top stainless steel rim
      bodyTopRadius: 4.15,      // Radius at junction with top rim
      bodyBottomRadius: 3.45,   // Radius at junction with base
      bodyHeight: 12.4,         // 12.4 cm printed wrap area
      baseHeight: 2.4,          // 2.4 cm bottom stainless steel base ring
      baseBottomRadius: 3.35,   // Slight taper at base contact edge
      innerBottomHeight: 2.8,   // Double-wall insulated vacuum bottom
      innerBottomRadius: 3.0    // Interior bottom floor radius
    };

    this.group = new THREE.Group();
    this.group.name = 'TumblerCupRoot';

    this.createMaterials();
    this.buildGeometry();
  }

  /**
   * Procedural brushed metal bump/roughness map for the stainless steel sections
   */
  createBrushedMetalTexture() {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base grey
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Fine horizontal anisotropic brush lines
    for (let y = 0; y < 512; y++) {
      const val = 120 + Math.floor(Math.random() * 35);
      ctx.strokeStyle = `rgb(${val}, ${val}, ${val})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }

  createMaterials() {
    const THREE = this.THREE;
    const brushedTex = this.createBrushedMetalTexture();

    // 1. Brushed Stainless Steel (Rim, Base, Lip)
    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xdae0e5,
      metalness: 0.94,
      roughness: 0.32,
      roughnessMap: brushedTex,
      bumpMap: brushedTex,
      bumpScale: 0.0015,
      envMapIntensity: 1.2
    });

    // 2. Custom Printed Body (Glossy / Semi-gloss lacquer finish)
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.bodyTexture,
      metalness: 0.06,
      roughness: 0.22,
      bumpScale: 0.0008,
      envMapIntensity: 1.0
    });

    // 3. Interior Stainless Steel (Double-wall cavity)
    this.interiorMaterial = new THREE.MeshStandardMaterial({
      color: 0xccd2d8,
      metalness: 0.90,
      roughness: 0.38,
      bumpMap: brushedTex,
      bumpScale: 0.001,
      side: THREE.DoubleSide
    });

    // 4. Subtle Base Ring Plate (Bottom recessed plate)
    this.basePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8bfc6,
      metalness: 0.90,
      roughness: 0.45
    });
  }

  buildGeometry() {
    const THREE = this.THREE;
    const d = this.dimensions;
    const radialSegments = 128; // High fidelity for smooth circular profile

    // --- 1. PRINTED BODY MESH (Tapered cylinder with UV wrap) ---
    // Cylindrical section from Y = d.baseHeight to Y = (d.baseHeight + d.bodyHeight)
    // Radius ranges from d.bodyBottomRadius to d.bodyTopRadius
    const bodyGeometry = new THREE.CylinderGeometry(
      d.bodyTopRadius,
      d.bodyBottomRadius,
      d.bodyHeight,
      radialSegments,
      1,
      true // open-ended, caps are stainless steel
    );

    // Rotate UVs so that Front (U = 0.5 where Cargill logo is centered) faces camera directly (Z > 0)
    const uvAttr = bodyGeometry.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      let u = uvAttr.getX(i);
      // Offset u by 0.25 or 0.75 so the logo at U=0.5 faces +Z
      u = (u + 0.25) % 1.0;
      uvAttr.setX(i, u);
    }
    uvAttr.needsUpdate = true;

    const bodyMesh = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
    bodyMesh.name = 'PrintedBody';
    bodyMesh.position.y = d.baseHeight + (d.bodyHeight / 2);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.group.add(bodyMesh);

    // --- 2. TOP BRUSHED STAINLESS STEEL RIM & LIP ---
    // Modeled using LatheGeometry for smooth curved lip transition
    const rimPoints = [];
    const rimYStart = d.baseHeight + d.bodyHeight; // 14.8 cm
    const rimYEnd = d.totalHeight;                 // 16.8 cm

    // Outer rim profile: slight bevel at body junction -> rise to outer lip -> rounded crown -> inner lip
    rimPoints.push(new THREE.Vector2(d.bodyTopRadius, rimYStart));
    rimPoints.push(new THREE.Vector2(d.bodyTopRadius + 0.02, rimYStart + 0.1));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius - 0.05, rimYEnd - 0.2));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius, rimYEnd - 0.06));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius - 0.03, rimYEnd)); // Lip outer crown
    rimPoints.push(new THREE.Vector2((d.topOuterRadius + d.topInnerRadius) / 2, rimYEnd + 0.04)); // Crown apex
    rimPoints.push(new THREE.Vector2(d.topInnerRadius, rimYEnd));        // Lip inner crown
    rimPoints.push(new THREE.Vector2(d.topInnerRadius - 0.02, rimYEnd - 0.2));
    rimPoints.push(new THREE.Vector2(d.topInnerRadius - 0.05, rimYStart));

    const rimGeometry = new THREE.LatheGeometry(rimPoints, radialSegments);
    const rimMesh = new THREE.Mesh(rimGeometry, this.metalMaterial);
    rimMesh.name = 'TopStainlessRim';
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    this.group.add(rimMesh);

    // --- 3. BOTTOM BRUSHED STAINLESS STEEL BASE FOOT ---
    const basePoints = [];
    // Outer junction with body -> cylindrical foot -> bottom rounded chamfer -> flat contact ring -> inner recess
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius, d.baseHeight));
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius + 0.02, d.baseHeight - 0.1));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius + 0.05, 0.3));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius, 0.08));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius - 0.1, 0.0));     // Ground contact ring
    basePoints.push(new THREE.Vector2(2.6, 0.0));                           // Flat resting edge
    basePoints.push(new THREE.Vector2(2.5, 0.12));                          // Recess bevel
    basePoints.push(new THREE.Vector2(1.8, 0.35));                          // Inner dome recess
    basePoints.push(new THREE.Vector2(0.0, 0.38));                          // Bottom center apex

    const baseGeometry = new THREE.LatheGeometry(basePoints, radialSegments);
    const baseMesh = new THREE.Mesh(baseGeometry, this.metalMaterial);
    baseMesh.name = 'BottomStainlessBase';
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // --- 4. INTERIOR DOUBLE-WALL CAVITY ---
    // Smooth conical inner wall descending from rim down to insulated floor
    const interiorPoints = [];
    const innerTopY = rimYStart;
    const innerBottomY = d.innerBottomHeight;

    interiorPoints.push(new THREE.Vector2(d.topInnerRadius - 0.05, innerTopY));
    interiorPoints.push(new THREE.Vector2(3.85, 12.0));
    interiorPoints.push(new THREE.Vector2(3.50, 7.5));
    interiorPoints.push(new THREE.Vector2(3.15, innerBottomY + 0.4));
    interiorPoints.push(new THREE.Vector2(d.innerBottomRadius, innerBottomY + 0.08));
    interiorPoints.push(new THREE.Vector2(d.innerBottomRadius - 0.2, innerBottomY));
    interiorPoints.push(new THREE.Vector2(0.0, innerBottomY)); // Center of inner bottom

    const interiorGeometry = new THREE.LatheGeometry(interiorPoints, radialSegments);
    const interiorMesh = new THREE.Mesh(interiorGeometry, this.interiorMaterial);
    interiorMesh.name = 'InteriorCavity';
    interiorMesh.receiveShadow = true;
    this.group.add(interiorMesh);

    // Group center is vertically offset so the visual center of the tumbler is at Y = 0
    // Total height is 16.8 cm -> geometric center is at 8.4 cm
    this.group.position.y = -8.4;
  }

  /**
   * Sets rotation around the vertical Y axis (in radians)
   */
  setRotationY(radians) {
    this.group.rotation.y = radians;
  }

  /**
   * Sets rotation in degrees (0 to 360)
   */
  setRotationDegrees(degrees) {
    this.group.rotation.y = (degrees * Math.PI) / 180;
  }

  /**
   * Toggles wireframe display for inspection
   */
  setWireframe(enabled) {
    this.metalMaterial.wireframe = enabled;
    this.bodyMaterial.wireframe = enabled;
    this.interiorMaterial.wireframe = enabled;
  }

  /**
   * Updates or swaps the body texture
   */
  updateTexture(newTexture) {
    this.bodyMaterial.map = newTexture;
    this.bodyMaterial.needsUpdate = true;
  }

  /**
   * Adjusts PBR material properties based on variation (matte vs gloss vs pure steel)
   */
  setVariation(variation) {
    if (variation === 'pureSteel') {
      this.bodyMaterial.metalness = 0.92;
      this.bodyMaterial.roughness = 0.35;
    } else if (variation === 'matteBlack') {
      this.bodyMaterial.metalness = 0.08;
      this.bodyMaterial.roughness = 0.55;
    } else if (variation === 'glossWhite') {
      this.bodyMaterial.metalness = 0.04;
      this.bodyMaterial.roughness = 0.18;
    } else if (variation === 'navyBlue') {
      this.bodyMaterial.metalness = 0.12;
      this.bodyMaterial.roughness = 0.28;
    } else if (variation === 'terracotta') {
      this.bodyMaterial.metalness = 0.05;
      this.bodyMaterial.roughness = 0.58;
    } else { // cargill
      this.bodyMaterial.metalness = 0.06;
      this.bodyMaterial.roughness = 0.22;
    }
    this.bodyMaterial.needsUpdate = true;
  }

  /**
   * Cleans up GPU resources per Three.js best practices
   */
  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          if (child.material.roughnessMap) child.material.roughnessMap.dispose();
          if (child.material.bumpMap) child.material.bumpMap.dispose();
          child.material.dispose();
        }
      }
    });
  }
}

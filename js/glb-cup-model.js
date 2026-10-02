/**
 * glb-cup-model.js
 * Loads the user's authentic 3D model "travel mug 3d model.glb" strictly WITHOUT THE LID,
 * with polished stainless steel open rim, interior cavity, authentic bead ring base,
 * Toppia bottom stamp, and razor-sharp 360° cylindrical wrap UV mapping.
 */

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class GlbCupModel {
  /**
   * @param {Object} THREE - Three.js instance
   * @param {THREE.Texture} bodyTexture - Active 360 wrap texture
   * @param {Function} onLoaded - Callback when GLB is fully loaded and ready
   */
  constructor(THREE, bodyTexture, onLoaded) {
    this.THREE = THREE;
    this.bodyTexture = bodyTexture;
    this.onLoaded = onLoaded;

    this.group = new THREE.Group();
    this.group.name = 'GlbTumblerRoot';

    // Vertical proportion adjustment for bottom stainless steel foot:
    // Authentically shortens the cylindrical foot so it looks sleek and proportional (matching genuine tumblers)
    this.footCutoffY = 0.158;
    this.footScaleY = 0.62; // Reduces vertical height of the bottom foot by ~38%
    this.footDeltaY = this.footCutoffY * (1.0 - this.footScaleY);

    this.rimY = 0.8540 - this.footDeltaY;       // Cleanly below mouth rim groove line
    this.steelFootY = 0.1480 * this.footScaleY; // Brushed stainless steel foot transition
    this.baseY = this.steelFootY + 0.0065;      // Slim, refined accent border (~1.0 mm vertical thickness)

    if (this.bodyTexture) {
      this.bodyTexture.wrapS = THREE.RepeatWrapping;
      this.bodyTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.bodyTexture.needsUpdate = true;
    }

    this.createMaterials();
    this.loadModel();
  }

  createBrushedMetalTexture() {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#9aa1a9';
    ctx.fillRect(0, 0, 1024, 1024);

    for (let y = 0; y < 1024; y++) {
      const val = 135 + Math.floor(Math.random() * 40);
      ctx.strokeStyle = `rgb(${val}, ${val}, ${val})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }

  createBottomStampTexture(brand = 'toppia') {
    const THREE = this.THREE;
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    const cx = 1024;
    const cy = 1024;
    const radius = 1024;

    const drawCurvedText = (context, text, centerX, centerY, arcRadius, centerAngle, letterSpacing = 8) => {
      context.save();
      const chars = text.split('');
      const charWidths = chars.map(c => context.measureText(c).width + letterSpacing);
      const totalWidth = charWidths.reduce((a, b) => a + b, 0);
      const totalAngle = totalWidth / arcRadius;

      let currentAngle = centerAngle - (totalAngle / 2);

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const w = charWidths[i];
        const charAngle = w / arcRadius;
        const angle = currentAngle + (charAngle / 2);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        context.translate(0, -arcRadius);
        context.fillText(char, 0, 0);
        context.restore();

        currentAngle += charAngle;
      }
      context.restore();
    };

    const renderStamp = () => {
      ctx.clearRect(0, 0, 2048, 2048);

      // 1. Solid Ultra-Deep Matte Black Silicone Disc (no fake concentric lines)
      ctx.save();
      ctx.fillStyle = '#141518';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Crisp Laser-Engraved Text Color Setup
      const textColor = '#d6dade';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 3. TOP ARC (12 o'clock): "16oz   |   470ml"
      ctx.font = '600 78px "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const topArcRadius = radius * 0.74; // ~758px
      drawCurvedText(ctx, '16oz   |   470ml', cx, cy, topArcRadius, 0, 10);

      // 4. CENTER: Clean Brand Wordmark ("toppia" or "gocase")
      ctx.save();
      ctx.fillStyle = textColor;
      ctx.font = '700 156px "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '6px';
      const centerWord = (brand === 'gocase') ? 'gocase' : 'toppia';
      ctx.fillText(centerWord, cx, cy);
      ctx.restore();

      // 5. BOTTOM ARC (6 o'clock): "toppia.com.br • toppia.com" or "gocase.com.br • gocase.com"
      ctx.font = '600 68px "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const bottomArcRadius = radius * 0.74;
      const bottomText = (brand === 'gocase')
        ? 'gocase.com.br  •  gocase.com'
        : 'toppia.com.br  •  toppia.com';
      drawCurvedText(ctx, bottomText, cx, cy, bottomArcRadius, Math.PI, 8);
    };

    renderStamp();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    return tex;
  }

  createMaterials() {
    const THREE = this.THREE;
    const brushedTex = this.createBrushedMetalTexture();

    // 1. Unified Physical Cup Material with Sub-Pixel Boundary Mask
    this.cupMaterial = new THREE.MeshPhysicalMaterial({
      map: this.bodyTexture,
      bumpMap: brushedTex,
      bumpScale: 0.0004,
      metalness: 0.04,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.54,
      reflectivity: 0.88,
      envMapIntensity: 1.25,
      side: THREE.FrontSide
    });

    this.cupMaterial.onBeforeCompile = (shader) => {
      this.shaderUniforms = shader.uniforms;
      shader.uniforms.rimY = { value: this.rimY };
      shader.uniforms.baseY = { value: this.baseY };
      shader.uniforms.steelFootY = { value: this.steelFootY };
      shader.uniforms.metalColor = { value: new THREE.Color(0xdce2e8) };
      shader.uniforms.baseColor = { value: new THREE.Color(0x141518) };
      shader.uniforms.isSolidMetal = { value: 0.0 };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying float vCupY;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vCupY = position.y;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying float vCupY;
         uniform float rimY;
         uniform float baseY;
         uniform float steelFootY;
         uniform vec3 metalColor;
         uniform vec3 baseColor;
         uniform float isSolidMetal;`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         float isRim = smoothstep(rimY - 0.0008, rimY + 0.0008, vCupY);
         float isBlackBand = (1.0 - smoothstep(baseY - 0.0008, baseY + 0.0008, vCupY)) * smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);
         float isSteelFoot = 1.0 - smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);

         float metalZone = max(max(isRim, isSteelFoot), isSolidMetal);
         vec3 activeBaseColor = mix(baseColor, metalColor, isSolidMetal);

         vec3 colorWithBase = mix(diffuseColor.rgb, activeBaseColor, isBlackBand);
         diffuseColor.rgb = mix(colorWithBase, metalColor, metalZone);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         float isRimR = smoothstep(rimY - 0.0008, rimY + 0.0008, vCupY);
         float isBlackBandR = (1.0 - smoothstep(baseY - 0.0008, baseY + 0.0008, vCupY)) * smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);
         float isSteelFootR = 1.0 - smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);
         float metalZoneR = max(max(isRimR, isSteelFootR), isSolidMetal);

         roughnessFactor = mix(roughnessFactor, 0.38, isBlackBandR);
         roughnessFactor = mix(roughnessFactor, 0.24, metalZoneR);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
         float isRimM = smoothstep(rimY - 0.0008, rimY + 0.0008, vCupY);
         float isBlackBandM = (1.0 - smoothstep(baseY - 0.0008, baseY + 0.0008, vCupY)) * smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);
         float isSteelFootM = 1.0 - smoothstep(steelFootY - 0.0008, steelFootY + 0.0008, vCupY);
         float metalZoneM = max(max(isRimM, isSteelFootM), isSolidMetal);

         metalnessFactor = mix(metalnessFactor, 0.04, isBlackBandM);
         metalnessFactor = mix(metalnessFactor, 0.96, metalZoneM);`
      );
    };

    // 2. Brushed Stainless Steel Material for the Rim Cap Ring
    this.rimCapMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdce2e8,
      metalness: 0.96,
      roughness: 0.24,
      roughnessMap: brushedTex,
      bumpMap: brushedTex,
      bumpScale: 0.0006,
      clearcoat: 0.08,
      clearcoatRoughness: 0.15,
      ior: 2.4,
      envMapIntensity: 1.45,
      side: THREE.DoubleSide
    });

    // 3. Toppia Bottom Stamp Material (Laser-etched matte silicone finish)
    this.stampMaterial = new THREE.MeshPhysicalMaterial({
      map: this.createBottomStampTexture(this.bottomBrand || 'toppia'),
      metalness: 0.04,
      roughness: 0.38,
      clearcoat: 0.12,
      clearcoatRoughness: 0.22,
      ior: 1.5,
      envMapIntensity: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -4.0,
      side: THREE.DoubleSide
    });

    // 4. Matte Black Base Bead Ring Material (Physical Silicone Bumper Ring)
    this.baseRingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x141518,
      metalness: 0.04,
      roughness: 0.38,
      clearcoat: 0.16,
      clearcoatRoughness: 0.22,
      ior: 1.5,
      envMapIntensity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
      side: THREE.DoubleSide
    });
  }

  loadModel() {
    const THREE = this.THREE;
    const loader = new GLTFLoader();

    loader.load(
      'assets/travel mug 3d model.glb',
      (gltf) => {
        let sourceMesh = null;
        gltf.scene.traverse((child) => {
          if (child.isMesh && !sourceMesh) {
            sourceMesh = child;
          }
        });

        if (!sourceMesh) {
          console.error('No mesh found in travel mug 3d model.glb');
          return;
        }

        const geo = sourceMesh.geometry.clone();

        // 1. Center the GLB geometry and compress bottom foot vertically to authentic proportions
        const posAttr = geo.attributes.position;
        const count = posAttr.count;
        const offsetX = -0.0066;
        const cutoffY = this.footCutoffY;
        const scaleY = this.footScaleY;
        const deltaY = this.footDeltaY;

        for (let i = 0; i < count; i++) {
          posAttr.setX(i, posAttr.getX(i) - offsetX);
          const y = posAttr.getY(i);
          if (y < cutoffY) {
            posAttr.setY(i, y * scaleY);
          } else {
            posAttr.setY(i, y - deltaY);
          }
        }
        geo.computeVertexNormals();

        // 2. Unindex triangles and generate seamless cylindrical UVs with Seam Unwrapping
        const indexAttr = geo.index;
        const indices = indexAttr.array;
        const normAttr = geo.attributes.normal;
        const lidCutoffY = 0.925 - deltaY;
        const bodyYMin = this.baseY; // touches the bead ring
        const bodyYMax = this.rimY;  // cleanly below steel mouth rim line

        const unindexedPositions = [];
        const unindexedNormals = [];
        const unindexedUvs = [];

        for (let i = 0; i < indices.length; i += 3) {
          const i0 = indices[i];
          const i1 = indices[i + 1];
          const i2 = indices[i + 2];

          const y0 = posAttr.getY(i0);
          const y1 = posAttr.getY(i1);
          const y2 = posAttr.getY(i2);
          const yAvg = (y0 + y1 + y2) / 3;

          // 1. Keep strictly outer cup body triangles below rimY (encapsulated cleanly by outer rim collar)
          if (yAvg >= this.rimY) continue;

          const x0 = posAttr.getX(i0), z0 = posAttr.getZ(i0);
          const x1 = posAttr.getX(i1), z1 = posAttr.getZ(i1);
          const x2 = posAttr.getX(i2), z2 = posAttr.getZ(i2);

          const r0 = Math.sqrt(x0 * x0 + z0 * z0);
          const r1 = Math.sqrt(x1 * x1 + z1 * z1);
          const r2 = Math.sqrt(x2 * x2 + z2 * z2);

          // 2. Discard all internal ledge and lid scan fragments from the raw GLB model
          if (yAvg > 0.65 && (r0 < 0.268 || r1 < 0.268 || r2 < 0.268)) continue;

          let u0 = Math.atan2(x0, z0) / (2 * Math.PI) + 0.5;
          let u1 = Math.atan2(x1, z1) / (2 * Math.PI) + 0.5;
          let u2 = Math.atan2(x2, z2) / (2 * Math.PI) + 0.5;

          // Seamless cylindrical UV unwrapping: eliminate vertical crack across 0/1 seam
          if (u1 - u0 > 0.5) u1 -= 1.0;
          else if (u0 - u1 > 0.5) u1 += 1.0;

          if (u2 - u0 > 0.5) u2 -= 1.0;
          else if (u0 - u2 > 0.5) u2 += 1.0;

          const minU = Math.min(u0, u1, u2);
          if (minU < 0) {
            const shift = Math.ceil(-minU);
            u0 += shift;
            u1 += shift;
            u2 += shift;
          }

          const v0 = Math.max(0.0, Math.min(1.0, (y0 - bodyYMin) / (bodyYMax - bodyYMin)));
          const v1 = Math.max(0.0, Math.min(1.0, (y1 - bodyYMin) / (bodyYMax - bodyYMin)));
          const v2 = Math.max(0.0, Math.min(1.0, (y2 - bodyYMin) / (bodyYMax - bodyYMin)));

          unindexedPositions.push(
            x0, y0, z0,
            x1, y1, z1,
            x2, y2, z2
          );
          unindexedNormals.push(
            normAttr.getX(i0), normAttr.getY(i0), normAttr.getZ(i0),
            normAttr.getX(i1), normAttr.getY(i1), normAttr.getZ(i1),
            normAttr.getX(i2), normAttr.getY(i2), normAttr.getZ(i2)
          );
          unindexedUvs.push(
            u0, v0,
            u1, v1,
            u2, v2
          );
        }

        const cupGeo = new THREE.BufferGeometry();
        cupGeo.setAttribute('position', new THREE.Float32BufferAttribute(unindexedPositions, 3));
        cupGeo.setAttribute('normal', new THREE.Float32BufferAttribute(unindexedNormals, 3));
        cupGeo.setAttribute('uv', new THREE.Float32BufferAttribute(unindexedUvs, 2));

        // 3. Create Open Cup Mesh from user's GLB model (WITHOUT LID)
        this.cupMesh = new THREE.Mesh(cupGeo, this.cupMaterial);
        this.cupMesh.name = 'GlbOpenCupMesh';
        this.group.add(this.cupMesh);

        // 4. Pristine Stainless Steel Cavity with Clean Concentric Dividing Line & Emboss Ring
        // Replicates the exact clean concentric geometry of the authentic reference (100% free of fragments)
        const innerProfile = [
          // 4a. Interior floor with raised concentric emboss ring (visible in reference print)
          new THREE.Vector2(0.000, 0.052),
          new THREE.Vector2(0.095, 0.052),
          new THREE.Vector2(0.108, 0.058), // Crisp circular inner emboss ring
          new THREE.Vector2(0.118, 0.052),
          new THREE.Vector2(0.165, 0.052),
          new THREE.Vector2(0.180, 0.062), // Floor to wall curved fillet

          // 4b. Smooth continuous conical interior wall
          new THREE.Vector2(0.198, 0.150),
          new THREE.Vector2(0.226, 0.400),
          new THREE.Vector2(0.252, 0.650),
          new THREE.Vector2(0.264, 0.760),
          new THREE.Vector2(0.2670, this.rimY),

          // 4c. Clean single circular dividing line (stepped interior rim groove requested by user)
          new THREE.Vector2(0.2695, this.rimY + 0.006), // Crisp horizontal dividing step
          new THREE.Vector2(0.2710, lidCutoffY - 0.015),// Internal stepped ledge wall
          new THREE.Vector2(0.2735, lidCutoffY - 0.004),// Internal mouth bevel

          // 4d. Smooth continuous rounded mouth crown lip
          new THREE.Vector2(0.2760, lidCutoffY + 0.0020),
          new THREE.Vector2(0.2795, lidCutoffY + 0.0045), // Top rounded lip crown apex
          new THREE.Vector2(0.2830, lidCutoffY + 0.0030),
          new THREE.Vector2(0.2855, lidCutoffY),          // Outer rim shoulder

          // 4e. Exterior brushed stainless steel collar descending down over cup body
          new THREE.Vector2(0.2855, lidCutoffY - 0.015),
          new THREE.Vector2(0.2848, lidCutoffY - 0.035),
          new THREE.Vector2(0.2838, this.rimY - 0.002),   // Overlaps printed wrap smoothly
          new THREE.Vector2(0.2820, this.rimY - 0.003)    // Sealed bottom edge
        ];
        const innerCavityGeo = new THREE.LatheGeometry(innerProfile, 160);
        innerCavityGeo.computeVertexNormals();
        this.innerCavityMesh = new THREE.Mesh(innerCavityGeo, this.rimCapMaterial);
        this.innerCavityMesh.name = 'GlbUnifiedRimCavity';
        this.group.add(this.innerCavityMesh);

        // 4c. Sleek, Refined Base Accent Ring (Subtle hairline transition before stainless steel foot)
        const beadBaseY = this.steelFootY;
        const beadTopY = this.baseY;
        const beadH = beadTopY - beadBaseY;
        const beadMidY = (beadBaseY + beadTopY) * 0.5;
        const beadRingPoints = [
          new THREE.Vector2(0.2112, beadBaseY),
          new THREE.Vector2(0.2132, beadBaseY + beadH * 0.25),
          new THREE.Vector2(0.2155, beadMidY),                // Sleek, delicate bead peak (~0.5 mm protrusion)
          new THREE.Vector2(0.2142, beadBaseY + beadH * 0.75),
          new THREE.Vector2(0.2130, beadTopY)
        ];
        const beadRingGeo = new THREE.LatheGeometry(beadRingPoints, 128);
        beadRingGeo.computeVertexNormals();
        this.baseBeadRingMesh = new THREE.Mesh(beadRingGeo, this.baseRingMaterial);
        this.baseBeadRingMesh.name = 'GlbBaseBeadRing';
        this.group.add(this.baseBeadRingMesh);

        // 5. Authentic Bottom Stamp Plate (covers full circular base r=0.2125 flush at bottom)
        const stampGeo = new THREE.CircleGeometry(0.2125, 128);
        this.bottomStampMesh = new THREE.Mesh(stampGeo, this.stampMaterial);
        this.bottomStampMesh.name = 'GlbBottomStamp';
        this.bottomStampMesh.rotation.x = Math.PI / 2;
        this.bottomStampMesh.position.set(0, -0.0005, 0);
        this.group.add(this.bottomStampMesh);

        // Standard tumbler height ~16.8 cm
        const targetHeight = 16.8;
        this.group.scale.setScalar(targetHeight);
        this.group.position.y = -targetHeight * (lidCutoffY * 0.5);

        console.log('GlbCupModel loaded successfully from travel mug 3d model.glb WITHOUT lid.');
        if (this.onLoaded) this.onLoaded(this);
      },
      undefined,
      (err) => {
        console.error('Error loading travel mug 3d model.glb:', err);
      }
    );
  }


  setRotationY(radians) {
    this.group.rotation.y = radians;
  }

  setRotationDegrees(degrees) {
    this.group.rotation.y = (degrees * Math.PI) / 180;
  }

  updateTexture(newTexture) {
    if (newTexture) {
      newTexture.wrapS = this.THREE.RepeatWrapping;
      newTexture.wrapT = this.THREE.ClampToEdgeWrapping;
      newTexture.needsUpdate = true;
    }
    this.cupMaterial.map = newTexture;
    this.cupMaterial.needsUpdate = true;
  }

  setLidVisible(visible) {
    if (this.lidMesh) {
      this.lidMesh.visible = visible;
    }
  }

  setVariation(variation) {
    if (this.shaderUniforms) {
      this.shaderUniforms.isSolidMetal.value = (variation === 'pureSteel') ? 1.0 : 0.0;
      if (variation === 'pureSteel') {
        this.shaderUniforms.baseColor.value.setHex(0xdce2e8);
      } else {
        this.shaderUniforms.baseColor.value.setHex(0x141518);
      }
    }

    if (variation === 'pureSteel') {
      this.cupMaterial.metalness = 0.96;
      this.cupMaterial.roughness = 0.28;
      this.cupMaterial.clearcoat = 0.1;
    } else if (variation === 'copa') {
      this.cupMaterial.metalness = 0.04;
      this.cupMaterial.roughness = 0.15;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'rubroNegro') {
      this.cupMaterial.metalness = 0.04;
      this.cupMaterial.roughness = 0.16;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'matteBlack') {
      this.cupMaterial.metalness = 0.04;
      this.cupMaterial.roughness = 0.52;
      this.cupMaterial.clearcoat = 0.15;
      this.cupMaterial.clearcoatRoughness = 0.4;
    } else if (variation === 'glossWhite') {
      this.cupMaterial.metalness = 0.02;
      this.cupMaterial.roughness = 0.12;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'navyBlue') {
      this.cupMaterial.metalness = 0.08;
      this.cupMaterial.roughness = 0.16;
      this.cupMaterial.clearcoat = 0.95;
      this.cupMaterial.clearcoatRoughness = 0.08;
    } else if (variation === 'terracotta') {
      this.cupMaterial.metalness = 0.04;
      this.cupMaterial.roughness = 0.48;
      this.cupMaterial.clearcoat = 0.2;
      this.cupMaterial.clearcoatRoughness = 0.35;
    } else if (variation === 'luxuryBotanical') {
      this.cupMaterial.metalness = 0.08;
      this.cupMaterial.roughness = 0.18;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.06;
    } else if (variation === 'cyberAurora') {
      this.cupMaterial.metalness = 0.10;
      this.cupMaterial.roughness = 0.14;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'goldMarble') {
      this.cupMaterial.metalness = 0.06;
      this.cupMaterial.roughness = 0.12;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.04;
    } else { // cargill / default (official high-gloss print)
      this.cupMaterial.metalness = 0.03;
      this.cupMaterial.roughness = 0.14;
      this.cupMaterial.clearcoat = 1.0;
      this.cupMaterial.clearcoatRoughness = 0.06;
    }

    if (this.baseRingMaterial) {
      if (variation === 'pureSteel') {
        this.baseRingMaterial.color.setHex(0xdce2e8);
        this.baseRingMaterial.metalness = 0.96;
        this.baseRingMaterial.roughness = 0.24;
      } else {
        this.baseRingMaterial.color.setHex(0x141518);
        this.baseRingMaterial.metalness = 0.04;
        this.baseRingMaterial.roughness = 0.38;
      }
    }

    this.cupMaterial.needsUpdate = true;
  }

  setBottomStampBrand(brand) {
    this.bottomBrand = brand;
    if (this.stampMaterial) {
      if (this.stampMaterial.map) this.stampMaterial.map.dispose();
      this.stampMaterial.map = this.createBottomStampTexture(brand);
      this.stampMaterial.needsUpdate = true;
    }
  }

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

/**
 * cup-model.js
 * Constructs a physically accurate 3D model of the insulated travel tumbler / cup
 * with brushed stainless steel rim, base, interior double-wall cavity,
 * and seamless cylindrical wrap for the custom printed graphics using MeshPhysicalMaterial.
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
      totalHeight: 16.8,       // 16.8 cm total cup height
      topOuterRadius: 4.35,    // 8.7 cm diameter at mouth
      topInnerRadius: 4.17,    // Wall thickness ~ 1.8 mm
      rimHeight: 1.1,          // 1.1 cm exposed brushed stainless steel top rim
      bodyTopRadius: 4.24,     // Radius at top junction with wrap
      bodyBottomRadius: 3.48,  // Radius at bottom junction with base
      bodyHeight: 12.8,        // 12.8 cm printed wrap area
      baseHeight: 2.9,         // 2.9 cm base with molded bead ring matching print
      baseBottomRadius: 3.36,  // Radius at base contact edge
      innerBottomHeight: 2.4,  // Double-wall insulated vacuum interior floor
      innerBottomRadius: 2.85  // Interior bottom floor radius
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
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base neutral silver-grey
    ctx.fillStyle = '#9aa1a9';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine horizontal anisotropic brush lines
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

  /**
   * Procedural ultra-sharp 2K bottom stamp with Toppia logo, www.toppia.com.br, and 16oz / 473ml
   */
  createBottomStampTexture() {
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

    const renderStamp = (logoImg = null) => {
      ctx.clearRect(0, 0, 2048, 2048);

      // 1. Background disc - Sleek matte charcoal / PVD black finish matching Gocase reference
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#141518';
      ctx.fill();

      // Subtle radial gradient for authentic studio lighting depth
      const grad = ctx.createRadialGradient(cx, cy, 200, cx, cy, radius);
      grad.addColorStop(0, 'rgba(30, 32, 36, 0.98)');
      grad.addColorStop(0.8, 'rgba(18, 19, 22, 0.98)');
      grad.addColorStop(1, 'rgba(10, 11, 13, 1.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.fill();

      // Subtle concentric precision rings
      ctx.strokeStyle = '#27292e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#1e2024';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.91, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Center Logo: Toppia (gift box icon + wordmark)
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        const targetW = 950;
        const targetH = targetW / aspect;
        ctx.drawImage(logoImg, cx - targetW / 2, cy - targetH / 2, targetW, targetH);
        ctx.restore();
      } else {
        // High-quality vector fallback while image is loading
        ctx.save();
        ctx.translate(cx, cy);
        
        // Gift box icon (purple)
        ctx.fillStyle = '#8c30f5';
        const boxSize = 130;
        const boxX = -320;
        const boxY = -65;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boxX, boxY, boxSize, boxSize, 28);
        } else {
          ctx.fillRect(boxX, boxY, boxSize, boxSize);
        }
        ctx.fill();

        // Wave line across gift box
        ctx.strokeStyle = '#141518';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + 65);
        ctx.bezierCurveTo(boxX + 45, boxY + 45, boxX + 85, boxY + 85, boxX + boxSize, boxY + 65);
        ctx.stroke();

        // Wordmark "toppia"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 150px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('toppia', -160, 0);
        ctx.restore();
      }

      // 3. Curved text on perimeter
      // Text styling matching laser etched / pad printed look in reference
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textArcRadius = radius * 0.77;

      // Arc 1: "www.toppia.com.br"
      drawCurvedText(ctx, 'www.toppia.com.br', cx, cy, textArcRadius, -Math.PI * 0.5, 12);

      // Arc 2: "16oz / 473ml"
      drawCurvedText(ctx, '16oz  /  473ml', cx, cy, textArcRadius, Math.PI * 0.5, 14);
    };

    renderStamp();

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    // Load actual Toppia logo image
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      renderStamp(logoImg);
      tex.needsUpdate = true;
    };
    logoImg.src = 'assets/toppia_logo.png';

    return tex;
  }

  createMaterials() {
    const THREE = this.THREE;
    const brushedTex = this.createBrushedMetalTexture();

    // 1. Brushed Stainless Steel 304 (Top Rim & Bottom Base Ring)
    this.metalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdee3e8,
      metalness: 0.96,
      roughness: 0.24,
      roughnessMap: brushedTex,
      bumpMap: brushedTex,
      bumpScale: 0.0006,
      clearcoat: 0.08,
      clearcoatRoughness: 0.15,
      ior: 2.4,
      reflectivity: 0.95,
      envMapIntensity: 1.45,
      side: THREE.DoubleSide
    });

    // 2. Custom Printed Body (Glossy automotive lacquer clearcoat over vivid print)
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      map: this.bodyTexture,
      metalness: 0.03,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.54,
      reflectivity: 0.88,
      envMapIntensity: 1.25,
      side: THREE.DoubleSide
    });

    // 3. Interior Stainless Steel (Double-wall cavity)
    this.interiorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4dade,
      metalness: 0.92,
      roughness: 0.28,
      bumpMap: brushedTex,
      bumpScale: 0.0006,
      side: THREE.DoubleSide,
      envMapIntensity: 1.1
    });

    // 4. Subtle Base Ring Plate (Bottom recessed plate)
    this.basePlateMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xbac1c8,
      metalness: 0.90,
      roughness: 0.38,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide
    });

    // 5. Dark Matte PVD / Silicone Base Finish (Matches reference print)
    this.darkBaseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x141518,
      metalness: 0.12,
      roughness: 0.44,
      clearcoat: 0.12,
      clearcoatRoughness: 0.35,
      envMapIntensity: 0.85,
      side: THREE.DoubleSide
    });
  }

  buildGeometry() {
    const THREE = this.THREE;
    const d = this.dimensions;
    const radialSegments = 160; // Extra smooth circular profile

    // --- 1. PRINTED BODY MESH (Tapered cylinder with UV wrap) ---
    const bodyGeometry = new THREE.CylinderGeometry(
      d.bodyTopRadius,
      d.bodyBottomRadius,
      d.bodyHeight,
      radialSegments,
      1,
      true
    );

    // Rotate UVs so that Front (U = 0.5 where Cargill logo is centered) faces camera directly (Z > 0)
    const uvAttr = bodyGeometry.attributes.uv;
    for (let i = 0; i < uvAttr.count; i++) {
      let u = uvAttr.getX(i);
      u = (u + 0.25) % 1.0;
      uvAttr.setX(i, u);
    }
    uvAttr.needsUpdate = true;
    bodyGeometry.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeometry, this.bodyMaterial);
    bodyMesh.name = 'PrintedBody';
    bodyMesh.position.y = d.baseHeight + (d.bodyHeight / 2);
    this.group.add(bodyMesh);

    // --- 2. TOP BRUSHED STAINLESS STEEL RIM & LIP (Matches reference screenshot 2) ---
    const rimPoints = [];
    const rimYStart = d.baseHeight + d.bodyHeight; // 15.4 cm
    const rimYEnd = d.totalHeight;                 // 16.8 cm

    // Winding order: from junction with print, up outer wall, over rounded crown, and down inside stepped ledge
    rimPoints.push(new THREE.Vector2(d.bodyTopRadius, rimYStart));
    rimPoints.push(new THREE.Vector2(d.bodyTopRadius + 0.015, rimYStart + 0.05));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius - 0.03, rimYEnd - 0.16));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius, rimYEnd - 0.06));
    rimPoints.push(new THREE.Vector2(d.topOuterRadius - 0.02, rimYEnd));
    rimPoints.push(new THREE.Vector2((d.topOuterRadius + d.topInnerRadius) / 2, rimYEnd + 0.025));
    rimPoints.push(new THREE.Vector2(d.topInnerRadius, rimYEnd));
    rimPoints.push(new THREE.Vector2(d.topInnerRadius - 0.02, rimYEnd - 0.28));
    // Stepped internal groove / ledge (visible in user screenshot 2)
    rimPoints.push(new THREE.Vector2(d.topInnerRadius - 0.08, rimYEnd - 0.34));
    rimPoints.push(new THREE.Vector2(d.topInnerRadius - 0.09, rimYStart));

    const rimGeometry = new THREE.LatheGeometry(rimPoints, radialSegments);
    rimGeometry.computeVertexNormals();
    const rimMesh = new THREE.Mesh(rimGeometry, this.metalMaterial);
    rimMesh.name = 'TopStainlessRim';
    this.group.add(rimMesh);

    // --- 3. BOTTOM BASE (With molded bead ring matching user reference print) ---
    // Recess with Toppia stamp -> chamfer -> flat contact foot -> base foot wall -> molded bead ring -> body junction
    const basePoints = [];
    basePoints.push(new THREE.Vector2(1.72, 0.44));
    basePoints.push(new THREE.Vector2(1.75, 0.44));
    basePoints.push(new THREE.Vector2(1.95, 0.38));
    basePoints.push(new THREE.Vector2(2.10, 0.10));
    basePoints.push(new THREE.Vector2(2.20, 0.0));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius - 0.16, 0.0));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius - 0.04, 0.03));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius, 0.12));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius + 0.02, 0.32));
    basePoints.push(new THREE.Vector2(d.baseBottomRadius + 0.02, 2.0));  // Stepped lower foot
    // Molded bead / bumper ring:
    basePoints.push(new THREE.Vector2(d.baseBottomRadius + 0.06, 2.25));
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius + 0.08, 2.45)); // Swells outwards
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius + 0.12, 2.60)); // Peak of bead
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius + 0.06, 2.75)); // Inward curve
    basePoints.push(new THREE.Vector2(d.bodyBottomRadius, d.baseHeight)); // Meets body at 2.90

    const baseGeometry = new THREE.LatheGeometry(basePoints, radialSegments);
    baseGeometry.computeVertexNormals();
    this.baseMesh = new THREE.Mesh(baseGeometry, this.darkBaseMaterial);
    this.baseMesh.name = 'BottomBase';
    this.group.add(this.baseMesh);

    // --- 3b. BOTTOM STAMP MEDALLION (Toppia logo + www.toppia.com.br stamp) ---
    this.bottomStampTexture = this.createBottomStampTexture();
    this.stampMaterial = new THREE.MeshPhysicalMaterial({
      map: this.bottomStampTexture,
      metalness: 0.12,
      roughness: 0.30,
      clearcoat: 0.25,
      clearcoatRoughness: 0.20,
      ior: 1.5,
      envMapIntensity: 0.9,
      side: THREE.FrontSide
    });

    const stampGeometry = new THREE.CircleGeometry(1.73, 96);
    const stampMesh = new THREE.Mesh(stampGeometry, this.stampMaterial);
    stampMesh.name = 'BottomStampPlate';
    stampMesh.rotation.x = Math.PI / 2;
    stampMesh.position.set(0, 0.44, 0);
    this.group.add(stampMesh);

    // --- 4. INTERIOR DOUBLE-WALL CAVITY ---
    const interiorPoints = [];
    const innerTopY = rimYStart;
    const innerBottomY = d.innerBottomHeight;

    interiorPoints.push(new THREE.Vector2(0.0, innerBottomY));
    interiorPoints.push(new THREE.Vector2(d.innerBottomRadius - 0.25, innerBottomY));
    interiorPoints.push(new THREE.Vector2(d.innerBottomRadius, innerBottomY + 0.10));
    interiorPoints.push(new THREE.Vector2(3.08, innerBottomY + 0.50));
    interiorPoints.push(new THREE.Vector2(3.48, 7.8));
    interiorPoints.push(new THREE.Vector2(3.84, 12.2));
    interiorPoints.push(new THREE.Vector2(d.topInnerRadius - 0.09, innerTopY));

    const interiorGeometry = new THREE.LatheGeometry(interiorPoints, radialSegments);
    interiorGeometry.computeVertexNormals();
    const interiorMesh = new THREE.Mesh(interiorGeometry, this.interiorMaterial);
    interiorMesh.name = 'InteriorCavity';
    this.group.add(interiorMesh);


    // Center tumbler vertically at Y = 0 (Total height 16.8 cm -> geometric midpoint at 8.4 cm)
    this.group.position.y = -8.4;
  }


  setRotationY(radians) {
    this.group.rotation.y = radians;
  }

  setRotationDegrees(degrees) {
    this.group.rotation.y = (degrees * Math.PI) / 180;
  }

  setWireframe(enabled) {
    this.metalMaterial.wireframe = enabled;
    this.bodyMaterial.wireframe = enabled;
    this.interiorMaterial.wireframe = enabled;
  }

  updateTexture(newTexture) {
    this.bodyMaterial.map = newTexture;
    this.bodyMaterial.needsUpdate = true;
  }

  setVariation(variation) {
    if (variation === 'pureSteel') {
      this.bodyMaterial.metalness = 0.96;
      this.bodyMaterial.roughness = 0.28;
      this.bodyMaterial.clearcoat = 0.1;
    } else if (variation === 'matteBlack') {
      this.bodyMaterial.metalness = 0.04;
      this.bodyMaterial.roughness = 0.52;
      this.bodyMaterial.clearcoat = 0.15;
      this.bodyMaterial.clearcoatRoughness = 0.4;
    } else if (variation === 'glossWhite') {
      this.bodyMaterial.metalness = 0.02;
      this.bodyMaterial.roughness = 0.12;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'navyBlue') {
      this.bodyMaterial.metalness = 0.08;
      this.bodyMaterial.roughness = 0.16;
      this.bodyMaterial.clearcoat = 0.95;
      this.bodyMaterial.clearcoatRoughness = 0.08;
    } else if (variation === 'terracotta') {
      this.bodyMaterial.metalness = 0.04;
      this.bodyMaterial.roughness = 0.48;
      this.bodyMaterial.clearcoat = 0.2;
      this.bodyMaterial.clearcoatRoughness = 0.35;
    } else if (variation === 'luxuryBotanical') {
      this.bodyMaterial.metalness = 0.08;
      this.bodyMaterial.roughness = 0.18;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.06;
    } else if (variation === 'cyberAurora') {
      this.bodyMaterial.metalness = 0.10;
      this.bodyMaterial.roughness = 0.14;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.05;
    } else if (variation === 'goldMarble') {
      this.bodyMaterial.metalness = 0.06;
      this.bodyMaterial.roughness = 0.12;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.04;
    } else if (variation === 'rubroNegro') {
      this.bodyMaterial.metalness = 0.04;
      this.bodyMaterial.roughness = 0.16;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.05;
    } else { // cargill / default (official high-gloss print)
      this.bodyMaterial.metalness = 0.03;
      this.bodyMaterial.roughness = 0.14;
      this.bodyMaterial.clearcoat = 1.0;
      this.bodyMaterial.clearcoatRoughness = 0.06;
    }

    if (this.baseMesh) {
      this.baseMesh.material = (variation === 'pureSteel') ? this.metalMaterial : this.darkBaseMaterial;
    }

    this.bodyMaterial.needsUpdate = true;
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


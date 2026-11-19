import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CameraPresetId, ComputedNodeState, RiskTier } from '../types/drainsense';
import { Eye, Layers, RotateCcw } from 'lucide-react';

interface DrainSense3DSceneProps {
  nodes: ComputedNodeState[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  topChokepointIds: Set<string>;
}

type SceneFilter = 'all' | 'avoid' | 'chokepoints';

const MIN_LAT = 28.390;
const MAX_LAT = 28.516;
const MIN_LNG = 76.972;
const MAX_LNG = 77.124;

function latLngToXZ(lat: number, lng: number): { x: number; z: number } {
  const nx = (lng - MIN_LNG) / (MAX_LNG - MIN_LNG) - 0.5;
  const nz = (lat - MIN_LAT) / (MAX_LAT - MIN_LAT) - 0.5;
  return {
    x: nx * 46,
    z: -nz * 38,
  };
}

// Smooth terrain height function matching Aravalli SE ridge -> NH-48 / Basai NW basin
function getTerrainHeight(x: number, z: number): number {
  const ridge = Math.max(0, (x + 6) * 0.045 + (z + 2) * 0.035);
  const bowl = Math.exp(-((x + 6) * (x + 6) + (z + 1) * (z + 1)) / 95) * -0.45;
  return THREE.MathUtils.clamp(ridge + bowl, -0.35, 2.4);
}

const RISK_HEX: Record<RiskTier, number> = {
  Safe: 0x10b981,
  Caution: 0xf59e0b,
  Avoid: 0xef4444,
};

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: {
    label: 'Overview',
    pos: [0, 30, 34],
    target: [0, 0.5, 0],
  },
  nh48: {
    label: 'NH-48 Corridor',
    pos: [-22, 16, 20],
    target: [-4, 0.8, 1],
  },
  badshahpur: {
    label: 'Badshahpur / Sohna Basin',
    pos: [18, 17, 24],
    target: [4, 1.0, 5],
  },
};

// Pre-allocated math helpers outside render loop (Zero GC)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

function createTerrainGridTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#E8EEF5';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle sector grid
  ctx.strokeStyle = '#D5DFEB';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Zone Quadrant Labels on terrain
  ctx.fillStyle = '#64748B';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText('ZONE 1 · DWARKA EXPY / BASAI', 48, 72);
  ctx.fillText('ZONE 2 & 3 · CYBER CITY / IFFCO', 560, 72);
  ctx.fillText('ZONE 1 SOUTH · KHERKI DAULA', 48, 976);
  ctx.fillText('ZONE 4 · SOHNA RD / GHATA', 600, 976);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function drawLabelCanvas(
  canvas: HTMLCanvasElement,
  label: string,
  riskScore: number,
  tier: RiskTier,
  isSelected: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const bg = isSelected ? '#0F172A' : '#FFFFFF';
  const fg = isSelected ? '#FFFFFF' : '#0F172A';
  const accent =
    tier === 'Avoid' ? '#EF4444' : tier === 'Caution' ? '#F59E0B' : '#10B981';

  ctx.fillStyle = bg;
  ctx.strokeStyle = isSelected ? '#38BDF8' : '#CBD5E1';
  ctx.lineWidth = 3;

  const r = 14;
  ctx.beginPath();
  ctx.moveTo(r, 4);
  ctx.lineTo(w - r, 4);
  ctx.quadraticCurveTo(w - 4, 4, w - 4, r);
  ctx.lineTo(w - 4, h - r);
  ctx.quadraticCurveTo(w - 4, h - 4, w - r, h - 4);
  ctx.lineTo(r, h - 4);
  ctx.quadraticCurveTo(4, h - 4, 4, h - r);
  ctx.lineTo(4, r);
  ctx.quadraticCurveTo(4, 4, r, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Status color dot
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(24, h / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.fillStyle = fg;
  ctx.font = '700 22px "Public Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 42, h / 2, w - 108);

  // Score
  ctx.fillStyle = accent;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(String(riskScore), w - 18, h / 2);
  ctx.textAlign = 'left';
}

interface NodeVisualRefs {
  group: THREE.Group;
  pillarMat: THREE.MeshStandardMaterial;
  waterMesh: THREE.Mesh;
  waterMat: THREE.MeshPhysicalMaterial;
  targetWaterScaleY: number;
  currentWaterScaleY: number;
  selectionRing: THREE.Mesh;
  clearedCollar: THREE.Mesh;
  pumpGroup: THREE.Group;
  pumpRotor: THREE.Mesh;
  chokepointCrown: THREE.Mesh | null;
  sprite: THREE.Sprite;
  spriteCanvas: HTMLCanvasElement;
  spriteTex: THREE.CanvasTexture;
  hitMesh: THREE.Mesh;
  worldPos: THREE.Vector3;
}

interface EdgeVisualRefs {
  curve: THREE.CatmullRomCurve3;
  tubeMat: THREE.MeshStandardMaterial;
  fromId: string;
  toId: string;
}

export const DrainSense3DScene: React.FC<DrainSense3DSceneProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  topChokepointIds,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [sceneFilter, setSceneFilter] = useState<SceneFilter>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Mutable refs so React state updates never re-initialize the WebGLRenderer
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const selectedIdRef = useRef(selectedNodeId);
  selectedIdRef.current = selectedNodeId;
  const hoveredIdRef = useRef(hoveredNodeId);
  hoveredIdRef.current = hoveredNodeId;
  const filterRef = useRef(sceneFilter);
  filterRef.current = sceneFilter;
  const topIdsRef = useRef(topChokepointIds);
  topIdsRef.current = topChokepointIds;
  const onSelectRef = useRef(onSelectNode);
  onSelectRef.current = onSelectNode;

  // Camera transition target ref
  const cameraGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.overview.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.overview.target),
  });

  // Visual lookup refs updated on state change
  const nodeVisualsRef = useRef<Map<string, NodeVisualRefs>>(new Map());
  const edgeVisualsRef = useRef<EdgeVisualRefs[]>([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL 3D context could not be initialized in this browser.');
      return;
    }

    const width = container.clientWidth || 860;
    const height = container.clientHeight || 580;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D WebGL context lost. Waiting for GPU recovery...');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const bgHex = 0xeaf0f6;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.Fog(bgHex, 48, 105);

    // Studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 180);
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 11;
    controls.maxDistance = 64;
    controls.screenSpacePanning = false;
    controls.update();

    const cancelCameraGoal = () => {
      cameraGoalRef.current.active = false;
    };
    controls.addEventListener('start', cancelCameraGoal);

    // 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
    keyLight.position.set(22, 34, 18);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -30;
    keyLight.shadow.camera.right = 30;
    keyLight.shadow.camera.top = 30;
    keyLight.shadow.camera.bottom = -30;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    rimLight.position.set(-24, 16, -22);
    scene.add(rimLight);

    const disposables: { dispose: () => void }[] = [envTex];

    // Sculpted Gurugram Basin Terrain
    const terrainGeo = new THREE.PlaneGeometry(78, 68, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainTex = createTerrainGridTexture(renderer.capabilities.getMaxAnisotropy());
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTex,
      roughness: 0.92,
      metalness: 0.02,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    disposables.push(terrainGeo, terrainTex, terrainMat);

    // Stylized 3D Road & Drain Corridors
    const addCorridor = (
      latLngs: [number, number][],
      colorHex: number,
      radius: number,
      yOffset: number,
      roughness: number
    ) => {
      const pts = latLngs.map(([lat, lng]) => {
        const { x, z } = latLngToXZ(lat, lng);
        return new THREE.Vector3(x, getTerrainHeight(x, z) + yOffset, z);
      });
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, 36, radius, 6, false);
      geo.scale(1, 0.25, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      scene.add(mesh);
      disposables.push(geo, mat);
    };

    // NH-48 Corridor
    addCorridor(
      [
        [28.392, 76.974],
        [28.4148, 76.9935],
        [28.4328, 77.0085],
        [28.4458, 77.0342],
        [28.4768, 77.0722],
        [28.4955, 77.0885],
        [28.512, 77.101],
      ],
      0x475569,
      0.52,
      0.08,
      0.85
    );
    // Sohna Road
    addCorridor(
      [
        [28.395, 77.060],
        [28.4045, 77.0562],
        [28.4098, 77.0432],
        [28.4265, 77.041],
        [28.4368, 77.0378],
        [28.4458, 77.0342],
      ],
      0x64748b,
      0.38,
      0.07,
      0.85
    );
    // Golf Course Road
    addCorridor(
      [
        [28.4192, 77.1168],
        [28.4242, 77.0992],
        [28.4385, 77.0965],
        [28.4648, 77.0942],
        [28.4818, 77.0928],
        [28.4955, 77.0885],
      ],
      0x64748b,
      0.38,
      0.07,
      0.85
    );
    // Dwarka Expressway
    addCorridor(
      [
        [28.3965, 76.9795],
        [28.442, 76.978],
        [28.4845, 76.9825],
        [28.512, 76.998],
      ],
      0x64748b,
      0.36,
      0.07,
      0.85
    );
    // Badshahpur Storm Drain Channel
    addCorridor(
      [
        [28.4192, 77.1168],
        [28.4045, 77.0562],
        [28.4098, 77.0432],
        [28.4368, 77.0378],
        [28.4328, 77.0085],
        [28.4565, 76.9968],
        [28.4845, 76.9825],
      ],
      0x0284c7,
      0.34,
      0.11,
      0.35
    );

    // Shared Node Geometries
    const plinthGeo = new THREE.CylinderGeometry(0.88, 1.04, 0.28, 8);
    const pillarGeo = new THREE.CylinderGeometry(0.24, 0.3, 1.35, 12);
    const waterGeo = new THREE.CylinderGeometry(0.32, 0.36, 1.0, 14);
    waterGeo.translate(0, 0.5, 0); // Pivot at bottom center
    const ringGeo = new THREE.RingGeometry(1.12, 1.35, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const collarGeo = new THREE.TorusGeometry(0.92, 0.08, 8, 20);
    collarGeo.rotateX(Math.PI / 2);
    const crownGeo = new THREE.OctahedronGeometry(0.34, 0);
    const pumpBoxGeo = new THREE.BoxGeometry(0.45, 0.32, 0.36);
    const pumpRotorGeo = new THREE.BoxGeometry(0.56, 0.07, 0.12);
    const hitGeo = new THREE.CylinderGeometry(1.25, 1.25, 4.4, 8);
    hitGeo.translate(0, 2.2, 0);

    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.12,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.65,
    });
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.22,
      metalness: 0.85,
    });
    const pumpBoxMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.45,
      metalness: 0.4,
    });
    const pumpRotorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    disposables.push(
      plinthGeo,
      pillarGeo,
      waterGeo,
      ringGeo,
      collarGeo,
      crownGeo,
      pumpBoxGeo,
      pumpRotorGeo,
      hitGeo,
      plinthMat,
      collarMat,
      crownMat,
      pumpBoxMat,
      pumpRotorMat,
      hitMat
    );

    const nodeVisualMap = new Map<string, NodeVisualRefs>();
    const clickableMeshes: THREE.Mesh[] = [];

    for (const node of nodesRef.current) {
      const { x, z } = latLngToXZ(node.lat, node.lng);
      const y = getTerrainHeight(x, z);

      const group = new THREE.Group();
      group.position.set(x, y, z);

      // 1. Plinth base
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = 0.14;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      group.add(plinth);

      // 2. Risk Status Pillar (left socket)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: RISK_HEX[node.riskTier],
        roughness: 0.32,
        metalness: 0.55,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(-0.34, 0.28 + 0.675, 0);
      pillar.castShadow = true;
      group.add(pillar);
      disposables.push(pillarMat);

      // 3. Dynamic Rising Water-Volume Bar (right socket)
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: node.riskTier === 'Avoid' ? 0xef4444 : 0x0ea5e9,
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.82,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.set(0.36, 0.28, 0);
      const initialHeight = 0.28 + (node.riskScore / 100) * 3.6;
      waterMesh.scale.set(1, initialHeight, 1);
      waterMesh.castShadow = true;
      group.add(waterMesh);
      disposables.push(waterMat);

      // 4. Selection Ground Halo Ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        side: THREE.DoubleSide,
      });
      const selectionRing = new THREE.Mesh(ringGeo, ringMat);
      selectionRing.position.y = 0.04;
      selectionRing.visible = false;
      group.add(selectionRing);
      disposables.push(ringMat);

      // 5. Cleared Chokepoint Collar
      const clearedCollar = new THREE.Mesh(collarGeo, collarMat);
      clearedCollar.position.y = 0.3;
      clearedCollar.visible = node.isCleared;
      group.add(clearedCollar);

      // 6. Mobile Pump Unit + Rotor
      const pumpGroup = new THREE.Group();
      pumpGroup.position.set(-0.45, 0.28, 0.55);
      const pumpBox = new THREE.Mesh(pumpBoxGeo, pumpBoxMat);
      pumpBox.position.y = 0.16;
      const pumpRotor = new THREE.Mesh(pumpRotorGeo, pumpRotorMat);
      pumpRotor.position.y = 0.36;
      pumpGroup.add(pumpBox, pumpRotor);
      pumpGroup.visible = node.hasActivePump;
      group.add(pumpGroup);

      // 7. Top 20% High-Leverage Chokepoint Crown
      let chokepointCrown: THREE.Mesh | null = null;
      if (topIdsRef.current.has(node.id) || node.isTop20Chokepoint) {
        chokepointCrown = new THREE.Mesh(crownGeo, crownMat);
        chokepointCrown.position.set(-0.34, 2.05, 0);
        chokepointCrown.castShadow = true;
        group.add(chokepointCrown);
      }

      // 8. Sharp Procedural Sprite Label
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 360;
      spriteCanvas.height = 68;
      drawLabelCanvas(
        spriteCanvas,
        node.shortLabel,
        node.riskScore,
        node.riskTier,
        selectedIdRef.current === node.id
      );
      const spriteTex = new THREE.CanvasTexture(spriteCanvas);
      spriteTex.colorSpace = THREE.SRGBColorSpace;
      spriteTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTex,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.8, 0.9, 1);
      sprite.position.set(0, 4.4, 0);
      sprite.renderOrder = 10;
      group.add(sprite);
      disposables.push(spriteTex, spriteMat);

      // 9. Raycast Proxy Mesh on Layer 1
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.layers.set(1);
      hitMesh.userData.nodeId = node.id;
      group.add(hitMesh);
      clickableMeshes.push(hitMesh);

      scene.add(group);

      nodeVisualMap.set(node.id, {
        group,
        pillarMat,
        waterMesh,
        waterMat,
        targetWaterScaleY: initialHeight,
        currentWaterScaleY: initialHeight,
        selectionRing,
        clearedCollar,
        pumpGroup,
        pumpRotor,
        chokepointCrown,
        sprite,
        spriteCanvas,
        spriteTex,
        hitMesh,
        worldPos: new THREE.Vector3(x, y, z),
      });
    }

    nodeVisualsRef.current = nodeVisualMap;

    // 3D Flow / Choke Connectors linking upstream -> downstream
    const edgeVisuals: EdgeVisualRefs[] = [];
    for (const node of nodesRef.current) {
      const fromVis = nodeVisualMap.get(node.id);
      if (!fromVis) continue;
      for (const downId of node.downstreamIds) {
        const toVis = nodeVisualMap.get(downId);
        if (!toVis) continue;

        const p1 = fromVis.worldPos.clone().add(new THREE.Vector3(0, 0.5, 0));
        const p3 = toVis.worldPos.clone().add(new THREE.Vector3(0, 0.5, 0));
        const mid = p1.clone().lerp(p3, 0.5);
        mid.y += 0.65;

        const curve = new THREE.CatmullRomCurve3([p1, mid, p3]);
        const tubeGeo = new THREE.TubeGeometry(curve, 18, 0.085, 6, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.4,
          metalness: 0.3,
          transparent: true,
          opacity: 0.72,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tubeMesh);
        disposables.push(tubeGeo, tubeMat);

        edgeVisuals.push({
          curve,
          tubeMat,
          fromId: node.id,
          toId: downId,
        });
      }
    }
    edgeVisualsRef.current = edgeVisuals;

    // Instanced Flow Beads gliding along 3D connectors (2 beads per edge)
    const beadsPerEdge = 2;
    const totalBeads = edgeVisuals.length * beadsPerEdge;
    const beadGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const beadMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.2,
    });
    const beadInstanced = new THREE.InstancedMesh(beadGeo, beadMat, Math.max(1, totalBeads));
    beadInstanced.frustumCulled = false;
    scene.add(beadInstanced);
    disposables.push(beadGeo, beadMat);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for Click & Hover
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 36) return; // Ignore orbit drag
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as string | undefined;
        if (hitId) {
          onSelectRef.current(selectedIdRef.current === hitId ? null : hitId);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 45) return;
      lastHoverCheck = now;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      const hitId = hits.length > 0 ? (hits[0].object.userData.nodeId as string) : null;
      canvas.style.cursor = hitId ? 'pointer' : 'grab';
      if (hitId !== hoveredIdRef.current) {
        setHoveredNodeId(hitId);
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 860;
      const h = container.clientHeight || 580;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(container);

    // Animation Loop (paced via afterDraw on software WebGL)
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;

      // Smooth Camera Preset Transition
      const goal = cameraGoalRef.current;
      if (goal.active) {
        const lambda = 5.5;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.pos.x, lambda, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.pos.y, lambda, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.pos.z, lambda, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, goal.target.x, lambda, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, goal.target.y, lambda, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, goal.target.z, lambda, delta);

        if (
          camera.position.distanceTo(goal.pos) < 0.12 &&
          controls.target.distanceTo(goal.target) < 0.12
        ) {
          goal.active = false;
        }
      }

      controls.update();

      // Smoothly damp 3D water-volume bar heights, spin pump rotors & float chokepoint crowns
      const currentNodesMap = new Map(nodesRef.current.map((n) => [n.id, n]));
      for (const [id, vis] of nodeVisualMap.entries()) {
        vis.currentWaterScaleY = THREE.MathUtils.damp(
          vis.currentWaterScaleY,
          vis.targetWaterScaleY,
          6.5,
          delta
        );
        vis.waterMesh.scale.y = vis.currentWaterScaleY;

        if (vis.pumpGroup.visible) {
          vis.pumpRotor.rotation.y += delta * 6.0;
        }
        if (vis.chokepointCrown) {
          vis.chokepointCrown.rotation.y = elapsed * 1.1;
          vis.chokepointCrown.position.y = 2.08 + Math.sin(elapsed * 2.2) * 0.08;
        }

        const nData = currentNodesMap.get(id);
        const isSel = selectedIdRef.current === id;
        const isHov = hoveredIdRef.current === id;
        const showLabel =
          isSel ||
          isHov ||
          (nData ? nData.riskTier === 'Avoid' || topIdsRef.current.has(id) : false);
        vis.sprite.visible = showLabel;
        if (showLabel) {
          vis.sprite.position.y = Math.max(2.6, 0.55 + vis.currentWaterScaleY + 0.55);
        }
      }

      // Update Instanced Flow Beads along upstream -> downstream connectors
      let beadIdx = 0;
      for (let eIdx = 0; eIdx < edgeVisuals.length; eIdx++) {
        const edge = edgeVisuals[eIdx];
        const fromNode = currentNodesMap.get(edge.fromId);
        const speed =
          fromNode && !fromNode.isCleared && fromNode.riskScore >= 70 ? 0.55 : 0.32;

        if (fromNode) {
          _color.setHex(
            fromNode.isCleared
              ? 0x38bdf8
              : fromNode.riskScore >= 70
              ? 0xef4444
              : fromNode.riskScore >= 45
              ? 0xf59e0b
              : 0x64748b
          );
        }

        for (let b = 0; b < beadsPerEdge; b++) {
          const t = (elapsed * speed + eIdx * 0.17 + b * 0.5) % 1;
          edge.curve.getPointAt(t, _vA);
          _dummy.position.copy(_vA);
          _dummy.scale.setScalar(fromNode && !fromNode.isCleared && fromNode.riskScore >= 70 ? 1.25 : 0.9);
          _dummy.updateMatrix();
          beadInstanced.setMatrixAt(beadIdx, _dummy.matrix);
          beadInstanced.setColorAt(beadIdx, _color);
          beadIdx++;
        }
      }
      beadInstanced.instanceMatrix.needsUpdate = true;
      if (beadInstanced.instanceColor) beadInstanced.instanceColor.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObs.disconnect();
      controls.removeEventListener('start', cancelCameraGoal);
      controls.dispose();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      for (const d of disposables) {
        d.dispose();
      }
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  // Synchronize live hydrology calculations & selection/filter states into the 3D scene
  useEffect(() => {
    const visuals = nodeVisualsRef.current;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const node of nodes) {
      const vis = visuals.get(node.id);
      if (!vis) continue;

      const highlighted =
        sceneFilter === 'all' ||
        (sceneFilter === 'avoid' && node.riskTier === 'Avoid') ||
        (sceneFilter === 'chokepoints' &&
          (topChokepointIds.has(node.id) || Boolean(node.isTop20Chokepoint)));

      vis.group.visible = true;
      vis.pillarMat.color.setHex(RISK_HEX[node.riskTier]);
      vis.pillarMat.opacity = highlighted ? 1 : 0.25;
      vis.pillarMat.transparent = !highlighted;

      vis.targetWaterScaleY = 0.28 + (node.riskScore / 100) * 3.8;
      vis.waterMat.color.setHex(
        node.isCleared
          ? 0x0ea5e9
          : node.riskTier === 'Avoid'
          ? 0xef4444
          : node.riskTier === 'Caution'
          ? 0xf59e0b
          : 0x10b981
      );
      vis.waterMat.opacity = highlighted ? 0.82 : 0.2;

      vis.selectionRing.visible = selectedNodeId === node.id || hoveredNodeId === node.id;
      vis.clearedCollar.visible = node.isCleared;
      vis.pumpGroup.visible = node.hasActivePump;

      drawLabelCanvas(
        vis.spriteCanvas,
        node.shortLabel,
        node.riskScore,
        node.riskTier,
        selectedNodeId === node.id
      );
      vis.spriteTex.needsUpdate = true;
    }

    for (const edge of edgeVisualsRef.current) {
      const fromNode = nodeMap.get(edge.fromId);
      if (!fromNode) continue;
      const isSelectedEdge =
        selectedNodeId === edge.fromId || selectedNodeId === edge.toId;

      edge.tubeMat.color.setHex(
        fromNode.isCleared
          ? 0x0ea5e9
          : fromNode.riskScore >= 70
          ? 0xef4444
          : fromNode.riskScore >= 45
          ? 0xf59e0b
          : 0x64748b
      );
      edge.tubeMat.opacity = isSelectedEdge ? 0.95 : 0.65;
    }
  }, [nodes, selectedNodeId, hoveredNodeId, sceneFilter, topChokepointIds]);

  const handleSelectCameraPreset = (presetId: CameraPresetId) => {
    setCameraPreset(presetId);
    const preset = CAMERA_PRESETS[presetId];
    cameraGoalRef.current = {
      active: true,
      pos: new THREE.Vector3(...preset.pos),
      target: new THREE.Vector3(...preset.target),
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
      {/* 3D Toolbar */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Presets */}
          <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <span className="px-2 text-[11px] font-medium text-slate-500 inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Camera:
            </span>
            {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => handleSelectCameraPreset(pid)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  cameraPreset === pid
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {CAMERA_PRESETS[pid].label}
              </button>
            ))}
          </div>

          {/* Node Filter */}
          <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <span className="px-2 text-[11px] font-medium text-slate-500 inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setSceneFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sceneFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 30 Nodes
            </button>
            <button
              type="button"
              onClick={() => setSceneFilter('avoid')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sceneFilter === 'avoid'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Avoid Only
            </button>
            <button
              type="button"
              onClick={() => setSceneFilter('chokepoints')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sceneFilter === 'chokepoints'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 20% Chokepoints
            </button>
          </div>
        </div>

        {/* Clean Unboxed Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Safe (&lt;40)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Caution (40–69)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Avoid (≥70)
          </span>
        </div>
      </div>

      {/* 3D WebGL Viewport (100% Unobstructed Center) */}
      <div className="relative w-full h-[540px] sm:h-[580px] bg-slate-100">
        {webglError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-slate-100 text-slate-700">
            <p className="text-sm font-semibold">{webglError}</p>
            <p className="text-xs text-slate-500">
              You can still inspect and mitigate any of the 30 Gurugram hotspots from the right-hand
              chokepoint list and side inspector.
            </p>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" />
        )}

        {/* Discrete Bottom Hint Bar */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 border border-slate-200 rounded-lg px-3.5 py-1.5 text-[11px] text-slate-700 flex items-center gap-3 shadow-xs whitespace-nowrap">
          <span>Drag to orbit · Right-drag to pan · Scroll to zoom</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-slate-900">Click any 3D pillar to inspect</span>
          <button
            type="button"
            onClick={() => handleSelectCameraPreset('overview')}
            className="pointer-events-auto inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

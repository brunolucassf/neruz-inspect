import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { drawDemoTexture, readDemoTexts } from '../../demo/drawDemo';
import { DEMO_HEIGHT, DEMO_WIDTH } from '../../demo/layout';
import type { HeroController, Point, Surface } from '../hero';

const PLANE_WIDTH = 3;
const PLANE_HEIGHT = (PLANE_WIDTH * DEMO_HEIGHT) / DEMO_WIDTH;
const FOV = 26;
const BASE_TILT_X = -0.17;
const BASE_TILT_Y = 0.1;
const MAX_MOUSE_TILT = (4 * Math.PI) / 180;
const MAX_DPR = 1.5;
const TEXTURE_SCALE = 2;
const LENS_MAGNIFICATION = 1.15;

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT_SHADER = `
uniform sampler2D tFinished;
uniform sampler2D tProof;
uniform vec2 uLens;
uniform vec2 uLensUv;
uniform vec2 uSize;
uniform float uRadius;
uniform float uMag;
uniform float uLensOn;
uniform float uScan;
uniform float uDpr;
varying vec2 vUv;
void main() {
  vec2 pixel = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 offset = abs(pixel - uLens);
  float octagon = max(max(offset.x, offset.y), (offset.x + offset.y) * 0.70710678);
  float inLens = (1.0 - step(uRadius, octagon)) * uLensOn;
  vec4 finished = texture2D(tFinished, vUv);
  vec4 proof = texture2D(tProof, vUv);
  float scanMask = (1.0 - step(0.0, -uScan)) * step(1.0 - vUv.y, uScan);
  vec4 color = mix(finished, proof, scanMask);
  vec2 magnified = uLensUv + (vUv - uLensUv) / uMag;
  float line = (1.0 - smoothstep(0.0, 0.004, abs((1.0 - vUv.y) - uScan))) * (1.0 - step(0.0, -uScan));
  color = mix(color, vec4(pow(vec3(1.0, 0.31, 0.816), vec3(2.2)), 1.0), line);
  color = mix(color, texture2D(tProof, magnified), inLens);
  gl_FragColor = color;
  #include <colorspace_fragment>
}`;

function makeTexture(canvas: HTMLCanvasElement, maxAnisotropy: number): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = Math.min(4, maxAnisotropy);
  return texture;
}

export async function createHeroGl(
  canvas: HTMLCanvasElement,
  controller: HeroController,
): Promise<boolean> {
  await Promise.all([
    document.fonts.load('600 54px Fraunces'),
    document.fonts.load('400 17px Inter'),
    document.fonts.load('500 15px Inter'),
    document.fonts.load('600 17px Inter'),
    document.fonts.load('400 11px "JetBrains Mono"'),
    document.fonts.load('600 11px "JetBrains Mono"'),
  ]);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return false;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const texts = readDemoTexts(controller.stage);
  const finishedCanvas = document.createElement('canvas');
  const proofCanvas = document.createElement('canvas');
  drawDemoTexture(finishedCanvas, texts, false, TEXTURE_SCALE);
  drawDemoTexture(proofCanvas, texts, true, TEXTURE_SCALE);
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  const uniforms = {
    tFinished: { value: makeTexture(finishedCanvas, maxAnisotropy) },
    tProof: { value: makeTexture(proofCanvas, maxAnisotropy) },
    uLens: { value: new Vector2(-1000, -1000) },
    uLensUv: { value: new Vector2(0.5, 0.5) },
    uSize: { value: new Vector2(1, 1) },
    uRadius: { value: 100 },
    uMag: { value: LENS_MAGNIFICATION },
    uLensOn: { value: 0 },
    uScan: { value: -1 },
    uDpr: { value: dpr },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });
  const mesh = new Mesh(new PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT), material);
  const scene = new Scene();
  scene.add(mesh);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const projected = new Vector3();

  let width = 1;
  let height = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    uniforms.uSize.value.set(width, height);
    camera.aspect = width / height;
    const tan = Math.tan((FOV * Math.PI) / 360);
    const distance = Math.max(
      PLANE_HEIGHT / (0.86 * 2 * tan),
      PLANE_WIDTH / (0.9 * 2 * tan * camera.aspect),
    );
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
    mesh.updateMatrixWorld();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const surface: Surface = {
    toDesign(stageX, stageY): Point | null {
      ndc.set((stageX / width) * 2 - 1, -(stageY / height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(mesh)[0];
      if (!hit?.uv) return null;
      return { x: hit.uv.x * DEMO_WIDTH, y: (1 - hit.uv.y) * DEMO_HEIGHT };
    },
    fromDesign(designX, designY): Point | null {
      projected.set(
        (designX / DEMO_WIDTH - 0.5) * PLANE_WIDTH,
        (0.5 - designY / DEMO_HEIGHT) * PLANE_HEIGHT,
        0,
      );
      mesh.localToWorld(projected);
      projected.project(camera);
      return { x: ((projected.x + 1) / 2) * width, y: ((1 - projected.y) / 2) * height };
    },
  };

  let tiltX = BASE_TILT_X;
  let tiltY = BASE_TILT_Y;
  let lensX = -1000;
  let lensY = -1000;
  let radius = 100;
  let lensOn = 0;
  let scan = -1;
  let isActive = true;
  let isRunning = false;

  controller.onChange((state) => {
    lensX = state.x;
    lensY = state.y;
    radius = state.radius;
    lensOn = state.on ? 1 : 0;
    scan = state.scan;
  });

  const draw = () => {
    const pointer = controller.pointerRatio();
    const targetX = BASE_TILT_X + (pointer.y - 0.5) * 2 * MAX_MOUSE_TILT;
    const targetY = BASE_TILT_Y - (pointer.x - 0.5) * 2 * MAX_MOUSE_TILT * 0.5;
    tiltX += (targetX - tiltX) * 0.08;
    tiltY += (targetY - tiltY) * 0.08;
    mesh.rotation.set(tiltX, tiltY, 0);
    mesh.updateMatrixWorld();
    const lensUv = new Vector2(0.5, 0.5);
    ndc.set((lensX / width) * 2 - 1, -(lensY / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(mesh)[0];
    if (hit?.uv) lensUv.copy(hit.uv);
    uniforms.uLensUv.value.copy(lensUv);
    uniforms.uLens.value.set(lensX, lensY);
    uniforms.uRadius.value = radius;
    uniforms.uLensOn.value = lensOn;
    uniforms.uScan.value = scan;
    renderer.render(scene, camera);
  };

  const loop = () => {
    if (!isActive || document.hidden) {
      isRunning = false;
      return;
    }
    draw();
    requestAnimationFrame(loop);
  };
  const wake = () => {
    if (isRunning) return;
    isRunning = true;
    requestAnimationFrame(loop);
  };

  new IntersectionObserver(([entry]) => {
    isActive = entry.isIntersecting;
    if (isActive) wake();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
  });

  draw();
  controller.setSurface(surface);
  wake();
  return true;
}

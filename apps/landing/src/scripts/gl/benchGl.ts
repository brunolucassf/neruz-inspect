import type { StageController, StageFrame } from '../stage/rig';

const MAX_DPR = 1.5;
const PERSPECTIVE = 1600;
const DEG = Math.PI / 180;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uDpr;
uniform vec2 uCenter;
uniform mat3 uInverse;
uniform float uScale;
uniform float uFloor;
uniform float uGrid;
uniform vec2 uHalf;
uniform vec2 uLight;
uniform float uLightStrength;
out vec4 outColor;

void main() {
  vec2 pixel = vec2(gl_FragCoord.x / uDpr, uSize.y - gl_FragCoord.y / uDpr);
  vec3 origin = uInverse * vec3(0.0, 0.0, ${PERSPECTIVE.toFixed(1)});
  vec3 direction = uInverse * vec3(pixel - uCenter, -${PERSPECTIVE.toFixed(1)});
  if (abs(direction.z) < 1e-4) { outColor = vec4(0.0); return; }
  float travel = (uFloor * uScale - origin.z) / direction.z;
  if (travel <= 0.0) { outColor = vec4(0.0); return; }
  vec2 hit = (origin.xy + direction.xy * travel) / uScale;

  float reach = length(hit / uHalf);
  float fade = 1.0 - smoothstep(1.1, 3.2, reach);

  vec2 cell = hit / uGrid;
  vec2 distanceToLine = abs(fract(cell - 0.5) - 0.5) / max(fwidth(cell), vec2(1e-4));
  float line = (1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0)) * fade;

  vec2 box = abs(hit) - uHalf * 0.94;
  float edge = length(max(box, 0.0)) + min(max(box.x, box.y), 0.0);
  float blur = uHalf.y * 0.42;
  float shadow = (1.0 - smoothstep(-blur * 0.35, blur, edge)) * 0.5;

  vec2 toLight = (hit - uLight) / (uHalf.x * 0.55);
  float light = exp(-dot(toLight, toLight)) * 0.08 * uLightStrength;

  vec3 color = vec3(0.0);
  float alpha = shadow;
  float gridAlpha = line * 0.16;
  color = color * (1.0 - gridAlpha) + vec3(0.651, 0.71, 0.773) * gridAlpha;
  alpha = alpha + gridAlpha * (1.0 - alpha);
  color = color * (1.0 - light) + vec3(1.0, 0.31, 0.816) * light;
  alpha = alpha + light * (1.0 - alpha);
  outColor = vec4(color, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function inverseRotation(frame: StageFrame): Float32Array {
  const [cx, sx] = [Math.cos(frame.rotateX * DEG), Math.sin(frame.rotateX * DEG)];
  const [cy, sy] = [Math.cos(frame.rotateY * DEG), Math.sin(frame.rotateY * DEG)];
  const [cz, sz] = [Math.cos(frame.rotateZ * DEG), Math.sin(frame.rotateZ * DEG)];
  const rotation = [
    [cy * cz, -cy * sz, sy],
    [sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy],
    [-cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy],
  ];
  const columnMajorTranspose = new Float32Array(9);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      columnMajorTranspose[row * 3 + column] = rotation[row][column];
    }
  }
  return columnMajorTranspose;
}

export function createBench(canvas: HTMLCanvasElement, stage: StageController): boolean {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return false;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return false;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const locations = {
    size: uniform('uSize'),
    dpr: uniform('uDpr'),
    center: uniform('uCenter'),
    inverse: uniform('uInverse'),
    scale: uniform('uScale'),
    floor: uniform('uFloor'),
    grid: uniform('uGrid'),
    half: uniform('uHalf'),
    light: uniform('uLight'),
    lightStrength: uniform('uLightStrength'),
  };

  let pending: StageFrame | null = null;
  let isScheduled = false;
  let dpr = 1;

  const resize = (frame: StageFrame) => {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const width = Math.round(frame.width * dpr);
    const height = Math.round(frame.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = () => {
    isScheduled = false;
    const frame = pending;
    if (!frame) return;
    resize(frame);
    const unit = frame.rigWidth / 960;
    gl.uniform2f(locations.size, frame.width, frame.height);
    gl.uniform1f(locations.dpr, dpr);
    gl.uniform2f(locations.center, frame.centerX, frame.centerY);
    gl.uniformMatrix3fv(locations.inverse, false, inverseRotation(frame));
    gl.uniform1f(locations.scale, frame.scale);
    gl.uniform1f(locations.floor, -150 * unit);
    gl.uniform1f(locations.grid, 40 * unit);
    gl.uniform2f(locations.half, frame.rigWidth / 2, frame.rigHeight / 2);
    gl.uniform2f(locations.light, frame.lightX, frame.lightY);
    gl.uniform1f(locations.lightStrength, frame.lightStrength);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  stage.onFrame((frame) => {
    pending = frame;
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(draw);
  });
  return true;
}

// Couche heatmap (WebGL2) : affiche la grille quantifiée renvoyée par /api/heatmap
// (canal R = liquidité acheteuse, G = vendeuse) à sa place temps/prix dans le graphique.
const VERT = `#version 300 es
in vec2 a_pos;
uniform vec4 u_rect; // x0, y0, x1, y1 en coordonnées de découpage
out vec2 v_uv;
void main() {
  v_uv = a_pos;
  gl_Position = vec4(mix(u_rect.x, u_rect.z, a_pos.x), mix(u_rect.y, u_rect.w, a_pos.y), 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform float u_gamma;
in vec2 v_uv;
out vec4 outColor;

// Noir mat -> ardoise -> givre -> braise -> blanc : la couleur chaude signale les gros murs.
vec3 ramp(float t) {
  vec3 c0 = vec3(0.043, 0.043, 0.043);
  vec3 c1 = vec3(0.224, 0.247, 0.337);
  vec3 c2 = vec3(0.714, 0.839, 1.000);
  vec3 c3 = vec3(1.000, 0.631, 0.424);
  vec3 c4 = vec3(1.000, 1.000, 1.000);
  if (t < 0.45) return mix(c0, c1, t / 0.45);
  if (t < 0.75) return mix(c1, c2, (t - 0.45) / 0.30);
  if (t < 0.92) return mix(c2, c3, (t - 0.75) / 0.17);
  return mix(c3, c4, (t - 0.92) / 0.08);
}

void main() {
  vec2 v = texture(u_tex, v_uv).rg;
  float q = v.r + v.g;
  float t = clamp(q, 0.0, 1.0);
  vec3 c = ramp(pow(t, u_gamma));
  float s = (v.r - v.g) / max(q, 1e-6);
  vec3 tint = s > 0.0 ? vec3(0.85, 1.05, 0.95) : vec3(1.06, 0.88, 0.88);
  outColor = vec4(c * mix(vec3(1.0), tint, abs(s) * 0.5), 1.0);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

export class HeatLayer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 non disponible');
    this.gl = gl;
    this.canvas = canvas;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    this.prog = prog;
    this.uRect = gl.getUniformLocation(prog, 'u_rect');
    this.uGamma = gl.getUniformLocation(prog, 'u_gamma');
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    this.uploaded = null;
  }

  clear() {
    const { gl } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.043, 0.043, 0.043, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  draw(scale, heat, { gamma, bucket }) {
    this.clear();
    if (!heat || !heat.data?.length || heat.cols * heat.rows * 2 !== heat.data.length) return;
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    if (this.uploaded !== heat) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, heat.cols, heat.rows, 0, gl.RG, gl.UNSIGNED_BYTE, heat.data);
      this.uploaded = heat;
    }
    const cx = (x) => (x / scale.w) * 2 - 1;
    const cy = (y) => 1 - (y / scale.h) * 2;
    const x0 = cx(scale.xOfTime(heat.from));
    const x1 = cx(scale.xOfTime(heat.to));
    const yBottom = cy(scale.yOfPrice(heat.rowLo * bucket));
    const yTop = cy(scale.yOfPrice(heat.rowTop * bucket));
    gl.useProgram(this.prog);
    gl.uniform4f(this.uRect, x0, yBottom, x1, yTop);
    gl.uniform1f(this.uGamma, gamma);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}


/* jshint multistr: true */
'use strict';

var StageShader = require('./StageShader');
var __inherit = require('../Inherit').__inherit;
function TrialStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
};
__inherit(TrialStage, StageShader);

TrialStage.prototype._FSHADER = {};
TrialStage.prototype._FSHADER.type = 'x-shader/x-fragment';
TrialStage.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying vec4  vShadowDepth;\
  varying float vAlpha;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  const int num = 8;\
  const int unitAngle = 360 / num;\
\
  vec2 getVec2(vec3 v) {\
    if(vPosition.y == 0.0 || vPosition.y >= 2.0 * uWidth - 0.1)\
      return v.xz;\
    if(vPosition.x <= -uWidth + 0.1 || vPosition.x >= uWidth - 0.1)\
      return v.yz;\
    return v.xy;\
  }\
\
  vec2 getPosition(int unitAngle, float uTime, int i) {\
    float ax = abs(mod(uTime*0.4, 100.0) - 50.0);\
    float ay = abs(mod(uTime*0.6, 100.0) - 50.0);\
    float rad = radians(float(unitAngle * i) + uTime*1.0);\
    vec2 val = vec2(0, 0);\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
      val += getVec2(uModelCenterPosition[i]);\
    }\
    val = val / float(uModelNum);\
    float x = val.x + ax * cos(rad);\
    float y = val.y + ay * sin(rad);\
    return vec2(x, y);\
  }\
\
  void main() {\
    float color = 0.0;\
    vec2 val = getVec2(vPosition);\
    for(int i = 0; i < num; i++) {\
      vec2 pos = getPosition(unitAngle, uFrame, i);\
      float dist = length(val - pos) * 6.0;\
      color += 5.0 / dist;\
    }\
\
    float visibility = 1.0;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
      if(depth != 0.0) {\
        visibility = 0.5;\
      }\
    }\
\
    gl_FragColor = vec4(vec3(color)*visibility, vAlpha);\
  }\
';



TrialStage.prototype._initBuffers = function(shader, gl) {
  var w = 100.0;
  var positions = [
    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  w*2,  w,
     w,  w*2,  w,
    -w,  0.0,  w,
     w,  0.0,  w,

    -w,  0.0, -w,
     w,  0.0, -w,
    -w,  w*2, -w,
     w,  w*2, -w,

     w,  0.0, -w,
     w,  0.0,  w,
     w,  w*2, -w,
     w,  w*w,  w,

    -w,  w*2, -w,
    -w,  w*2,  w,
    -w,  0.0, -w,
    -w,  0.0,  w,

    -w,  w*2, -w,
     w,  w*2, -w,
    -w,  w*2,  w,
     w,  w*2,  w,
  ];

  var indices = [
     0,  1,  2,
     3,  2,  1,

     6,  5,  4,
     5,  6,  7,

     8,  9, 10,
    11, 10,  9,

    12, 13, 14,
    15, 14, 13,

    16, 17, 18,
    19, 18, 17,

    20, 21, 22,
    23, 22, 21,

    24, 25, 26,
    27, 26, 25,
  ];

  var alphas = [
    1.0, 1.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.5,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
  ];

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  pBuffer.itemSize = 3;

  var aBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);
  aBuffer.itemSize = 1;

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                gl.STATIC_DRAW);
  iBuffer.itemNum = indices.length;

  shader.width = w;
  shader.pBuffer = pBuffer;
  shader.aBuffer = aBuffer;
  shader.iBuffer = iBuffer;
};

module.exports = TrialStage;

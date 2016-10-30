/* jshint multistr: true */
'use strict';

var __inherit = require('../Inherit').__inherit;

var StageShader = require('./StageShader');
function SimpleStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
}
__inherit(SimpleStage, StageShader);

SimpleStage.prototype._FSHADER = {};
SimpleStage.prototype._FSHADER.type = 'x-shader/x-fragment';
SimpleStage.prototype._FSHADER.src = '\
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
  void main() {\
    float r = cos(vPosition.x);\
    float g = cos(vPosition.z);\
    vec4 color = vec4(vec3(r*g), vAlpha);\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth != 0.0) {\
        color.rgb *= 0.5;\
      }\
    }\
    gl_FragColor = color;\
  }\
';

module.exports = SimpleStage;

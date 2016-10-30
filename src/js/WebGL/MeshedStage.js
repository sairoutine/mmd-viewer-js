
/* jshint multistr: true */

'use strict';

var StageShader = require('./StageShader');
var __inherit = require('../Inherit').__inherit;
function MeshedStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
}
__inherit(MeshedStage, StageShader);


MeshedStage.prototype._FSHADER = {};
MeshedStage.prototype._FSHADER.type = 'x-shader/x-fragment';
MeshedStage.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying float vAlpha;\
  varying vec4  vShadowDepth;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  const float tileSize = 5.0;\
  const float pi = 3.1415926535;\
  const float circleRatio = 0.01;\
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
  vec2 getTile(vec2 pos) {\
    return floor((pos + uWidth + (tileSize * 0.5)) / tileSize);\
  }\
\
  void main() {\
    vec3 pos = vPosition / uWidth;\
    float s = cos(uFrame/(pi*2.0));\
    float b = 0.0;\
    float alpha = vAlpha;\
    vec2 tile = getTile(vPosition.xz);\
    float visibility = 1.0;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth != 0.0) {\
        visibility = 0.5;\
      }\
    }\
\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
\
      vec2 ctile = getTile(uModelCenterPosition[i].xz);\
      vec2 ltile = getTile(uModelLeftFootPosition[i].xz);\
      vec2 rtile = getTile(uModelRightFootPosition[i].xz);\
\
      if(tile == ltile || tile == rtile) {\
        gl_FragColor = vec4(vec3(1.0, 0.5, 0.5)*s*visibility, alpha);\
        return;\
      }\
    }\
\
    tile = vec2(mod(tile.x, 2.0), mod(tile.y, 2.0));\
\
    if(pos.x * pos.x+ pos.z * pos.z > circleRatio) {\
      b = 0.8;\
    }\
\
    if(tile == vec2(0.0) || tile == vec2(1.0)) {\
      gl_FragColor = vec4((vec3(1.0)+b)*visibility, alpha);\
    } else {\
      gl_FragColor = vec4((vec3(0.0)+b)*visibility, alpha);\
    }\
  }\
';

module.exports = MeshedStage;

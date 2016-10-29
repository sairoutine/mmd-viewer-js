'use strict';

function LowResolutionEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
};
__inherit(LowResolutionEffect, PostEffect);


/* from http://clemz.io/article-retro-shaders-rayman-legends */
LowResolutionEffect.prototype._FSHADER = {};
LowResolutionEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
LowResolutionEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 50.0;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = gl_FragCoord.st * st;\
    pos = floor(pos * n) / n;\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';
module.exports = LowResolutionEffect;

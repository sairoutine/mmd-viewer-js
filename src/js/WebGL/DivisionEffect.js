
/* jshint multistr: true */
'use strict';
var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;

function DivisionEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
}
__inherit(DivisionEffect, PostEffect);


/* from http://clemz.io/article-retro-shaders-rayman-legends */
DivisionEffect.prototype._FSHADER = {};
DivisionEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
DivisionEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 2.0;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = mod(gl_FragCoord.st * st, 1.0 / n) * n;\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';
module.exports = DivisionEffect;

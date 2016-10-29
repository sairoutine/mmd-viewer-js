'use strict';

function GaussianBlurEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 2);
};
__inherit(GaussianBlurEffect, PostEffect);

GaussianBlurEffect.prototype._FSHADER = {};
GaussianBlurEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
// from: http://wgld.org/d/webgl/w057.html
GaussianBlurEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
  uniform float     uWeight[10];\
  uniform bool      uIsX;\
\
void main(void){\
  vec2 st = vec2(1.0/uWidth, 1.0/uHeight);\
  vec2 fc = gl_FragCoord.st;\
  vec4 color = vec4(0.0);\
\
  if(uIsX){\
    color += texture2D(uSampler, (fc + vec2(-9.0, 0.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(-8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(-7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(-6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(-5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(-4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(-3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(-2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(-1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 0.0, 0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2( 1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2( 3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2( 4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2( 5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2( 6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2( 7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2( 8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2( 9.0, 0.0)) * st) * uWeight[9];\
  }else{\
    color += texture2D(uSampler, (fc + vec2(0.0, -9.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(0.0, -8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0, -7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0, -6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0, -5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0, -4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0, -3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0, -2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0, -1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2(0.0,  1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0,  3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0,  4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0,  5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0,  6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0,  7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0,  8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0,  9.0)) * st) * uWeight[9];\
  }\
  gl_FragColor = color;\
}\
';


GaussianBlurEffect.prototype._initUniforms = function(shader, gl) {
  this.parent.prototype._initUniforms.call(this, shader, gl);

  shader.isXUniformLocation =
    gl.getUniformLocation(shader, 'uIsX');
  shader.weightUniformLocation =
    gl.getUniformLocation(shader, 'uWeight');
};


GaussianBlurEffect.prototype._initParams = function(shader, gl) {
  this.parent.prototype._initParams.call(this, shader, gl);

  var weight = [];
  this._getGaussianWeight(weight, 10, 25);
  shader.weight = weight;
};


__copyParentMethod(GaussianBlurEffect, PostEffect, '_setUniforms');
GaussianBlurEffect.prototype._setUniforms = function(n, params) {
  this.PostEffect_setUniforms(n, params);

  var shader = this.shader;
  var gl = this.layer.gl;

  gl.uniform1fv(shader.weightUniformLocation, shader.weight);
  gl.uniform1i(shader.isXUniformLocation, n == 0 ? 1 : 0);
};

module.exports = GaussianBlurEffect;

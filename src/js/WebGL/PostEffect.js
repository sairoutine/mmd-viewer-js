
/* global mat4,mat3,alert,vec3,quat4 */
/* jshint multistr: true */
'use strict';

function PostEffect(layer, pathNum) {
  this.layer = layer;
  this.shader = null;
  this.pathNum = pathNum;
  this._init();
};

// for reference
PostEffect.prototype.Math = Math;
PostEffect.prototype.mat4 = mat4;
PostEffect.prototype.vec3 = vec3;
PostEffect.prototype.quat4 = quat4;


PostEffect.prototype._VSHADER = {};
PostEffect.prototype._VSHADER.type = 'x-shader/x-vertex';
PostEffect.prototype._VSHADER.src = '\
  attribute vec3 aPosition;\
  uniform   mat4 uMvpMatrix;\
\
  void main() {\
    gl_Position = uMvpMatrix * vec4(aPosition, 1.0);\
  }\
';

PostEffect.prototype._FSHADER = {};
PostEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
PostEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    vec2 ts = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec4 color = texture2D(uSampler, gl_FragCoord.st * ts);\
    gl_FragColor = color;\
  }\
';


PostEffect.prototype._init = function() {
  var gl = this.layer.gl;
  this.shader = this._initShader(gl);
  this._initAttributes(this.shader, gl);
  this._initUniforms(this.shader, gl);
  this._initBuffers(this.shader, gl);
  this._initMatrices(this.shader, gl);
  this._initParams(this.shader, gl);
  this._initFrameBuffers(this.shader, gl);
};


PostEffect.prototype._initShader = function(gl) {
  var vertexShader = this._compileShader(this._VSHADER);
  var fragmentShader = this._compileShader(this._FSHADER);

  var shader = gl.createProgram();
  gl.attachShader(shader, vertexShader);
  gl.attachShader(shader, fragmentShader);
  gl.linkProgram(shader);

  if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  return shader;
};


PostEffect.prototype._initAttributes = function(shader, gl) {
  shader.positionAttribute =
    gl.getAttribLocation(shader, 'aPosition');
};


PostEffect.prototype._initUniforms = function(shader, gl) {
  shader.mvpMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uMvpMatrix');
  shader.widthUniformLocation =
    gl.getUniformLocation(shader, 'uWidth');
  shader.heightUniformLocation =
    gl.getUniformLocation(shader, 'uHeight');
  shader.frameUniformLocation =
    gl.getUniformLocation(shader, 'uFrame');
  shader.samplerUniformLocation =
    gl.getUniformLocation(shader, 'uSampler');
  shader.sampler2UniformLocation =
    gl.getUniformLocation(shader, 'uSampler2');

  shader.width = this.layer.canvas.width;
  shader.height = this.layer.canvas.height;
  shader.frame = 0;
};


PostEffect.prototype._initBuffers = function(shader, gl) {
  var positions = [
    -1.0,  1.0,  0.0,
     1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0
  ];

  var indices = [
    0, 1, 2,
    3, 2, 1
  ];

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                gl.STATIC_DRAW);

  shader.pBuffer = pBuffer;
  shader.iBuffer = iBuffer;
};


PostEffect.prototype._initMatrices = function(shader, gl) {
  var mMatrix = this.mat4.create();
  var vMatrix = this.mat4.create();
  var pMatrix = this.mat4.create();
  var vpMatrix = this.mat4.create();
  var mvpMatrix = this.mat4.create();

  this.mat4.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0, 1, 0], vMatrix);
  this.mat4.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);
  this.mat4.multiply(pMatrix, vMatrix, vpMatrix);
  this.mat4.identity(mMatrix);
  this.mat4.multiply(vpMatrix, mMatrix, mvpMatrix);

  shader.mvpMatrix = mvpMatrix;
};


PostEffect.prototype._initFrameBuffers = function(shader, gl) {
  shader.pathNum = this.pathNum;
  shader.frameBuffers = [];
  for(var i = 0; i < shader.pathNum; i++) {
    shader.frameBuffers.push(
      this.layer._createFrameBuffer(shader, gl, shader.width, shader.height));
  }
};


/**
 * override in child class
 */
PostEffect.prototype._initParams = function(shader, gl) {
};


PostEffect.prototype._compileShader = function(params) {
  return this.layer.compileShader(this.layer.gl, params.src, params.type);
};


/**
 * from: http://wgld.org/d/webgl/w057.html
 */
PostEffect.prototype._getGaussianWeight = function(array, length, strength) {
  var t = 0.0;
  var d = strength * strength / 100;
  for(var i = 0; i < length; i++){
    var r = 1.0 + 2.0 * i;
    var w = this.Math.exp(-0.5 * (r * r) / d);
    array[i] = w;
    if(i > 0)
      w *= 2.0;
    t += w;
  }
  for(i = 0; i < length; i++){
    array[i] /= t;
  }
};


PostEffect.prototype._bindAttributes = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, shader.pBuffer);
  gl.enableVertexAttribArray(shader.positionAttribute);
  gl.vertexAttribPointer(shader.positionAttribute,
                         3, gl.FLOAT, false, 0, 0);
};


PostEffect.prototype._bindIndices = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.iBuffer);
};


PostEffect.prototype._setUniforms = function(n, params) {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.uniformMatrix4fv(shader.mvpMatrixUniformLocation, false, shader.mvpMatrix);
  gl.uniform1f(shader.widthUniformLocation, shader.width);
  gl.uniform1f(shader.heightUniformLocation, shader.height);
  gl.uniform1f(shader.frameUniformLocation, shader.frame);
};


PostEffect.prototype.bindFrameBufferForScene = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, shader.frameBuffers[0].f);
};


PostEffect.prototype._bindFrameBuffer = function(n) {
  var shader = this.shader;
  var gl = this.layer.gl;
  var f = (shader.pathNum-1 == n) ? null : shader.frameBuffers[n+1].f;

  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};


PostEffect.prototype._bindFrameTextures = function(n) {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shader.frameBuffers[n].t);
  gl.uniform1i(shader.samplerUniformLocation, 0);

  if(shader.sampler2UniformLocation === null)
    return;

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, shader.frameBuffers[0].t);
  gl.uniform1i(shader.sampler2UniformLocation, 1);
};


PostEffect.prototype._enableConditions = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.enable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
};


/**
 * override in child class.
 */
PostEffect.prototype._setParams = function(n, params) {
};


PostEffect.prototype._draw = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();
};


PostEffect.prototype.draw = function(params) {
  for(var i = 0; i < this.shader.pathNum; i++) {
    this._bindFrameBuffer(i);
    this._bindAttributes();
    this._setUniforms(i, params);
    this._bindIndices();
    this._bindFrameTextures(i);
    this._enableConditions();
    this._draw();
  }
};

module.exports = PostEffect;

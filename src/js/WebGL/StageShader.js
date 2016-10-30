/* jshint multistr: true */
'use strict';

function StageShader(layer) {
  this.layer = layer;
  this.shader = null;
  this._init();
};

StageShader.prototype._VSHADER = {};
StageShader.prototype._VSHADER.type = 'x-shader/x-vertex';
StageShader.prototype._VSHADER.src = '\
  attribute vec3 aPosition;\
  attribute float aAlpha;\
  uniform mat4 uMVMatrix;\
  uniform mat4 uPMatrix;\
  uniform mat4 uLightMatrix;\
  varying vec3 vPosition;\
  varying vec4 vShadowDepth;\
  varying float vAlpha;\
\
  void main() {\
    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);\
    vPosition = aPosition;\
    vAlpha = aAlpha;\
    vShadowDepth = uLightMatrix * vec4(aPosition, 1.0);\
  }\
';

StageShader.prototype._FSHADER = {};
StageShader.prototype._FSHADER.type = 'x-shader/x-fragment';
StageShader.prototype._FSHADER.src = '\
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
    vec4 color = vec4(vec3(0.0), vAlpha);\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth2 - 0.00008 > depth) {\
        color.rgb *= 0.7;\
      }\
    }\
\
    gl_FragColor = color;\
  }\
';


StageShader.prototype._init = function() {
  var gl = this.layer.gl;
  this.shader = this._initShader(gl);
  this._initAttributes(this.shader, gl);
  this._initUniforms(this.shader, gl);
  this._initBuffers(this.shader, gl);
  this._initParams(this.shader, gl);
};


StageShader.prototype._initShader = function(gl) {
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


StageShader.prototype._initAttributes = function(shader, gl) {
  shader.positionAttribute =
    gl.getAttribLocation(shader, 'aPosition');
  shader.alphaAttribute =
    gl.getAttribLocation(shader, 'aAlpha');
};


StageShader.prototype._initUniforms = function(shader, gl) {
  shader.mvMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uMVMatrix');
  shader.pMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uPMatrix');
  shader.widthUniformLocation =
    gl.getUniformLocation(shader, 'uWidth');
  shader.frameUniformLocation =
    gl.getUniformLocation(shader, 'uFrame');
  shader.modelNumUniformLocation =
    gl.getUniformLocation(shader, 'uModelNum');
  shader.modelCenterPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelCenterPosition');
  shader.modelLeftFootPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelLeftFootPosition');
  shader.modelRightFootPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelRightFootPosition');
  shader.lightMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uLightMatrix');
  shader.shadowMappingUniformLocation =
    gl.getUniformLocation(shader, 'uShadowMapping');
  shader.shadowTextureUniformLocation =
    gl.getUniformLocation(shader, 'uShadowTexture');
};


StageShader.prototype._initBuffers = function(shader, gl) {
  var w = 1000.0;
  var positions = [
    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,
  ];

  var indices = [
     0,  1,  2,
     3,  2,  1,

     6,  5,  4,
     5,  6,  7,
  ];

  var alphas = [
    1.0, 1.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.5
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


/**
 * override in child class
 */
StageShader.prototype._initParams = function(shader, gl) {
};


StageShader.prototype._compileShader = function(params) {
  return this.layer.compileShader(this.layer.gl, params.src, params.type);
};


StageShader.prototype._bindAttributes = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.pBuffer);
  gl.enableVertexAttribArray(shader.positionAttribute);
  gl.vertexAttribPointer(shader.positionAttribute,
                         shader.pBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.aBuffer);
  gl.enableVertexAttribArray(shader.alphaAttribute);
  gl.vertexAttribPointer(shader.alphaAttribute,
                         shader.aBuffer.itemSize, gl.FLOAT, false, 0, 0);
};


StageShader.prototype._bindIndices = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.iBuffer);
};


/**
 * TODO: be param flexible
 */
StageShader.prototype._setUniforms = function(frame, num, cPos, lfPos, rfPos,
                                              sFlag, lMatrix) {
  var shader = this.shader;
  var gl = this.layer.gl;

  // TODO: temporal
  gl.uniformMatrix4fv(shader.mvMatrixUniformLocation, false,
                      this.layer.mvMatrix);
  gl.uniformMatrix4fv(shader.pMatrixUniformLocation, false,
                      this.layer.pMatrix);

  gl.uniform1f(shader.frameUniformLocation, frame);
  gl.uniform1f(shader.widthUniformLocation, shader.width);
  gl.uniform1i(shader.modelNumUniformLocation, num);

  if(cPos !== null)
    gl.uniform3fv(shader.modelCenterPositionUniformLocation, cPos);

  if(lfPos !== null)
    gl.uniform3fv(shader.modelLeftFootPositionUniformLocation, lfPos);

  if(rfPos !== null)
    gl.uniform3fv(shader.modelRightFootPositionUniformLocation, rfPos);

  if(sFlag) {
    gl.uniform1i(shader.shadowMappingUniformLocation, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.layer.shadowFrameBuffer.t);
    gl.uniform1i(shader.shadowTextureUniformLocation, 1);
    gl.uniformMatrix4fv(shader.lightMatrixUniformLocation, false, lMatrix);
  } else {
    gl.uniform1i(shader.shadowMappingUniformLocation, 0);
    gl.uniform1i(shader.shadowTextureUniformLocation, 0);
  }

};


StageShader.prototype._enableConditions = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA,
                       gl.ONE_MINUS_SRC_ALPHA,
                       gl.SRC_ALPHA,
                       gl.DST_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
};


StageShader.prototype._draw = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.drawElements(gl.TRIANGLES, shader.iBuffer.itemNum, gl.UNSIGNED_SHORT, 0);
};


/**
 * TODO: be param flexible
 */
StageShader.prototype.draw = function(frame, num, cPos, lfPos, rfPos,
                                      sFlag, lMatrix) {
  this.layer.gl.useProgram(this.shader);
  this._bindAttributes();
  this._setUniforms(frame, num, cPos, lfPos, rfPos, sFlag, lMatrix);
  this._bindIndices();
  this._enableConditions();
  this._draw();
};

module.exports = StageShader;

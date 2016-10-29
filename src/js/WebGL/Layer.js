'use strict';
function Layer(canvas) {
  this.canvas = canvas;
  this.gl = this._initGl(canvas);
  this.shader = this._initShader(this.gl);

  this.viewNear = 0.1;
  this.viewFar = 2000.0;
  this.viewAngle = 60;
  this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
  this.gl.clearDepth(1.0);

  this.stageShaders = [];
  this.postEffects = {};

  this.mvMatrix = this.mat4.create();
  this.pMatrix = this.mat4.create();
  this.mvpMatrix = this.mat4.create();

 // TODO: temporal
  this.lightPosition = [20, 50, -40];
  this.lightCenter = [0, 0, 10];
  this.lightUpDirection = [0, 1, 0];
  this.lightMatrix = this.mat4.create();
  this.shadowFrameBuffer = null;
  this.shadowFrameBufferSize = 1024;

  this._initPostEffects();
  this._initStageShaders();
  this._initShadowFrameBuffer();
};

// only for reference.
Layer.prototype.mat4 = mat4;
Layer.prototype.Math = Math;

Layer.prototype._NAMES = ['webgl', 'experimental-webgl'];

Layer.prototype._BLEND_ALPHA     = 0;
Layer.prototype._BLEND_ALPHA2    = 1;
Layer.prototype._BLEND_ADD_ALPHA = 2;

Layer.prototype._SHADERS = {};

Layer.prototype._SHADERS['shader-vs'] = {};
Layer.prototype._SHADERS['shader-vs'].type = 'x-shader/x-vertex';
Layer.prototype._SHADERS['shader-vs'].src = '\
  attribute vec3 aVertexPosition;\
  attribute vec3 aVertexPosition1;\
  attribute vec3 aVertexPosition2;\
  attribute vec3 aVertexNormal;\
  attribute vec3 aVertexMorph;\
  attribute float aVertexEdge;\
  attribute vec2 aBoneIndices;\
  attribute float aBoneWeight;\
  attribute vec3 aMotionTranslation1;\
  attribute vec3 aMotionTranslation2;\
  attribute vec4 aMotionRotation1;\
  attribute vec4 aMotionRotation2;\
  attribute vec2 aTextureCoordinates;\
\
  uniform mat4 uMVMatrix;\
  uniform mat4 uPMatrix;\
  uniform mat4 uMVPMatrix;\
  uniform mat3 uNMatrix;\
  uniform vec3 uLightColor;\
  uniform vec3 uLightDirection;\
  uniform vec4 uDiffuseColor;\
  uniform vec3 uAmbientColor;\
  uniform vec3 uSpecularColor;\
  uniform float uShininess;\
  uniform int uSkinningType;\
  uniform int uLightingType;\
  uniform int uVTFWidth;\
  uniform sampler2D uVTF;\
  uniform sampler2D uToonTexture;\
  uniform bool uUseToon;\
  uniform bool uEdge;\
  uniform bool uShadow;\
  uniform mat4 uLightMatrix;\
  uniform bool uShadowGeneration;\
  uniform bool uShadowMapping;\
\
  varying vec2 vTextureCoordinates;\
  varying vec4 vLightWeighting;\
  varying vec3 vNormal;\
  varying vec4 vShadowDepth;\
\
  highp float binary32(vec4 rgba) {\
    rgba = floor(255.0 * rgba + 0.5);\
    highp float val;\
    val  = rgba[0];\
    val += rgba[1] / (256.0);\
    val += rgba[2] / (256.0 * 256.0);\
    val += rgba[3] / (256.0 * 256.0 * 256.0);\
    return rgba[0] >= 128.0 ? -(val - 128.0) : val;\
  }\
\
  float getU(float index) {\
    float unit = 1.0 / float(uVTFWidth);\
    return fract(index * unit + unit * 0.5);\
  }\
\
  float getV(float index) {\
    float unit = 1.0 / float(uVTFWidth);\
    return floor(index * unit) * unit + unit * 0.5;\
  }\
\
  vec2 getUV(float index) {\
    float u = getU(index);\
    float v = getV(index);\
    return vec2(u, v);\
  }\
\
  vec4 getVTF(float index) {\
    return texture2D(uVTF, getUV(index));\
  }\
\
  vec3 getMotionTranslation(float bn) {\
    float index = bn * 7.0 + 0.0;\
    highp float x = binary32(getVTF(index+0.0));\
    highp float y = binary32(getVTF(index+1.0));\
    highp float z = binary32(getVTF(index+2.0));\
    return vec3(x, y, z);\
  }\
\
  vec4 getMotionRotation(float bn) {\
    float index = bn * 7.0 + 3.0;\
    highp float x = binary32(getVTF(index+0.0));\
    highp float y = binary32(getVTF(index+1.0));\
    highp float z = binary32(getVTF(index+2.0));\
    highp float w = binary32(getVTF(index+3.0));\
    return vec4(x, y, z, w);\
  }\
\
  vec3 qtransform(vec3 v, vec4 q) {\
    return v + 2.0 * cross(cross(v, q.xyz) - q.w*v, q.xyz);\
  }\
\
  void main() {\
    vec3 pos;\
    vec3 norm;\
    if(uSkinningType == 2) {\
      vec3 v1 = aVertexPosition1 + aVertexMorph;\
      v1 = qtransform(v1, aMotionRotation1) + aMotionTranslation1;\
      norm = qtransform(aVertexNormal, aMotionRotation1);\
      if(aBoneWeight < 0.99) {\
        vec3 v2 = aVertexPosition2 + aVertexMorph;\
        v2 = qtransform(v2, aMotionRotation2) + aMotionTranslation2;\
        pos = mix(v2, v1, aBoneWeight);\
        vec3 n2 = qtransform(aVertexNormal, aMotionRotation2);\
        norm = normalize(mix(n2, norm, aBoneWeight));\
      } else {\
        pos = v1;\
      }\
    } else if(uSkinningType == 1) {\
      float b1 = floor(aBoneIndices.x + 0.5);\
      vec3 v1 = aVertexPosition1 + aVertexMorph;\
      v1 = qtransform(v1, getMotionRotation(b1)) + getMotionTranslation(b1);\
      norm = qtransform(aVertexNormal, getMotionRotation(b1));\
      if(aBoneWeight < 0.99) {\
        float b2 = floor(aBoneIndices.y + 0.5);\
        vec3 v2 = aVertexPosition2 + aVertexMorph;\
        v2 = qtransform(v2, getMotionRotation(b2)) + getMotionTranslation(b2);\
        pos = mix(v2, v1, aBoneWeight);\
        vec3 n2 = qtransform(aVertexNormal, getMotionRotation(b2));\
        norm = normalize(mix(n2, norm, aBoneWeight));\
      } else {\
        pos = v1;\
      }\
    } else {\
      pos = aVertexPosition + aVertexMorph;\
      norm = normalize(aVertexNormal);\
    }\
\
    gl_Position = uMVPMatrix * vec4(pos, 1.0);\
\
    if(uShadowGeneration) {\
      vShadowDepth = gl_Position;\
      return;\
    }\
\
    vTextureCoordinates = aTextureCoordinates;\
    vNormal = normalize(norm);\
\
    if(uShadowMapping) {\
      vShadowDepth = uLightMatrix * vec4(pos, 1.0);\
    }\
\
    if(! uEdge && uLightingType > 0) {\
      vec4 vertexPositionEye4 = uMVMatrix * vec4(pos, 1.0);\
      vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;\
      vec3 vectorToLightSource = normalize(uLightDirection -\
                                           vertexPositionEye3);\
      vec3 normalEye = normalize(uNMatrix * norm);\
      float diffuseLightWeightning = (uShadow)\
                                       ? max(dot(normalEye,\
                                                 vectorToLightSource), 0.0)\
                                       : 1.0;\
      vec3 reflectionVector = normalize(reflect(-vectorToLightSource,\
                                                 normalEye));\
      vec3 viewVectorEye = -normalize(vertexPositionEye3);\
      float rdotv = max(dot(reflectionVector, viewVectorEye), 0.0);\
      float specularLightWeightning = pow(rdotv, uShininess);\
\
      vec3 vLight = uAmbientColor + \
                    uLightColor *\
                      (uDiffuseColor.rgb * diffuseLightWeightning +\
                       uSpecularColor * specularLightWeightning);\
\
      vLightWeighting = clamp(vec4(vLight, uDiffuseColor.a), 0.0, 1.0);\
\
      if(uLightingType == 2 && uUseToon) {\
        vec2 toonCoord = vec2(0.0, 0.5 * (1.0 - dot(uLightDirection,\
                                                    normalEye)));\
        vLightWeighting.rgb *= texture2D(uToonTexture, toonCoord).rgb;\
      }\
    } else {\
      vLightWeighting = uDiffuseColor;\
    }\
\
    /* just copied from MMD.js */\
    if(uEdge) {\
      const float thickness = 0.003;\
      vec4 epos = gl_Position;\
      vec4 epos2 = uMVPMatrix * vec4(pos + norm, 1.0);\
      vec4 enorm = normalize(epos2 - epos);\
      gl_Position = epos + enorm * thickness * aVertexEdge * epos.w;\
    }\
  }\
';

Layer.prototype._SHADERS['shader-fs'] = {};
Layer.prototype._SHADERS['shader-fs'].type = 'x-shader/x-fragment';
Layer.prototype._SHADERS['shader-fs'].src = '\
  precision mediump float;\
  varying vec2 vTextureCoordinates;\
  uniform sampler2D uSampler;\
  uniform bool uEdge;\
  uniform bool uUseSphereMap;\
  uniform bool uUseSphereMapAddition;\
  uniform bool uShadowGeneration;\
  uniform bool uShadowMapping;\
  uniform sampler2D uSphereTexture;\
  uniform sampler2D uShadowTexture;\
  varying vec4 vLightWeighting;\
  varying vec3 vNormal;\
  varying vec4 vShadowDepth;\
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
\
    if(uEdge) {\
      gl_FragColor = vec4(vec3(0.0), vLightWeighting.a);\
      return;\
    }\
\
    if(uShadowGeneration) {\
/*      gl_FragColor = packDepth(gl_FragCoord.z);*/\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      gl_FragColor = packDepth(lightCoord.z);\
      return;\
    }\
\
    vec4 textureColor = texture2D(uSampler, vTextureCoordinates);\
\
    /* just copied from MMD.js */\
    if(uUseSphereMap) {\
      vec2 sphereCood = 0.5 * (1.0 + vec2(1.0, -1.0) * vNormal.xy);\
      vec3 sphereColor = texture2D(uSphereTexture, sphereCood).rgb;\
      if(uUseSphereMapAddition) {\
        textureColor.rgb += sphereColor;\
      } else {\
        textureColor.rgb *= sphereColor;\
      }\
    }\
\
    vec4 color = vLightWeighting * textureColor;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth2 - 0.00002 > depth) {\
        color.rgb *= 0.7;\
      }\
    }\
\
    gl_FragColor = color;\
  }\
';


Layer.prototype._initGl = function(canvas) {
  var names = this._NAMES;
  var context = null;
  for(var i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i], {antialias: true});
    } catch(e) {
      if(context)
        break;
    }
  }
  if(context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
};


Layer.prototype._compileShaderFromDOM = function(gl, id) {
  var script = document.getElementById(id);

  if(!script)
    return null;

  var source = '';
  var currentChild = script.firstChild;
  while(currentChild) {
    if(currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      source += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  return this.compileShader(gl, source, script.type);
};


Layer.prototype.compileShader = function(gl, source, type) {
  var shader;
  if(type == 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if(type == 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};


Layer.prototype._initVertexShader = function(gl) {
  var params = this._SHADERS['shader-vs'];

  // TODO: temporal workaround
  if(this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) <= 0) {
    params.src = params.src.replace('texture2D(uVTF, getUV(index))',
                                    'vec4(0.0)');
    params.src = params.src.replace(
        'vLightWeighting.rgb *= texture2D(uToonTexture, toonCoord).rgb',
        'vLightWeighting.rgb *= vec3(1.0)');
  }

  return this.compileShader(gl, params.src, params.type);
};


Layer.prototype._initFragmentShader = function(gl) {
  var params = this._SHADERS['shader-fs'];
  return this.compileShader(gl, params.src, params.type);
};


Layer.prototype._initShader = function(gl) {
  var vertexShader = this._initVertexShader(gl);
  var fragmentShader = this._initFragmentShader(gl);

  var shader = gl.createProgram();
  gl.attachShader(shader, vertexShader);
  gl.attachShader(shader, fragmentShader);
  gl.linkProgram(shader);

  if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shader);

  shader.vertexPositionAttribute =
    gl.getAttribLocation(shader, 'aVertexPosition');
  shader.vertexPositionAttribute1 =
    gl.getAttribLocation(shader, 'aVertexPosition1');
  shader.vertexPositionAttribute2 =
    gl.getAttribLocation(shader, 'aVertexPosition2');
  shader.vertexMorphAttribute =
    gl.getAttribLocation(shader, 'aVertexMorph');
  shader.vertexEdgeAttribute =
    gl.getAttribLocation(shader, 'aVertexEdge');
  shader.vertexNormalAttribute =
    gl.getAttribLocation(shader, 'aVertexNormal');
  shader.boneWeightAttribute =
    gl.getAttribLocation(shader, 'aBoneWeight');
  shader.boneIndicesAttribute =
    gl.getAttribLocation(shader, 'aBoneIndices');

  shader.motionTranslationAttribute1 =
    gl.getAttribLocation(shader, 'aMotionTranslation1');
  shader.motionTranslationAttribute2 =
    gl.getAttribLocation(shader, 'aMotionTranslation2');
  shader.motionRotationAttribute1 =
    gl.getAttribLocation(shader, 'aMotionRotation1');
  shader.motionRotationAttribute2 =
    gl.getAttribLocation(shader, 'aMotionRotation2');

  shader.textureCoordAttribute = 
    gl.getAttribLocation(shader, 'aTextureCoordinates');

  shader.pMatrixUniform =
    gl.getUniformLocation(shader, 'uPMatrix');
  shader.mvMatrixUniform =
    gl.getUniformLocation(shader, 'uMVMatrix');
  shader.mvpMatrixUniform =
    gl.getUniformLocation(shader, 'uMVPMatrix');
  shader.nMatrixUniform =
    gl.getUniformLocation(shader, 'uNMatrix');

  shader.lightColorUniform =
    gl.getUniformLocation(shader, 'uLightColor');
  shader.lightDirectionUniform =
    gl.getUniformLocation(shader, 'uLightDirection');
  shader.diffuseColorUniform =
    gl.getUniformLocation(shader, 'uDiffuseColor');
  shader.ambientColorUniform =
    gl.getUniformLocation(shader, 'uAmbientColor');
  shader.specularColorUniform =
    gl.getUniformLocation(shader, 'uSpecularColor');
  shader.shininessUniform =
    gl.getUniformLocation(shader, 'uShininess');

  shader.uSamplerUniform =
    gl.getUniformLocation(shader, 'uSampler');

  shader.uSkinningTypeUniform =
    gl.getUniformLocation(shader, 'uSkinningType');
  shader.uLightingTypeUniform =
    gl.getUniformLocation(shader, 'uLightingType');

  shader.uVTFUniform =
    gl.getUniformLocation(shader, 'uVTF');
  shader.uVTFWidthUniform =
    gl.getUniformLocation(shader, 'uVTFWidth');

  shader.useToonUniform =
    gl.getUniformLocation(shader, 'uUseToon');
  shader.toonTextureUniform =
    gl.getUniformLocation(shader, 'uToonTexture');

  shader.edgeUniform =
    gl.getUniformLocation(shader, 'uEdge');
  shader.shadowUniform =
    gl.getUniformLocation(shader, 'uShadow');

  shader.sphereTextureUniform =
    gl.getUniformLocation(shader, 'uSphereTexture');
  shader.useSphereMapUniform =
    gl.getUniformLocation(shader, 'uUseSphereMap');
  shader.useSphereMapAdditionUniform =
    gl.getUniformLocation(shader, 'uUseSphereMapAddition');

  shader.shadowGenerationUniform =
    gl.getUniformLocation(shader, 'uShadowGeneration');
  shader.shadowMappingUniform =
    gl.getUniformLocation(shader, 'uShadowMapping');
  shader.shadowTextureUniform =
    gl.getUniformLocation(shader, 'uShadowTexture');
  shader.lightMatrixUniform =
    gl.getUniformLocation(shader, 'uLightMatrix');

  return shader;
}


/**
 * TODO: temporal
 */
Layer.prototype._initPostEffects = function() {
  this.postEffects['blur']        = new BlurEffect(this);
  this.postEffects['gaussian']    = new GaussianBlurEffect(this);
  this.postEffects['diffusion']   = new DiffusionBlurEffect(this);
  this.postEffects['division']    = new DivisionEffect(this);
  this.postEffects['low_reso']    = new LowResolutionEffect(this);
  this.postEffects['face_mosaic'] = new FaceMosaicEffect(this);
};


Layer.prototype._initStageShaders = function() {
  this.stageShaders[0] = new SimpleStage(this);
  this.stageShaders[1] = new MeshedStage(this);
  this.stageShaders[2] = new TrialStage(this);
};


Layer.prototype._initShadowFrameBuffer = function() {
  var width = this.shadowFrameBufferSize;
  var height = this.shadowFrameBufferSize;
  this.shadowFrameBuffer =
    this._createFrameBuffer(this.shader, this.gl, width, height);
};


Layer.prototype.setMatrixUniforms = function(gl) {
  gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, this.pMatrix);
  gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, this.mvMatrix);
  this.mat4.multiply(this.pMatrix, this.mvMatrix, this.mvpMatrix);
  gl.uniformMatrix4fv(this.shader.mvpMatrixUniform, false, this.mvpMatrix);

  var nMat = mat3.create();
  mat4.toInverseMat3(this.mvMatrix, nMat);
  mat3.transpose(nMat);
  gl.uniformMatrix3fv(this.shader.nMatrixUniform, false, nMat);

  //  TODO: temporal
  var lightDirection = vec3.normalize(vec3.create(this.lightPosition));
  var nMat4 = mat4.create();
  mat3.toMat4(nMat, nMat4);
  mat4.multiplyVec3(nMat4, lightDirection, lightDirection);
  gl.uniform3fv(this.shader.lightDirectionUniform, lightDirection);
}


Layer.prototype.registerLightMatrix = function() {
  this.mat4.multiply(this.pMatrix, this.mvMatrix, this.lightMatrix);
};


Layer.prototype.viewport = function() {
  this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
};


Layer.prototype.clear = function() {
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};


Layer.prototype.perspective = function(angle) {
  this.mat4.perspective(angle, this.gl.viewportWidth / this.gl.viewportHeight,
                        this.viewNear, this.viewFar, this.pMatrix);
  this.pMatrix[0] *= -1; // TODO: temporal workaround
};


Layer.prototype.ortho = function(near, far) {
  this.mat4.ortho(0, this.gl.viewportWidth, -this.gl.viewportHeight, 0,
                  near, far, this.pMatrix);
};


Layer.prototype.lookAt = function(eye, center, up) {
  this.mat4.lookAt(eye, center, up, this.mvMatrix);
};


Layer.prototype.identity = function() {
  this.mat4.identity(this.mvMatrix);
};


/**
 * pre_multiplied argument is a last resort.
 */
Layer.prototype.generateTexture = function(image) {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
//  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
//  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};


Layer.prototype.pourVTF = function(texture, array, width) {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, width, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, array);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.uniform1i(this.shader.uVTFWidthUniform, width);
};


Layer.prototype._createFrameBuffer = function(shader, gl, width, height) {
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  var depthRenderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                             gl.RENDERBUFFER, depthRenderBuffer);

  var fTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                          gl.TEXTURE_2D, fTexture, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {f: frameBuffer, d: depthRenderBuffer, t: fTexture};
};


Layer.prototype.draw = function(texture, blend, num, offset) {
  if(! offset)
    offset = 0;

  var gl = this.gl;
  var shader = this.shader;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(shader.uSamplerUniform, 0);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  this.setMatrixUniforms(gl);
  gl.drawElements(gl.TRIANGLES, num, gl.UNSIGNED_SHORT, offset*2);
};


/**
 * TODO: gl.bufferSubData and pratial update could improve
 *       CPU-GPU transfer performance.
 */
Layer.prototype.pourArrayBuffer = function(buffer, array, itemSize, numItems) {
  var gl = this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
  buffer.itemSize = itemSize;
  buffer.numItems = numItems;
};


Layer.prototype.pourElementArrayBuffer = function(buffer, array, itemSize,
                                                  numItems) {
  var gl = this.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
  buffer.itemSize = itemSize;
  buffer.numItems = numItems;
};


Layer.prototype.createFloatArray = function(num) {
  return new Float32Array(num);
};


Layer.prototype.createUintArray = function(num) {
  return new Uint16Array(num);
};


Layer.prototype.createUint8Array = function(num) {
  return new Uint8Array(num);
};


Layer.prototype.createBuffer = function() {
  return this.gl.createBuffer();
};


Layer.prototype.calculateSquareValue = function(num) {
  var val = 1;
  while(num > val) {
    val = val << 1;
  }
  return val;
};


Layer.prototype.calculateVTFWidth = function(num) {
  var val = 1;
  while(num > val * val) {
    val = val * 2;
  }
  return val;
};

module.exports = Layer;

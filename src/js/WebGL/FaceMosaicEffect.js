'use strict';

/* the idea is from https://github.com/i-saint/Unity5Effects */
function FaceMosaicEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
};
__inherit(FaceMosaicEffect, PostEffect);


FaceMosaicEffect.prototype._FSHADER = {};
FaceMosaicEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
FaceMosaicEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform int   uModelNum;\
  uniform vec3  uModelFacePositions[5];\
  uniform float uModelFaceAngles[5];\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 50.0;\
    const float xSize = 0.05;\
    const float ySize = 0.02;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = gl_FragCoord.st * st;\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
\
      vec3 fpos = uModelFacePositions[i];\
      float angle = uModelFaceAngles[i];\
      vec2 dpos = pos - fpos.xy;\
      vec2 apos = vec2( dpos.x * cos(angle) + dpos.y * sin(angle), \
                       -dpos.x * sin(angle) + dpos.y * cos(angle));\
      if(apos.x > -xSize / fpos.z && \
         apos.x <  xSize / fpos.z && \
         apos.y > -ySize / fpos.z && \
         apos.y <  ySize / fpos.z) {\
        pos = floor(pos * n) / n;\
        break;\
      }\
    }\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';


FaceMosaicEffect.prototype._initUniforms = function(shader, gl) {
  this.parent.prototype._initUniforms.call(this, shader, gl);

  shader.modelNumUniformLocation =
    gl.getUniformLocation(shader, 'uModelNum');
  shader.modelFacePositionsUniformLocation =
    gl.getUniformLocation(shader, 'uModelFacePositions');
  shader.modelFaceAnglesUniformLocation =
    gl.getUniformLocation(shader, 'uModelFaceAngles');
};


/**
 * TODO: temporal
 */
__copyParentMethod(FaceMosaicEffect, PostEffect, '_setUniforms');
FaceMosaicEffect.prototype._setUniforms = function(n, params) {
  this.PostEffect_setUniforms(n);

  var shader = this.shader;
  var gl = this.layer.gl;

  var view = params; // PMDView

  var mvMatrix = this.layer.mvMatrix;
  var pMatrix = this.layer.pMatrix;
  var mvpMatrix = this.mat4.create();

  this.mat4.multiply(pMatrix, mvMatrix, mvpMatrix);

  var width = this.layer.gl.width;
  var height = this.layer.gl.height;
  var near = 0.1;
  var far = 2000.0;

  var num = 0;
  var array = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var angles = [0, 0, 0, 0, 0];
  for(var i = 0; i < view.getModelNum(); i++) {
    var v = view.modelViews[i];
    var le = v.pmd.leftEyeBone;
    var re = v.pmd.rightEyeBone;

    if(le.id === null || re.id === null)
      continue;

    var a1 = v.skinningOneBone(le);
    var a2 = v.skinningOneBone(re);
    a1[3] = 1.0;
    a2[3] = 1.0;

    var a = [(a1[0] + a2[0]) / 2.0,
             (a1[1] + a2[1]) / 2.0,
             (a1[2] + a2[2]) / 2.0,
             1.0];

    this.mat4.multiplyVec4(mvpMatrix, a, a)
    this.mat4.multiplyVec4(mvpMatrix, a1, a1)
    this.mat4.multiplyVec4(mvpMatrix, a2, a2)

    a[0] = a[0] / a[3];
    a[1] = a[1] / a[3];
    a[2] = a[2] / a[3];
    a[0] = (a[0] + 1.0) / 2.0;
    a[1] = (a[1] + 1.0) / 2.0;
    a[2] = (a[2] + 1.0) / 2.0;
    a1[0] = a1[0] / a1[3];
    a1[1] = a1[1] / a1[3];
    a1[2] = a1[2] / a1[3];
    a1[0] = (a1[0] + 1.0) / 2.0;
    a1[1] = (a1[1] + 1.0) / 2.0;
    a1[2] = (a1[2] + 1.0) / 2.0;
    a2[0] = a2[0] / a2[3];
    a2[1] = a2[1] / a2[3];
    a2[2] = a2[2] / a2[3];
    a2[0] = (a2[0] + 1.0) / 2.0;
    a2[1] = (a2[1] + 1.0) / 2.0;
    a2[2] = (a2[2] + 1.0) / 2.0;

    var angle = this.Math.atan2(a2[1] - a1[1], a2[0] - a1[0]);

    angles[num] = angle;
    array[num*3+0] = a[0];
    array[num*3+1] = a[1];
    array[num*3+2] = a[2];
    num++;
  }

  gl.uniform3fv(shader.modelFacePositionsUniformLocation, array);
  gl.uniform1fv(shader.modelFaceAnglesUniformLocation, angles);
  gl.uniform1i(shader.modelNumUniformLocation, num);
};

module.exports = FaceMosaicEffect;

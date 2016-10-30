'use strict';
function PMDVertex(id) {
  this.id = id;
  this.position = null;
  this.normal = null;
  this.uv = null;
  this.boneIndices = null;
  this.boneWeight = null;
  this.edgeFlag = null;
  this.boneWeightFloat1 = null;
  this.boneWeightFloat2 = null;
}


PMDVertex.prototype.setup = function() {
  this.boneWeightFloat1 = this.boneWeight/100;
  this.boneWeightFloat2 = (100-this.boneWeight)/100;
};


PMDVertex.prototype.dump = function() {
  var str = '';
  str += 'id: '          + this.id          + '\n';
  str += 'position: '    + this.position    + '\n';
  str += 'normal: '      + this.normal      + '\n';
  str += 'uv: '          + this.uv          + '\n';
  str += 'boneIndices: ' + this.boneIndices + '\n';
  str += 'boneWeight: '  + this.boneWeight  + '\n';
  str += 'edgeFlag: '    + this.edgeFlag    + '\n';
  return str;
};


PMDVertex.prototype.toRight = function() {
  this.position[2] = -this.position[2];
  this.normal[2] = -this.normal[2];
};
module.exports = PMDVertex;

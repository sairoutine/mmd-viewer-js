'use strict';
function PMDFace(id) {
  this.id = id;
  this.name = null;
  this.vertexCount = null;
  this.type = null;
  this.vertices = null;
  this.done = false;

  this.motionIndex = null; // Note: be set by VMD;
                           // TODO: remove and use id in VMD
                           //       instead of motionIndex
                           //       not to have VMD related info here
};


PMDFace.prototype.dump = function() {
  var str = '';
  str += 'id: ' + this.id + '\n';
  str += 'name: ' + this.name + '\n';
  str += 'vertexCount: ' + this.vertexCount + '\n';
  str += 'type: ' + this.type + '\n';

  for(var i = 0; i < this.vertices.length; i++) {
    str += this.vertices[i].dump();
  }

  return str;
};


PMDFace.prototype.toRight = function() {
  for(var i = 0; i < this.vertices.length; i++) {
    this.vertices[i].toRight();
  }
};

module.exports = PMDFace;

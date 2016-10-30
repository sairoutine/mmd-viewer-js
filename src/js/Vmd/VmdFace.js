 'use strict';

function VMDFace(id) {
  this.id = id;
  this.name = null;
  this.frameNum = null;
  this.weight = null;
}


VMDFace.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDFace.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'name: '     + this.name     + '\n';
  str += 'frameNum: ' + this.frameNum + '\n';
  str += 'weight: '   + this.weight   + '\n';
  return str;
};

module.exports = VMDFace;

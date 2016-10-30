'use strict';

function VMDMotion(id) {
  this.id = id;
  this.boneName = null;
  this.frameNum = null;
  this.location = null;
  this.rotation = null;
  this.interpolation = null;
}


VMDMotion.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDMotion.prototype.dump = function() {
  var str = '';
  str += 'id: '            + this.id            + '\n';
  str += 'boneName: '      + this.boneName      + '\n';
  str += 'frameNum: '      + this.frameNum      + '\n';
  str += 'location: '      + this.location      + '\n';
  str += 'rotation: '      + this.rotation      + '\n';
  str += 'interpolation: ' + this.interpolation + '\n';
  return str;
};

module.exports = VMDMotion;

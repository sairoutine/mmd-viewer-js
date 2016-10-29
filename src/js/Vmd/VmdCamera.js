'use strict';

function VMDCamera(id) {
  this.id = id;
  this.frameNum = null;
  this.length = null;
  this.location = null;
  this.rotation = null;
  this.interpolation = null;
  this.angle = null;
  this.perspective = null;
};


VMDCamera.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDCamera.prototype.dump = function() {
  var str = '';
  str += 'id: '            + this.id            + '\n';
  str += 'frameNum: '      + this.frameNum      + '\n';
  str += 'length: '        + this.length        + '\n';
  str += 'location: '      + this.location      + '\n';
  str += 'rotation: '      + this.rotation      + '\n';
  str += 'interpolation: ' + this.interpolation + '\n';
  str += 'angle: '         + this.angle         + '\n';
  str += 'perspective: '   + this.perspective   + '\n';
  return str;
};
module.exports = VMDCamera;

'use strict';

function VMDLight(id) {
  this.id = id;
  this.frameNum = null;
  this.color = null;
  this.location = null;
};


VMDLight.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDLight.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'frameNum: ' + this.frameNum + '\n';
  str += 'color: '    + this.color    + '\n';
  str += 'location: ' + this.location + '\n';
  return str;
};
module.exports = VMDLight;

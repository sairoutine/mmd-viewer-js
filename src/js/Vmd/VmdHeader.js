'use strict';
function VMDHeader() {
  this.magic = null;
  this.modelName = null;
};


VMDHeader.prototype.valid = function() {
  return (this.magic == 'Vocaloid Motion Data 0002');
};


VMDHeader.prototype.dump = function() {
  var str = '';
  str += 'magic: '     + this.magic     + '\n';
  str += 'modelName: ' + this.modelName + '\n';
  return str;
};
module.exports = VMDHeader;

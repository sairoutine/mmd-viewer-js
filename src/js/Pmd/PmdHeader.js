'use strict';
function PMDHeader() {
  this.magic = null;
  this.version = null;
  this.modelName = null;
  this.comment = null;
}


PMDHeader.prototype.valid = function() {
  return (this.magic == 'Pmd');
};


PMDHeader.prototype.dump = function() {
  var str = '';
  str += 'magic: '      + this.magic     + '\n';
  str += 'version: '    + this.version   + '\n';
  str += 'model_name: ' + this.modelName + '\n';
  str += 'comment: '    + this.comment   + '\n';
  return str;
};


module.exports = PMDHeader;

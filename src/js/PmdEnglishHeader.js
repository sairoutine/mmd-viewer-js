'use strict';

function PMDEnglishHeader() {
  this.compatibility = null;
  this.modelName = null;
  this.comment = null;
};


PMDEnglishHeader.prototype.dump = function() {
  var str = '';
  str += 'compatibility: ' + this.compatibility + '\n';
  str += 'modelName:     ' + this.modelName     + '\n';
  str += 'comment: '       + this.comment       + '\n';
  return str;
};

module.exports = PMDEnglishHeader;

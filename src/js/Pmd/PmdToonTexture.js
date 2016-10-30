'use strict';

function PMDToonTexture(id) {
  this.id = id;
  this.fileName = null;
}


PMDToonTexture.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'fileName: ' + this.fileName + '\n';
  return str;
};

module.exports = PMDToonTexture;

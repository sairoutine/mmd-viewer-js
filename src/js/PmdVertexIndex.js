'use strict';
function PMDVertexIndex(id) {
  this.id = id;
  this.index = null;
};


PMDVertexIndex.prototype.dump = function() {
  var str = '';
  str += 'id: '    + this.id    + '\n';
  str += 'index: ' + this.index + '\n';
  return str;
};



module.exports = PMDVertexIndex;

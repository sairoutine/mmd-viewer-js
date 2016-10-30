'use strict';

function PMDFaceDisplay(id) {
  this.id = id;
  this.index = null;
}


PMDFaceDisplay.prototype.dump = function() {
  var str = '';
  str += 'id: '    + this.id    + '\n';
  str += 'index: ' + this.index + '\n';
  return str;
};



module.exports = PMDFaceDisplay;

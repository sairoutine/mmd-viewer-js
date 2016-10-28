'use strict';

function PMDBoneDisplay(id) {
  this.id = id;
  this.index = null;
  this.frameIndex = null;
};


PMDBoneDisplay.prototype.dump = function() {
  var str = '';
  str += 'id: '         + this.id         + '\n';
  str += 'index: '      + this.index      + '\n';
  str += 'frameIndex: ' + this.frameIndex + '\n';
  return str;
};

module.exports = PMDBoneDisplay;

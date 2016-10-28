'use strict';

function PMDBoneFrameName(id) {
  this.id = id;
  this.name = null;
};


PMDBoneFrameName.prototype.dump = function() {
  var str = '';
  str += 'id: '   + this.id   + '\n';
  str += 'name: ' + this.name + '\n';
  return str;
};

module.exports = PMDBoneFrameName;

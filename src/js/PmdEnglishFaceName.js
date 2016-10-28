'use strict';

function PMDEnglishFaceName(id) {
  this.id = id;
  this.name = null;
};


PMDEnglishFaceName.prototype.dump = function() {
  var str = '';
  str += 'id: '   + this.id   + '\n';
  str += 'name: ' + this.name + '\n';
  return str;
};

module.exports = PMDEnglishFaceName;

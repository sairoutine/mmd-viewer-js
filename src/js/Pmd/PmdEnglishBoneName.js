'use strict';

function PMDEnglishBoneName(id) {
  this.id = id;
  this.name = null;
}


PMDEnglishBoneName.prototype.dump = function() {
  var str = '';
  str += 'id: '   + this.id   + '\n';
  str += 'name: ' + this.name + '\n';
  return str;
};

module.exports = PMDEnglishBoneName;

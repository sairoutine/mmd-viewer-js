'use strict';

function PMDIK(id) {
  this.id = id;
  this.index = null;
  this.targetBoneIndex = null;
  this.chainLength = null;
  this.iteration = null;
  this.limitation = null;
  this.childBoneIndices = null;
}


PMDIK.prototype.dump = function() {
  var str = '';
  str += 'id: '               + this.id               + '\n';
  str += 'index: '            + this.index            + '\n';
  str += 'targetBoneIndex: '  + this.targetBoneIndex  + '\n';
  str += 'chainLength: '      + this.chainLength      + '\n';
  str += 'iteration: '        + this.iteration        + '\n';
  str += 'limitation: '       + this.limitation       + '\n';
  str += 'childBoneIndices: ' + this.childBoneIndices + '\n';
  return str;
};
module.exports = PMDIK;

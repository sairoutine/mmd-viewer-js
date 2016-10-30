'use strict';


function PMDFaceVertex(id, type) {
  this.id = id;
  this.type = type;
  this.index = null;
  this.position = null;
}


PMDFaceVertex.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
//  str += 'type: '     + this.type     + '\n';
  str += 'index: '    + this.index    + '\n';
  str += 'position: ' + this.position + '\n';
  return str;
};


PMDFaceVertex.prototype.toRight = function() {
  this.position[2] = -this.position[2];
};



module.exports = PMDFaceVertex;

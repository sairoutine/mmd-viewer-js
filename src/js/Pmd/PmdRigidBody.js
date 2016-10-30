'use strict';

function PMDRigidBody(id) {
  this.id = id;
  this.name = null;
  this.boneIndex = null;
  this.groupIndex = null;
  this.groupTarget = null;
  this.shapeType = null;
  this.width = null;
  this.height = null;
  this.depth = null;
  this.position = null;
  this.rotation = null;
  this.weight = null;
  this.positionDim = null;
  this.rotationDim = null;
  this.recoil = null;
  this.friction = null;
  this.type = null;
}


PMDRigidBody.prototype.dump = function() {
  var str = '';
  str += 'id: '          + this.id          + '\n';
  str += 'name: '        + this.name        + '\n';
  str += 'boneIndex: '   + this.boneIndex   + '\n';
  str += 'groupIndex: '  + this.groupIndex  + '\n';
  str += 'groupTarget: ' + this.groupTarget + '\n';
  str += 'shapeType: '   + this.shapeType   + '\n';
  str += 'width: '       + this.width       + '\n';
  str += 'height: '      + this.height      + '\n';
  str += 'depth: '       + this.depth       + '\n';
  str += 'position: '    + this.position    + '\n';
  str += 'rotation: '    + this.rotation    + '\n';
  str += 'weight: '      + this.weight      + '\n';
  str += 'positionDim: ' + this.positionDim + '\n';
  str += 'rotationDim: ' + this.rotationDim + '\n';
  str += 'recoil: '      + this.recoil      + '\n';
  str += 'friction: '    + this.friction    + '\n';
  str += 'type: '        + this.type        + '\n';
  return str;
};


PMDRigidBody.prototype.toRight = function() {
  this.position[2] = -this.position[2];
  this.rotation[0] = -this.rotation[0];
  this.rotation[1] = -this.rotation[1];
};

module.exports = PMDRigidBody;

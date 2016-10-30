'use strict';

function PMDJoint(id) {
  this.id = id;
  this.name = null;
  this.rigidBody1 = null;
  this.rigidBody2 = null;
  this.position = null;
  this.rotation = null;
  this.translationLimitation1 = null;
  this.translationLimitation2 = null;
  this.rotationLimitation1 = null;
  this.rotationLimitation2 = null;
  this.springPosition = null;
  this.springRotation = null;
}


PMDJoint.prototype.dump = function() {
  var str = '';
  str += 'id: '                     + this.id                     + '\n';
  str += 'name: '                   + this.name                   + '\n';
  str += 'rigidBody1: '             + this.rigidBody1             + '\n';
  str += 'rigidBody2: '             + this.rigidBody2             + '\n';
  str += 'position: '               + this.position               + '\n';
  str += 'rotation: '               + this.rotation               + '\n';
  str += 'translationLimitation1: ' + this.translationLimitation1 + '\n';
  str += 'translationLimitation2: ' + this.translationLimitation2 + '\n';
  str += 'rotationLimitation1: '    + this.rotationLimitation1    + '\n';
  str += 'rotationLimitation2: '    + this.rotationLimitation2    + '\n';
  str += 'springPosition: '         + this.springPosition         + '\n';
  str += 'springRotation: '         + this.springRotation         + '\n';
  return str;
};


PMDJoint.prototype.toRight = function() {
  this.position[2] = -this.position[2];
  this.rotation[0] = -this.rotation[0];
  this.rotation[1] = -this.rotation[1];
};

module.exports = PMDJoint;

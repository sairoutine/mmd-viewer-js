(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var __toString = require('./Utility');


function FileParser(buffer) {
  this.uint8 = new Uint8Array(buffer);
  this.offset = 0;
}
FileParser.prototype.Math = Math;

/**
 * -- sample --
 * FileParser.prototype._VERTEX_STRUCTURE = {
 *   position: {type: 'float', isArray: true, size: 3},
 *   normal: {type: 'float', isArray: true, size: 3},
 *   uv: {type: 'float', isArray: true, size: 2},
 *   boneIndices: {type: 'uint16', isArray: true, size: 2},
 *   boneWeight: {type: 'uint8'},
 *   edgeFlag: {type: 'uint8'}
 * };
 */


/**
 * Note: override this method in a child class
 */
FileParser.prototype.parse = function() {
  return {};
};


FileParser.prototype._parseObject = function(obj, s) {
  var o = this.offset;
  for(var key in s) {
    obj[key] = this._getValue(s[key], this.offset);
    // TODO: this can waste time when this function is called in loop
    this.offset += this._sizeof(s[key]);
  }
};


FileParser.prototype._getValue = function(param, offset) {
  return (param.isArray === undefined) ? this._getValueScalar(param, offset) : this._getValueArray(param, offset);
};


/**
 * TODO: you may use DataView.
 */
FileParser.prototype._getValueScalar = function(param, offset) {
  switch(param.type) {
    case 'char':
      return this._getChars(offset, 1);
    case 'strings':
      return this._getStrings(offset, 1);
    case 'uint8':
      return this._getUint8(offset);
    case 'uint16':
      return this._getUint16(offset);
    case 'uint32':
      return this._getUint32(offset);
    case 'float':
      return this._getFloat(offset);
    default:
      // TODO: to be specific
      throw 'error: undefined type' + param;
  }
};


FileParser.prototype._getValueArray = function(param, offset) {
  if(param.type === 'char') {
    return this._getChars(offset, param.size);
  }

  if(param.type === 'strings') {
    return this._getStrings(offset, param.size);
  }

  var array = [];
  var size = this._sizeofScalar(param);
  for(var i = 0; i < param.size; i++) {
    array[i] = this._getValueScalar(param, offset);
    offset += size;
  }

  return array;
};


FileParser.prototype._sizeof = function(param) {
  return (param.isArray === undefined) ? this._sizeofScalar(param) : this._sizeofArray(param);
};


FileParser.prototype._sizeofScalar = function(param) {
  switch(param.type) {
    case 'char':
      return 1;
    case 'strings':
      return 1;
    case 'uint8':
      return 1;
    case 'uint16':
      return 2;
    case 'uint32':
      return 4;
    case 'float':
      return 4;
    default:
      // TODO: to be specific
      throw 'error: undefined type ' + param + ' ' + param.type;
  }
};


FileParser.prototype._sizeofArray = function(param) {
  return this._sizeofScalar(param) * param.size;
};


FileParser.prototype._sizeofObject = function(o) {
  var size = 0;
  for(var key in o) {
    size += this._sizeof(o[key]);
  }
  return size;
};


FileParser.prototype._getUint8 = function(pos) {
  return this.uint8[pos];
};


FileParser.prototype._getUint16 = function(pos) {
  return this._getValueWithReverseByteOrder(pos, 2);
};


FileParser.prototype._getUint32 = function(pos) {
  return this._getValueWithReverseByteOrder(pos, 4);
};


FileParser.prototype._getFloat = function(pos) {
  return this._toBinary32(this._getValueWithReverseByteOrder(pos, 4));
};


FileParser.prototype._getValueWithReverseByteOrder = function(pos, size) {
  var value = 0;
  for(var i = 0; i < size; i++) {
    value = (value << 8) | this.uint8[pos+size-i-1];
  }
  return value;
};


FileParser.prototype._toBinary32 = function(uint32) {
  var sign = (uint32 >> 31) & 1;
  var exponent = (uint32 >> 23) & 0xFF;
  var fraction = uint32 & 0x7FFFFF;

  if(exponent === 0 && fraction === 0)
    return 0.0;

  if(exponent === 255 && fraction === 0)
    return Infinity;

  if(exponent === 255 && fraction !== 0)
    return NaN;

  var tmp = 1;

  if(exponent === 0 && fraction !== 0) {
    exponent = 1;
    tmp = 0;
  }

  for(var i = 0; i < 23; i++) {
    if((fraction >> (22-i)) & 1) {
      tmp += this.Math.pow(2, -(i+1));
    }
  }
  tmp = tmp * this.Math.pow(2, (exponent-127));
  if(sign)
    tmp = -tmp;
  return tmp;
};


FileParser.prototype._getChars = function(pos, size) {
  var str = '';
  for(var i = 0; i < size; i++) {
    var index = pos + i;
    if(this.uint8[index] === 0)
      break;
    // TODO: temporal
    str += String.fromCharCode(this.uint8[index]);
  }
  return str;
};


FileParser.prototype._getStrings = function(pos, size) {
  var str = '';
  for(var i = 0; i < size; i++) {
    var index = pos + i;
    if(this.uint8[index] === 0)
      break;
    // TODO: temporal
    str += __toString(16, this.uint8[index], 2);
  }
  return str;
};


FileParser.prototype.dump = function() {
  var array = this.uint8;

  var figure = 0;
  var tmp = array.length;
  while(tmp > 0) {
    figure++;
    tmp = (tmp/16) | 0;
  }

  var dump = '';
  var charDump = '';
  for(var i = 0; i < array.length; i++) {
    if(i%16 === 0) {
      dump += __toString(16, i, figure);
      dump += ' ';
    }

    dump += __toString(16, array[i], 2);
    dump += ' ';

    if(array[i] >= 0x20 && array[i] <= 0x7E)
      charDump += String.fromCharCode(array[i]);
    else
      charDump += '.';

    if(i%16 === 15) {
      dump += '  ';
      dump += charDump;
      dump += '\n';
      charDump = '';
    }
  }

  return dump;
};

module.exports = FileParser;

},{"./Utility":30}],2:[function(require,module,exports){
'use strict';
/**
 *
 */

var Util = {};

Util.__inherit = function( child, parent ) {
  var getPrototype = function( p ) {
    if( Object.create ) {
      return Object.create( p ) ;
    }
    function F( ) { }
    F.prototype = p ;
    return new F( ) ;
  } ;
  child.prototype = getPrototype( parent.prototype ) ;
  child.prototype.constructor = child ;
};


Util.__copyParentMethod = function (child, parent, methodName) {
  var parentName = parent.name;
  var name = parentName + '_' + 
               ((methodName[0] === '_') ? methodName.slice(1) : methodName);
  child.prototype[name] = parent.prototype[methodName];
};
module.exports = Util;

},{}],3:[function(require,module,exports){
/* global Ammo */
'use strict';

var PhysicsRigidBody = require('./PhysicsRigidBody');
var PhysicsConstraint = require('./PhysicsConstraint');


function Physics(pmd) {
  this.pmd = pmd;

  this.world = null;
  this.bodies = [];
  this.constraints = [];

  this.count = 0;

  this._init();
}


Physics.prototype._init = function() {
  this.world = this._generateWorld();
//  this.world.addRigidBody(this._generateGround());
  var i;
  this.bodies.length = 0;
  for(i = 0; i < this.pmd.rigidBodyCount; i++) {
    this.bodies.push(new PhysicsRigidBody(
                           this.pmd,
                           this.world,
                           this.pmd.rigidBodies[i]));
  }

  this.constraints.length = 0;
  for(i = 0; i < this.pmd.jointCount; i++) {
    var joint = this.pmd.joints[i];
    var bodyA = this.bodies[joint.rigidBody1];
    var bodyB = this.bodies[joint.rigidBody2];
    this.constraints.push(new PhysicsConstraint(
                                this.pmd,
                                this.world,
                                joint,
                                bodyA,
                                bodyB));
  }
};


Physics.prototype._generateWorld = function() {
  var config = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(config);
  var cache = new Ammo.btDbvtBroadphase();
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  var world = new Ammo.btDiscreteDynamicsWorld(dispatcher, cache,
                                               solver, config);
  world.setGravity(new Ammo.btVector3(0, -10*10, 0));
  return world;
};


Physics.prototype._generateGround = function() {
  var form = new Ammo.btTransform();
  form.setIdentity();
  form.setOrigin(new Ammo.btVector3(0, -1, 0));
  return new Ammo.btRigidBody(
    new Ammo.btRigidBodyConstructionInfo(
      0,
      new Ammo.btDefaultMotionState(form),
      new Ammo.btBoxShape(new Ammo.btVector3(5, 1, 5)),
      new Ammo.btVector3(0, 0, 0)
    )
  );
};


Physics.prototype.simulate = function(motions, dframe) {
  this._preSimulation(motions);
  this.world.stepSimulation(1/60, 0, 1/60);
  this._postSimulation(motions);
};


/**
 * TODO: temporal
 */
Physics.prototype.simulateFrame = function(motions, dframe) {
  var g;
  var stepTime = 1/60*dframe;
  var maxStepNum = dframe;
  var unitStep = 1/60;

  // Note: sacrifice some precision for the performance
  if(dframe >= 3) {
    maxStepNum = 2;
    unitStep = 1/60*2;

    g = this.world.getGravity();
    g.setY(-10*10/(2));
    this.world.setGravity(g);
  }

  this._preSimulation(motions);
  this.world.stepSimulation(stepTime, maxStepNum, unitStep);
  this._postSimulation(motions);

  if(dframe >= 3) {
    g.setY(-10*10);
    this.world.setGravity(g);
    Ammo.destroy(g); // TODO: is this necessary?
  }
};


Physics.prototype._preSimulation = function(motions) {
  for(var i = 0; i < this.bodies.length; i++) {
    this.bodies[i].preSimulation(motions);
  }
};


Physics.prototype._postSimulation = function(motions) {
  for(var i = 0; i < this.bodies.length; i++) {
    this.bodies[i].postSimulation(motions);
  }
};


Physics.prototype.resetRigidBodies = function(motions) {
  for(var i = 0; i < this.bodies.length; i++) {
    this.bodies[i].reset(motions);
  }
};
module.exports = Physics;

},{"./PhysicsConstraint":4,"./PhysicsRigidBody":6}],4:[function(require,module,exports){
/* global Ammo */
'use strict';

var PhysicsEntity = require('./PhysicsEntity');
var __inherit = require('../Inherit').__inherit;

function PhysicsConstraint(pmd, world, joint, bodyA, bodyB) {
  this.parent = PhysicsEntity;
  this.parent.call(this);

  this.pmd = pmd;
  this.world = world;
  this.joint = joint;
  this.bodyA = bodyA;
  this.bodyB = bodyB;

  this.constraint = null;
  this.boneOffsetForm = null;
  this.boneOffsetFormInverse = null;

  this._init();
}
__inherit(PhysicsConstraint, PhysicsEntity);


/**
 * TODO: temporal
 */
PhysicsConstraint.prototype._init = function() {
  var joint = this.joint;
  var rb1 = this.bodyA.rb;
  var rb2 = this.bodyB.rb;
  var body1 = this.bodyA.body;
  var body2 = this.bodyB.body;


  if(body1.type !== 0 && body2.type == 2) {
    if(body1.boneIndex > 0       && body2.boneIndex > 0 &&
       body1.boneIndex != 0xFFFF && body2.boneIndex != 0xFFFF) {
      var b1 = this.pmd.bones[body1.boneIndex];
      var b2 = this.pmd.bones[body2.boneIndex];
      if(b2.parentIndex == b1.id) {
        body2.type = 1;
      }
    }
  }


  var form = this.allocTr();
  this._setOriginArray3Left(form, joint.position);
  this._setBasisArray3Left(form, joint.rotation);

  var r1Form = rb1.getWorldTransform();
  var r2Form = rb2.getWorldTransform();

  var r1FormInverse = this._inverseTransform(r1Form);
  var r2FormInverse = this._inverseTransform(r2Form);

  var r1Form2 = this._multiplyTransforms(r1FormInverse, form);
  var r2Form2 = this._multiplyTransforms(r2FormInverse, form);

  var constraint = new Ammo.btGeneric6DofSpringConstraint(
                         rb1, rb2, r1Form2, r2Form2, true);

  // Left to Right
  var lll = this.allocV();
  var lul = this.allocV();
  var all = this.allocV();
  var aul = this.allocV();

  lll.setValue( joint.translationLimitation1[0],
                joint.translationLimitation1[1],
               -joint.translationLimitation2[2]);
  lul.setValue( joint.translationLimitation2[0],
                joint.translationLimitation2[1],
               -joint.translationLimitation1[2]);
  all.setValue(-joint.rotationLimitation2[0],
               -joint.rotationLimitation2[1],
                joint.rotationLimitation1[2]);
  aul.setValue(-joint.rotationLimitation1[0],
               -joint.rotationLimitation1[1],
                joint.rotationLimitation2[2]);

  constraint.setLinearLowerLimit(lll);
  constraint.setLinearUpperLimit(lul);
  constraint.setAngularLowerLimit(all);
  constraint.setAngularUpperLimit(aul);

  for(var i = 0; i < 3; i++) {
    if(joint.springPosition[i] != 0) {
      constraint.enableSpring(i, true);
      constraint.setStiffness(i, joint.springPosition[i]);
    }
  }

  for(var i = 0; i < 3; i++) {
    if(joint.springRotation[i] != 0) {
      constraint.enableSpring(i+3, true);
      constraint.setStiffness(i+3, joint.springRotation[i]);
    }
  }

  this.world.addConstraint(constraint, true);
  this.constraint = constraint;

  this.freeTr(form);
  Ammo.destroy(r1Form);
  Ammo.destroy(r2Form);
  this.freeTr(r1FormInverse);
  this.freeTr(r2FormInverse);
  this.freeTr(r1Form2);
  this.freeTr(r2Form2);
  this.freeV(lll);
  this.freeV(lul);
  this.freeV(all);
  this.freeV(aul);
};

module.exports = PhysicsConstraint;

},{"../Inherit":2,"./PhysicsEntity":5}],5:[function(require,module,exports){
'use strict';



function PhysicsEntity() {
  this.workNum = 10;
  this.workTrs = [];
  this.workQs = [];
  this.workVs = [];
  for(var i = 0; i < this.workNum; i++) {
    this.workTrs[i] = new Ammo.btTransform();
    this.workQs[i] = new Ammo.btQuaternion();
    this.workVs[i] = new Ammo.btVector3();
  }
}


PhysicsEntity.prototype.allocTr = function() {
  var tr = this.workTrs[this.workTrs.length-1];
  this.workTrs.length--;
  return tr;
};


PhysicsEntity.prototype.freeTr = function(tr) {
  this.workTrs[this.workTrs.length] = tr;
};


PhysicsEntity.prototype.allocQ = function() {
  var q = this.workQs[this.workQs.length-1];
  this.workQs.length--;
  return q;
};


PhysicsEntity.prototype.freeQ = function(q) {
  this.workQs[this.workQs.length] = q;
};


PhysicsEntity.prototype.allocV = function() {
  var v = this.workVs[this.workVs.length-1];
  this.workVs.length--;
  return v;
};


PhysicsEntity.prototype.freeV = function(v) {
  this.workVs[this.workVs.length] = v;
};


/**
 * TODO: temporal
 * @return btTransform
 */
PhysicsEntity.prototype._newTransform = function() {
  return new Ammo.btTransform();
};


/**
 * TODO: temporal
 */
PhysicsEntity.prototype._setIdentity = function(tr) {
  tr.setIdentity();
};


/**
 * TODO: temporal
 * @param tr btTransform i
 */
PhysicsEntity.prototype._getBasis = function(tr) {
  var q = this.allocQ();
  tr.getBasis().getRotation(q);
  return q;
};


/**
 * TODO: temporal
 * @param tr btTransform i
 */
PhysicsEntity.prototype._getBasisMatrix3 = function(tr) {
  var q = this._getBasis(tr);
  var m = this._quaternionToMatrix3(q);
  this.freeQ(q);
  return m;
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param q btQuaternion i
 */
PhysicsEntity.prototype._setBasis = function(tr, q) {
  tr.setRotation(q);
//  var p = this._quaternionToEulerZYX(q);
//  tr.getBasis().setEulerZYX(p[0], p[1], p[2]);
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param m array[9] i
 */
PhysicsEntity.prototype._setBasisMatrix3 = function(tr, m) {
  var q = this._matrix3ToQuaternion(m);
  this._setBasis(tr, q);
  this.freeQ(q);
};


/**
 * TODO: temporal
 * Note: [x, y, z, w]
 * @param tr btTransform i/o
 * @param a array[4] i
 */
PhysicsEntity.prototype._setBasisArray4 = function(tr, a) {
  var q = this._array4ToQuaternion(a);
  this._setBasis(tr, q);
  this.freeQ(q);
};


/**
 * TODO: temporal
 * Note: [x, y, z, w]
 * @param tr btTransform i/o
 * @param a array[4] i
 */
PhysicsEntity.prototype._setBasisArray4Left = function(tr, a) {
  a[0] = -a[0];
  a[1] = -a[1];
  this._setBasisArray4(tr, a);
  a[0] = -a[0];
  a[1] = -a[1];
};


/**
 * TODO: temporal
 * Note: [x, y, z]
 * @param tr btTransform i/o
 * @param m array[3] i
 */
PhysicsEntity.prototype._setBasisArray3 = function(tr, a) {
  tr.getBasis().setEulerZYX(a[0], a[1], a[2]);
};


/**
 * TODO: temporal
 * Note: [x, y, z]
 * @param tr btTransform i/o
 * @param m array[3] i
 */
PhysicsEntity.prototype._setBasisArray3Left = function(tr, a) {
  a[0] = -a[0];
  a[1] = -a[1];
  this._setBasisArray3(tr, a);
  a[0] = -a[0];
  a[1] = -a[1];
};


/**
 * TODO: temporal
 * @param tr btTransform i
 * @return btVector3
 */
PhysicsEntity.prototype._getOrigin = function(tr) {
  return tr.getOrigin();
};


/**
 * TODO: temporal
 * @param tr btTransform i
 * @return array[3]
 */
PhysicsEntity.prototype._getOriginArray3 = function(tr) {
  var o = this._getOrigin(tr);
  return [o.x(), o.y(), o.z()];
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param v btVector3 i
 */
PhysicsEntity.prototype._setOrigin = function(tr, v) {
  tr.getOrigin().setValue(v.x(), v.y(), v.z());
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param a array[3] i
 */
PhysicsEntity.prototype._setOriginArray3 = function(tr, a) {
  tr.getOrigin().setValue(a[0], a[1], a[2]);
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param a array[3] i
 */
PhysicsEntity.prototype._setOriginArray3Left = function(tr, a) {
  a[2] = -a[2];
  this._setOriginArray3(tr, a);
  a[2] = -a[2];
};


/**
 * TODO: temporal
 * @param tr btTransform i/o
 * @param x float i
 * @param y float i
 * @param z float i
 */
PhysicsEntity.prototype._setOriginFloats = function(tr, x, y, z) {
  tr.getOrigin().setValue(x, y, z);
};


/**
 * TODO: temporal
 * @param tr1 btTransform i/o
 * @param tr2 btTransform i
 */
PhysicsEntity.prototype._copyOrigin = function(tr1, tr2) {
  var o = tr2.getOrigin();
  this._setOrigin(tr1, o);
};


/**
 * TODO: temporal
 * @param v1 btVector3 i
 * @param v2 btVector3 i
 * @return btVector3
 */
PhysicsEntity.prototype._addVector3 = function(v1, v2) {
  var v = this.allocV();
  v.setValue(v1.x() + v2.x(),
             v1.y() + v2.y(),
             v1.z() + v2.z());
  return v;
};


/**
 * TODO: temporal
 * @param v btVector3 i
 * @param a array[3]
 * @return btVector3
 */
PhysicsEntity.prototype._addVector3ByArray3 = function(v, a) {
  var v2 = this.allocV();
  v2.setValue(v.x() + a[0],
              v.y() + a[1],
              v.z() + a[2]);
  return v2;
};


/**
 * TODO: temporal
 * @param v1 btVector3 i
 * @param v2 btVector3 i
 * @return float
 */
PhysicsEntity.prototype._dotVectors3 = function(v1, v2) {
  return v1.x() * v2.x() +
         v1.y() * v2.y() +
         v1.z() * v2.z();
};


/**
 * TODO: temporal
 * @param m array[9] i
 * @param i int i
 * @return btVector3
 */
PhysicsEntity.prototype._rowOfMatrix3 = function(m, i) {
  var v = this.allocV();
  v.setValue(m[i*3+0], m[i*3+1], m[i*3+2]);
  return v;
};


/**
 * TODO: temporal
 * @param m array[9] i
 * @param i int i
 * @return btVector3
 */
PhysicsEntity.prototype._columnOfMatrix3 = function(m, i) {
  var v = this.allocV();
  v.setValue(m[i+0], m[i+3], m[i+6]);
  return v;
};


/**
 * TODO: temporal
 * @param v btVector3 i
 * @return btVector3
 */
PhysicsEntity.prototype._negativeVector3 = function(v) {
  var v2 = this.allocV();
  v2.setValue(-v.x(), -v.y(), -v.z());
  return v2;
};


/**
 * TODO: temporal
 * @param v btVector3 i
 * @return btVector3
 */
PhysicsEntity.prototype._cloneVector3 = function(v) {
  var v2 = this.allocV();
  v2.setValue(v.x(), v.y(), v.z());
  return v2;
};


/**
 * TODO: temporal
 * @param m array[9]
 * @return array[9]
 */
PhysicsEntity.prototype._cloneMatrix3 = function(m) {
  var m2 = [];
  for(var i = 0; i < 9; i++) {
    m2[i] = m[i];
  }
  return m2;
};


/**
 * TODO: temporal
 * @param a array[3] i
 * @return btVector3
 */
PhysicsEntity.prototype._array3ToVector3 = function(a) {
  var v = this.allocV();
  v.setValue(a[0], a[1], a[2]);
  return v;
};


/**
 * TODO: temporal
 * @param v btVector3 i
 * @return array[3]
 */
PhysicsEntity.prototype._vector3ToArray3 = function(v) {
  var a = [];
  a[0] = v.x();
  a[1] = v.y();
  a[2] = v.z();
  return a;
};


/**
 * Note: [x, y, z, w]
 * TODO: temporal
 * @param a array[4]
 * @return btQuaternion
 */
PhysicsEntity.prototype._array4ToQuaternion = function(a) {
  var q = this.allocQ();
  q.setX(a[0]);
  q.setY(a[1]);
  q.setZ(a[2]);
  q.setW(a[3]);
  return q;
};


/**
 * Note: [x, y, z, w]
 * TODO: temporal
 * @param q btQuaternion
 * @return array[4]
 */
PhysicsEntity.prototype._quaternionToArray4 = function(q) {
  var a = [q.x(), q.y(), q.z(), q.w()];
  return a;
};


/**
 * TODO: implement correctly
 * TODO: temporal
 * @param q btQuaternion i
 * @return array[3]
 */
PhysicsEntity.prototype._quaternionToEulerZYX = function(q) {
  var qw = q.w();
  var qx = q.x();
  var qy = q.y();
  var qz = q.z();
  var qw2 = qw*qw;
  var qx2 = qx*qx;
  var qy2 = qy*qy;
  var qz2 = qz*qz;
  var test = qx*qy + qz*qw;

  var yaw, pitch, roll;


  if(test > 0.499) {
    roll  = 360/Math.PI*Math.atan2(qx,qw);
    pitch = 90;
    yaw   = 0;
  } else if (test < -0.499) {
    roll  = -360/Math.PI*Math.atan2(qx,qw)
    pitch = -90;
    roll  = 0;
  } else {
    var h = Math.atan2(2*qy*qw-2*qx*qz,1-2*qy2-2*qz);
    var a = Math.asin(2*qx*qy+2*qz*qw);
    var b = Math.atan2(2*qx*qw-2*qy*qz,1-2*qx2-2*qz);
    roll  = Math.round(h*180/Math.PI);
    pitch = Math.round(a*180/Math.PI);
    yaw   = Math.round(b*180/Math.PI);
  }

  return [yaw, roll, pitch];


  var x2 = q.x() * q.x();
  var y2 = q.y() * q.y();
  var z2 = q.z() * q.z();
  var w2 = q.w() * q.w();
  var len = x2 + y2 + z2 + w2;
  var abcd = q.w() * q.x() + q.y() * q.z();
  var eps = 1e-7;

  var yaw, pitch, roll;

  if (abcd > (0.5-eps)*len) {
    yaw = 2 * Math.atan2(q.y(), q.w());
    pitch = Math.PI;
    roll = 0;
  } else if (abcd < (-0.5+eps)*len) {
    yaw = -2 * Math.atan2(q.y(), q.w());
    pitch = -Math.PI;
    roll = 0;
  } else {
    var adbc = q.w()*q.z() - q.x()*q.y();
    var acbd = q.w()*q.y() - q.x()*q.z();
    yaw = Math.atan2(2*adbc, 1 - 2*(z2+x2));
    pitch = Math.asin(2*abcd/len);
    roll = Math.atan2(2*acbd, 1 - 2*(y2+x2));
  }
  return [roll, pitch, yaw];
//  return [yaw, pitch, roll];
};


/**
 * origin = tr1.basis * tr2.origin + tr1.origin
 * basis = tr1.basis * tr2.basis
 * TODO: temporal
 * @param tr1 btTransform i
 * @param tr2 btTransform i
 * @return btTransform
 */
PhysicsEntity.prototype._multiplyTransforms = function(tr1, tr2) {
  var tr = this.allocTr();
  tr.setIdentity();

  var m1 = this._getBasisMatrix3(tr1);
  var m2 = this._getBasisMatrix3(tr2);

  var o1 = this._getOrigin(tr1);
  var o2 = this._getOrigin(tr2);

  var v1 = this._multiplyMatrix3ByVector3(m1, o2);
  var v2 = this._addVector3(v1, o1);
  this._setOrigin(tr, v2);

  var m3 = this._multiplyMatrices3(m1, m2);
  this._setBasisMatrix3(tr, m3);

  this.freeV(v1);
  this.freeV(v2);

  return tr;
};


/**
 * origin = tr.basis.transpose * -tr.origin
 * basis = tr.basis.transpose
 * TODO: temporal
 * @param tr btTransform i
 * @return btTransform
 */
PhysicsEntity.prototype._inverseTransform = function(tr) {
  var tr2 = this.allocTr();

  var m1 = this._getBasisMatrix3(tr);
  var o = this._getOrigin(tr);

  var m2 = this._transposeMatrix3(m1);
  var v1 = this._negativeVector3(o);
  var v2 = this._multiplyMatrix3ByVector3(m2, v1);

  this._setOrigin(tr2, v2);
  this._setBasisMatrix3(tr2, m2);

  this.freeV(v1);
  this.freeV(v2);

  return tr2;
};


/**
 * tr.basis * v1 + tr.origin
 * TODO: temporal
 * @param tr btTransform i
 * @param v btVector3 i
 * @return btVector3
 */
PhysicsEntity.prototype._multiplyTransformByVector3 = function(tr, v) {
  var m = this._getBasisMatrix3(tr);
  var o = this._getOrigin(tr);
  var v2 = this._multiplyMatrix3ByVector3(m, v);
  var v3 = this._addVector3(v2, o);

  this.freeV(v2);

  return v3;
};


/**
 * TODO: temporal
 * @param m array[9] i
 * @param v btVector3 i
 * @return btVector3
 */
PhysicsEntity.prototype._multiplyMatrix3ByVector3 = function(m, v) {
  var v4 = this.allocV();

  var v0 = this._rowOfMatrix3(m, 0);
  var v1 = this._rowOfMatrix3(m, 1);
  var v2 = this._rowOfMatrix3(m, 2);
  var x = this._dotVectors3(v0, v);
  var y = this._dotVectors3(v1, v);
  var z = this._dotVectors3(v2, v);

  v4.setValue(x, y, z);

  this.freeV(v0);
  this.freeV(v1);
  this.freeV(v2);

  return v4;
};


/**
 * TODO: temporal
 * @param m1 array[9] i
 * @param m2 array[9] i
 * @return array[9]
 */
PhysicsEntity.prototype._multiplyMatrices3 = function(m1, m2) {
  var m3 = [];

  var v10 = this._rowOfMatrix3(m1, 0);
  var v11 = this._rowOfMatrix3(m1, 1);
  var v12 = this._rowOfMatrix3(m1, 2);

  var v20 = this._columnOfMatrix3(m2, 0);
  var v21 = this._columnOfMatrix3(m2, 1);
  var v22 = this._columnOfMatrix3(m2, 2);

  m3[0] = this._dotVectors3(v10, v20);
  m3[1] = this._dotVectors3(v10, v21);
  m3[2] = this._dotVectors3(v10, v22);
  m3[3] = this._dotVectors3(v11, v20);
  m3[4] = this._dotVectors3(v11, v21);
  m3[5] = this._dotVectors3(v11, v22);
  m3[6] = this._dotVectors3(v12, v20);
  m3[7] = this._dotVectors3(v12, v21);
  m3[8] = this._dotVectors3(v12, v22);

  this.freeV(v10);
  this.freeV(v11);
  this.freeV(v12);
  this.freeV(v20);
  this.freeV(v21);
  this.freeV(v22);

  return m3;
};


/**
 * TODO: temporal
 * Note: 0 1 2
 *       3 4 5
 *       6 7 8
 * @param m array[9] i
 * @return array[9]
 */
PhysicsEntity.prototype._transposeMatrix3 = function(m) {
  var m2 = [];
  m2[0] = m[0];
  m2[1] = m[3];
  m2[2] = m[6];
  m2[3] = m[1];
  m2[4] = m[4];
  m2[5] = m[7];
  m2[6] = m[2];
  m2[7] = m[5];
  m2[8] = m[8];
  return m2;
};


/**
 * TODO: temporal
 * Note: 0 1 2  00 01 02  a b c
 *       3 4 5  10 11 12  d e f
 *       6 7 8  20 21 22  g h i
 * @param m array[9] i
 * @return array[9]
 */
PhysicsEntity.prototype._inverseMatrix3 = function(m) {
  var m00 = m[0];
  var m01 = m[1];
  var m02 = m[2];
  var m10 = m[3];
  var m11 = m[4];
  var m12 = m[5];
  var m20 = m[6];
  var m21 = m[7];
  var m22 = m[8];

  var det =   m00 * m11 * m22
            + m10 * m21 * m02
            + m20 * m01 * m12
            - m20 * m11 * m02
            - m10 * m01 * m22
            - m00 * m21 * m12;

  if(det == 0)
    return this._cloneMatrix3(m);

  var m2 = [];

  m2[0] = (m11 * m22 - m12 * m21) / det;
  m2[1] = (m02 * m21 - m01 * m22) / det;
  m2[2] = (m01 * m12 - m02 * m11) / det;
  m2[3] = (m12 * m20 - m10 * m22) / det;
  m2[4] = (m00 * m22 - m02 * m20) / det;
  m2[5] = (m02 * m10 - m00 * m12) / det;
  m2[6] = (m10 * m21 - m11 * m20) / det;
  m2[7] = (m01 * m20 - m00 * m21) / det;
  m2[8] = (m00 * m11 - m01 * m10) / det;

  return m2;
};


/**
 * TODO: temporal
 * Note: 0 1 2
 *       3 4 5
 *       6 7 8
 * @param q btQuaternion i
 * @return array[9]
 */
PhysicsEntity.prototype._quaternionToMatrix3 = function(q) {
  var q2 = quat4.create();
  q2[0] = q.x();
  q2[1] = q.y();
  q2[2] = q.z();
  q2[3] = q.w();
  return quat4.toMat3(q2);
};



/**
 * TODO: temporal
 * Note: 0 1 2   00 01 02
 *       3 4 5   10 11 12
 *       6 7 8   20 21 22
 * @param m array[9] i
 * @return btQuaternion
 */
PhysicsEntity.prototype._matrix3ToQuaternion = function(m) {
  var t = m[0] + m[4] + m[8];
  var s, x, y, z, w;
  if(t > 0) {
    s = Math.sqrt(t+1.0) * 2;
    w = 0.25 * s;
    x = (m[7] - m[5]) / s;
    y = (m[2] - m[6]) / s; 
    z = (m[3] - m[1]) / s; 
  } else if((m[0] > m[4]) && (m[0] > m[8])) {
    s = Math.sqrt(1.0 + m[0] - m[4] - m[8]) * 2;
    w = (m[7] - m[5]) / s;
    x = 0.25 * s;
    y = (m[1] + m[3]) / s; 
    z = (m[2] + m[6]) / s; 
  } else if(m[4] > m[8]) {
    s = Math.sqrt(1.0 + m[4] - m[0] - m[8]) * 2;
    w = (m[2] - m[6]) / s;
    x = (m[1] + m[3]) / s; 
    y = 0.25 * s;
    z = (m[5] + m[7]) / s; 
  } else {
    s = Math.sqrt(1.0 + m[8] - m[0] - m[4]) * 2;
    w = (m[3] - m[1]) / s;
    x = (m[2] + m[6]) / s;
    y = (m[5] + m[7]) / s;
    z = 0.25 * s;
  }

  var q = this.allocQ();
  q.setX(x);
  q.setY(y);
  q.setZ(z);
  q.setW(w);
  return q;
};


PhysicsEntity.prototype._dumpTransform = function(tr) {
  var q = this._getBasis(tr);

  var str = '';
  str += '-- origin --\n';
  str += this._getOriginArray3(tr).toString() + '\n';
  str += '-- quaternion --\n';
  str += [q.x(), q.y(), q.z(), q.w()].toString() + '\n';
  str += '-- matrix --\n';
  str += this._dumpMatrix3(this._getBasisMatrix3(tr));

  this.freeQ(q);

  return str;
};


PhysicsEntity.prototype._dumpMatrix3 = function(m) {
  var str = '';
  for(var i = 0; i < 3; i++) {
    str += [m[i*3+0], m[i*3+1], m[i*3+2]].toString() + ',\n';
  }
  return str;
};

module.exports = PhysicsEntity;

},{}],6:[function(require,module,exports){
/* global Ammo */
'use strict';


var __inherit = require('../Inherit').__inherit;
var PhysicsEntity = require('./PhysicsEntity');
function PhysicsRigidBody(pmd, world, body) {
  this.parent = PhysicsEntity;
  this.parent.call(this);

  this.pmd = pmd;
  this.world = world;
  this.body = body;

  this.rb = null;
  this.bone = null;
  this.form = null;
  this.boneForm = null;
  this.boneOffsetForm = null;
  this.boneOffsetFormInverse = null;

  this._init();
};
__inherit(PhysicsRigidBody, PhysicsEntity);


/**
 * TODO: temporal
 */
PhysicsRigidBody.prototype._init = function() {
  var body = this.body;
  var bone = this.pmd.bones[body.boneIndex];

  var shape = this._generateShape(body);
  var weight = (body.type == 0) ? 0 : body.weight;
  var localInertia = this.allocV();
  localInertia.setValue(0, 0, 0);

  if(weight != 0)
    shape.calculateLocalInertia(weight, localInertia);

  var boneOffsetForm = this.allocTr();
  this._setIdentity(boneOffsetForm);
  this._setOriginArray3Left(boneOffsetForm, body.position);
  this._setBasisArray3Left(boneOffsetForm, body.rotation);

  var boneForm = this.allocTr();
  this._setIdentity(boneForm);
  // TODO: temporal workaround
  var pos = (this.body.boneIndex == 0xFFFF) ? [0, 0, 0] : bone.position;
  this._setOriginArray3Left(boneForm, pos);

  var form = this._multiplyTransforms(boneForm, boneOffsetForm);
  var state = new Ammo.btDefaultMotionState(form);

  var info = new Ammo.btRigidBodyConstructionInfo(
                   weight, state, shape, localInertia);
  info.set_m_friction(body.friction);
  info.set_m_restitution(body.recoil);

  var rb = new Ammo.btRigidBody(info);
  if(body.type == 0) {
    rb.setCollisionFlags(rb.getCollisionFlags() | 2);
    rb.setActivationState(4);
  }
  rb.setDamping(body.positionDim, body.rotationDim);
  rb.setSleepingThresholds(0, 0);

  this.world.addRigidBody(rb, 1 << body.groupIndex, body.groupTarget);

  this.rb = rb;
  this.bone = bone;
  this.boneOffsetForm = boneOffsetForm;
  this.boneOffsetFormInverse = this._inverseTransform(boneOffsetForm);

  this.freeV(localInertia);
  this.freeTr(form);
  this.freeTr(boneForm);
};


PhysicsRigidBody.prototype._generateShape = function(b) {
  switch(b.shapeType) {
    case 0:
      return new Ammo.btSphereShape(b.width);
    case 1:
      return new Ammo.btBoxShape(
                   new Ammo.btVector3(b.width, b.height, b.depth));
    case 2:
      return new Ammo.btCapsuleShape(b.width, b.height);
    default:
      throw 'unknown shape type.' + b;
  }
};


PhysicsRigidBody.prototype.reset = function(motions) {
  this._setTransformFromBone(motions);
};


PhysicsRigidBody.prototype.preSimulation = function(motions) {
  // TODO: temporal workaround
  if(this.body.boneIndex == 0xFFFF)
    return;

  if(this.body.type == 0/* && this.body.boneIndex != 0*/)
    this._setTransformFromBone(motions);

  if(this.body.type == 2/* && this.body.boneIndex != 0*/)
    this._setPositionFromBone(motions);
};


PhysicsRigidBody.prototype._setTransformFromBone = function(motions) {
  var m = motions[this.body.boneIndex];

  // TODO: temporal workaround
  if(this.body.boneIndex == 0xFFFF) {
    m = {p: [0, 0, 0], r: [0, 0, 0, 1]}
  }

  var tr = this.allocTr();
  this._setOriginArray3Left(tr, m.p);
  this._setBasisArray4Left(tr, m.r);

  var form = this._multiplyTransforms(tr, this.boneOffsetForm);

  // TODO: temporal
//  this.rb.setWorldTransform(form);
  this.rb.setCenterOfMassTransform(form);
  this.rb.getMotionState().setWorldTransform(form);

  this.freeTr(tr);
  this.freeTr(form);
};


PhysicsRigidBody.prototype._setPositionFromBone = function(motions) {
  var m = motions[this.body.boneIndex];

  var tr = this.allocTr();
  this._setOriginArray3Left(tr, m.p);
  this._setBasisArray4Left(tr, m.r);

  var form = this._multiplyTransforms(tr, this.boneOffsetForm);

  var tr2 = this.allocTr();
  this.rb.getMotionState().getWorldTransform(tr2);
  this._copyOrigin(tr2, form);

  // TODO: temporal
//  this.rb.setWorldTransform(tr2);
  this.rb.setCenterOfMassTransform(tr2);
  this.rb.getMotionState().setWorldTransform(tr2);

  this.freeTr(tr);
  this.freeTr(tr2);
  this.freeTr(form);
};


PhysicsRigidBody.prototype.postSimulation = function(motions) {
  // TODO: temporal workaround
  if(this.body.type == 0 || this.body.boneIndex == 0xFFFF)
    return;

  var m = motions[this.body.boneIndex];

  var tr = this.allocTr();
  this.rb.getMotionState().getWorldTransform(tr);
  var tr2 = this._multiplyTransforms(tr, this.boneOffsetFormInverse);

  var q = this._getBasis(tr2);
  // Right to Left
  m.r[0] = -q.x();
  m.r[1] = -q.y();
  m.r[2] =  q.z();
  m.r[3] =  q.w();

  if(this.body.type == 1) {
    var o = this._getOrigin(tr2);
    // Right to Left
    m.p[0] =  o.x();
    m.p[1] =  o.y();
    m.p[2] = -o.z();
  }

  this.freeQ(q);
  this.freeTr(tr);
  this.freeTr(tr2);
};

module.exports = PhysicsRigidBody;

},{"../Inherit":2,"./PhysicsEntity":5}],7:[function(require,module,exports){
'use strict';

function PMDBoneDisplay(id) {
  this.id = id;
  this.index = null;
  this.frameIndex = null;
}


PMDBoneDisplay.prototype.dump = function() {
  var str = '';
  str += 'id: '         + this.id         + '\n';
  str += 'index: '      + this.index      + '\n';
  str += 'frameIndex: ' + this.frameIndex + '\n';
  return str;
};

module.exports = PMDBoneDisplay;

},{}],8:[function(require,module,exports){
'use strict';

function PMDBoneFrameName(id) {
  this.id = id;
  this.name = null;
}


PMDBoneFrameName.prototype.dump = function() {
  var str = '';
  str += 'id: '   + this.id   + '\n';
  str += 'name: ' + this.name + '\n';
  return str;
};

module.exports = PMDBoneFrameName;

},{}],9:[function(require,module,exports){
'use strict';


function PMDEnglishBoneFrameName(id) {
  this.id = id;
  this.name = null;
}


PMDEnglishBoneFrameName.prototype.dump = function() {
  var str = '';
  str += 'id: '   + this.id   + '\n';
  str += 'name: ' + this.name + '\n';
  return str;
};

module.exports = PMDEnglishBoneFrameName;

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
'use strict';

function PMDEnglishHeader() {
  this.compatibility = null;
  this.modelName = null;
  this.comment = null;
}


PMDEnglishHeader.prototype.dump = function() {
  var str = '';
  str += 'compatibility: ' + this.compatibility + '\n';
  str += 'modelName:     ' + this.modelName     + '\n';
  str += 'comment: '       + this.comment       + '\n';
  return str;
};

module.exports = PMDEnglishHeader;

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
'use strict';
var FileParser = require('../FileParser');
var __inherit = require('../Inherit').__inherit;
var PMD = require('./Pmd');
var PMDHeader = require('./PmdHeader');
var PMDVertex = require('./PmdVertex');
var PMDVertexIndex = require('./PmdVertexIndex');
var PMDMaterial = require('./PmdMaterial');
var PMDBone = require('./PmdBone');
var PMDIK = require('./PmdIk');
var PMDFace = require('./PmdFace');
var PMDFaceVertex = require('./PMDFaceVertex');
var PMDFaceDisplay = require('./PMDFaceDisplay');
var PMDBoneFrameName = require('./PMDBoneFrameName');
var PMDBoneDisplay = require('./PMDBoneDisplay');
var PMDEnglishHeader = require('./PMDEnglishHeader');
var PMDEnglishBoneName = require('./PMDEnglishBoneName');
var PMDEnglishBoneFrameName = require('./PMDEnglishBoneFrameName');
var PMDEnglishFaceName = require('./PMDEnglishFaceName');
var PMDToonTexture = require('./PMDToonTexture');
var PMDRigidBody = require('./PMDRigidBody');
var PMDJoint = require('./PMDJoint');


function PMDFileParser(buffer) {
  this.parent = FileParser;
  this.parent.call(this, buffer);
  this.englishCompatibility = false;
}
__inherit(PMDFileParser, FileParser);

PMDFileParser.prototype._HEADER_STRUCTURE = {
  magic: {type: 'char', isArray: true, size: 3},
  version: {type: 'float'},
  modelName: {type: 'char', isArray: true, size: 20},
  comment: {type: 'char', isArray: true, size: 256}
};

PMDFileParser.prototype._VERTICES_STRUCTURE = {
  count: {type: 'uint32'},
  vertices: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._VERTEX_STRUCTURE = {
  position: {type: 'float', isArray: true, size: 3},
  normal: {type: 'float', isArray: true, size: 3},
  uv: {type: 'float', isArray: true, size: 2},
  boneIndices: {type: 'uint16', isArray: true, size: 2},
  boneWeight: {type: 'uint8'},
  edgeFlag: {type: 'uint8'}
};

PMDFileParser.prototype._VERTEX_INDICES_STRUCTURE = {
  count: {type: 'uint32'},
  // Note: type can be 'uint16'
  indices: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._VERTEX_INDEX_STRUCTURE = {
  index: {type: 'uint16'}
};


PMDFileParser.prototype._MATERIALS_STRUCTURE = {
  count: {type: 'uint32'},
  materials: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._MATERIAL_STRUCTURE = {
  color: {type: 'float', isArray: true, size: 4},
  specularity: {type: 'float'},
  specularColor: {type: 'float', isArray: true, size: 3},
  mirrorColor: {type: 'float', isArray: true, size: 3},
  tuneIndex: {type: 'uint8'},
  edgeFlag: {type: 'uint8'},
  vertexCount: {type: 'uint32'},
  fileName: {type: 'char', isArray: true, size: 20}
};

PMDFileParser.prototype._BONES_STRUCTURE = {
  count: {type: 'uint16'},
  bones: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._BONE_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 20},
  parentIndex: {type: 'uint16'},
  tailIndex: {type: 'uint16'},
  type: {type: 'uint8'},
  ikIndex: {type: 'uint16'},
  position: {type: 'float', isArray: true, size: 3}
};

PMDFileParser.prototype._IKS_STRUCTURE = {
  count: {type: 'uint16'},
  iks: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._IK_STRUCTURE = {
  index: {type: 'uint16'},
  targetBoneIndex: {type: 'uint16'},
  chainLength: {type: 'uint8'},
  iteration: {type: 'uint16'},
  limitation: {type: 'float'},
  childBoneIndices: {type: 'uint16', isArray: true, size: 'chainLength'}
};

PMDFileParser.prototype._FACES_STRUCTURE = {
  count: {type: 'uint16'},
  faces: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._FACE_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 20},
  vertexCount: {type: 'uint32'},
  type: {type: 'uint8'},
  vertices: {type: 'object', isArray: true, size: 'vertexCount'}
};

PMDFileParser.prototype._FACE_VERTEX_STRUCTURE = {
  index: {type: 'uint32'},
  position: {type: 'float', isArray: true, size: 3}
};

PMDFileParser.prototype._FACE_DISPLAYS_STRUCTURE = {
  count: {type: 'uint8'},
  indices: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._FACE_DISPLAY_STRUCTURE = {
  index: {type: 'uint16'}
};

PMDFileParser.prototype._BONE_FRAME_NAMES_STRUCTURE = {
  count: {type: 'uint8'},
  names: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._BONE_FRAME_NAME_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 50}
};

PMDFileParser.prototype._BONE_DISPLAYS_STRUCTURE = {
  count: {type: 'uint32'},
  displays: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._BONE_DISPLAY_STRUCTURE = {
  index: {type: 'uint16'},
  frameIndex: {type: 'uint8'}
};

PMDFileParser.prototype._ENGLISH_HEADER_STRUCTURE = {
  compatibility: {type: 'uint8'},
  modelName: {type: 'char', isArray: true, size: 20},
  comment: {type: 'char', isArray: true, size: 256}
};

PMDFileParser.prototype._ENGLISH_BONE_NAME_STRUCTURE = {
  name: {type: 'char', isArray: true, size: 20}
};

PMDFileParser.prototype._ENGLISH_FACE_NAME_STRUCTURE = {
  name: {type: 'char', isArray: true, size: 20}
};

PMDFileParser.prototype._ENGLISH_BONE_FRAME_NAME_STRUCTURE = {
  name: {type: 'char', isArray: true, size: 50}
};

PMDFileParser.prototype._TOON_TEXTURE_STRUCTURE = {
  fileName: {type: 'char', isArray: true, size: 100}
};

PMDFileParser.prototype._RIGID_BODIES_STRUCTURE = {
  count: {type: 'uint32'},
  bodies: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._RIGID_BODY_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 20},
  boneIndex: {type: 'uint16'},
  groupIndex: {type: 'uint8'},
  groupTarget: {type: 'uint16'},
  shapeType: {type: 'uint8'},
  width: {type: 'float'},
  height: {type: 'float'},
  depth: {type: 'float'},
  position: {type: 'float', isArray: true, size: 3},
  rotation: {type: 'float', isArray: true, size: 3},
  weight: {type: 'float'},
  positionDim: {type: 'float'},
  rotationDim: {type: 'float'},
  recoil: {type: 'float'},
  friction: {type: 'float'},
  type: {type: 'uint8'}
};

PMDFileParser.prototype._JOINTS_STRUCTURE = {
  count: {type: 'uint32'},
  joints: {type: 'object', isArray: true, size: 'count'}
};

PMDFileParser.prototype._JOINT_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 20},
  rigidBody1: {type: 'uint32'},
  rigidBody2: {type: 'uint32'},
  position: {type: 'float', isArray: true, size: 3},
  rotation: {type: 'float', isArray: true, size: 3},
  translationLimitation1: {type: 'float', isArray: true, size: 3},
  translationLimitation2: {type: 'float', isArray: true, size: 3},
  rotationLimitation1: {type: 'float', isArray: true, size: 3},
  rotationLimitation2: {type: 'float', isArray: true, size: 3},
  springPosition: {type: 'float', isArray: true, size: 3},
  springRotation: {type: 'float', isArray: true, size: 3}
};


PMDFileParser.prototype.parse = function() {
  this.offset = 0;

  var p = new PMD();
  this._parseHeader(p);
  this._parseVertices(p);
  this._parseVertexIndices(p);
  this._parseMaterials(p);
  this._parseBones(p);
  this._parseIKs(p);
  this._parseFaces(p);
  this._parseFaceDisplays(p);
  this._parseBoneFrameNames(p);
  this._parseBoneDisplays(p);
  this._parseEnglishHeader(p);
  if(this.englishCompatibility) {
    this._parseEnglishBoneNames(p);
    this._parseEnglishFaceNames(p);
    this._parseEnglishBoneFrameNames(p);
  }
  this._parseToonTextures(p);
  this._parseRigidBodies(p);
  this._parseJoints(p);

  return p;
};


/**
 * TODO: be more strict.
 */
PMDFileParser.prototype.valid = function() {
  var tmp = this.offset;
  this.offset = 0;

  var p = new PMD();
  this._parseHeader(p);

  this.offset = tmp;

  return p.valid();
};


PMDFileParser.prototype._parseHeader = function(p) {
  var s = this._HEADER_STRUCTURE;
  p.header = new PMDHeader();
  this._parseObject(p.header, s);
};


PMDFileParser.prototype._parseVertices = function(p) {
  var s = this._VERTICES_STRUCTURE;
  p.vertexCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.vertices.length = 0;
  for(var i = 0; i < p.vertexCount; i++) {
    this._parseVertex(p, i);
  }
};


PMDFileParser.prototype._parseVertex = function(p, n) {
  var s = this._VERTEX_STRUCTURE;
  var v = new PMDVertex(n);
  this._parseObject(v, s);
  p.vertices[n] = v;
};


PMDFileParser.prototype._parseVertexIndices = function(p) {
  var s = this._VERTEX_INDICES_STRUCTURE;
  p.vertexIndexCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.vertexIndices.length = 0;
  for(var i = 0; i < p.vertexIndexCount; i++) {
    this._parseVertexIndex(p, i);
  }
};


PMDFileParser.prototype._parseVertexIndex = function(p, n) {
  var s = this._VERTEX_INDEX_STRUCTURE;
  var v = new PMDVertexIndex(n);
  this._parseObject(v, s);
  p.vertexIndices[n] = v;
};


PMDFileParser.prototype._parseMaterials = function(p) {
  var s = this._MATERIALS_STRUCTURE;
  p.materialCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.materials.length = 0;
  for(var i = 0; i < p.materialCount; i++) {
    this._parseMaterial(p, i);
  }
};


PMDFileParser.prototype._parseMaterial = function(p, n) {
  var s = this._MATERIAL_STRUCTURE;
  var m = new PMDMaterial(n);
  this._parseObject(m, s);
  p.materials[n] = m;
};


PMDFileParser.prototype._parseBones = function(p) {
  var s = this._BONES_STRUCTURE;
  p.boneCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.bones.length = 0;
  for(var i = 0; i < p.boneCount; i++) {
    this._parseBone(p, i);
  }
};


PMDFileParser.prototype._parseBone = function(p, n) {
  var s = this._BONE_STRUCTURE;
  var b = new PMDBone(n);
  this._parseObject(b, s);
  p.bones[n] = b;
};


PMDFileParser.prototype._parseIKs = function(p) {
  var s = this._IKS_STRUCTURE;
  p.ikCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.iks.length = 0;
  for(var i = 0; i < p.ikCount; i++) {
    this._parseIK(p, i);
  }
};


/**
 * NOTE: specialized _parseObject() because IK has a variable length array
 * TODO: be combined with general function _parseObject()
 *       to remove duplicated code.
 */
PMDFileParser.prototype._parseIK = function(p, n) {
  var s = this._IK_STRUCTURE;
  var ik = new PMDIK(n);

  for(var key in s) {
    if(key == 'childBoneIndices')
      continue;

    ik[key] = this._getValue(s[key], this.offset);
    this.offset += this._sizeof(s[key]);
  }

  ik.childBoneIndices = [];
  var size = this._sizeofScalar(s.childBoneIndices);
  for(var i = 0; i < ik.chainLength; i++) {
    ik.childBoneIndices[i] =
      this._getValueScalar(s.childBoneIndices, this.offset);
    this.offset += size;
  }
  p.iks[n] = ik;
};


PMDFileParser.prototype._parseFaces = function(p) {
  var s = this._FACES_STRUCTURE;
  p.faceCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.faces.length = 0;
  for(var i = 0; i < p.faceCount; i++) {
    this._parseFace(p, i);
  }
};


/**
 * NOTE: specialized _parseObject() because Face has a variable length array
 * TODO: be combined with general function _parseObject()
 *       to remove duplicated code.
 */
PMDFileParser.prototype._parseFace = function(p, n) {
  var s = this._FACE_STRUCTURE;
  var f = new PMDFace(n);

  for(var key in s) {
    if(key == 'vertices')
      continue;

    f[key] = this._getValue(s[key], this.offset);
    this.offset += this._sizeof(s[key]);
  }

  f.vertices = [];
  for(var i = 0; i < f.vertexCount; i++) {
    this._parseFaceVertex(f, i, f.type);
  }
  p.faces[n] = f;
};


PMDFileParser.prototype._parseFaceVertex = function(f, n, type) {
  var s = this._FACE_VERTEX_STRUCTURE;
  var v = new PMDFaceVertex(n, type);
  this._parseObject(v, s);
  f.vertices[n] = v;
};


PMDFileParser.prototype._parseFaceDisplays = function(p) {
  var s = this._FACE_DISPLAYS_STRUCTURE;
  p.faceDisplayCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.faceDisplays.length = 0;
  for(var i = 0; i < p.faceDisplayCount; i++) {
    this._parseFaceDisplay(p, i);
  }
};


PMDFileParser.prototype._parseFaceDisplay = function(p, n) {
  var s = this._FACE_DISPLAY_STRUCTURE;
  var d = new PMDFaceDisplay(n);
  this._parseObject(d, s);
  p.faceDisplays[n] = d;
};


PMDFileParser.prototype._parseBoneFrameNames = function(p) {
  var s = this._BONE_FRAME_NAMES_STRUCTURE;
  p.boneFrameNameCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.boneFrameNames.length = 0;
  for(var i = 0; i < p.boneFrameNameCount; i++) {
    this._parseBoneFrameName(p, i);
  }
};


PMDFileParser.prototype._parseBoneFrameName = function(p, n) {
  var s = this._BONE_FRAME_NAME_STRUCTURE;
  var d = new PMDBoneFrameName(n);
  this._parseObject(d, s);
  p.boneFrameNames[n] = d;
};


PMDFileParser.prototype._parseBoneDisplays = function(p) {
  var s = this._BONE_DISPLAYS_STRUCTURE;
  p.boneDisplayCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.boneDisplays.length = 0;
  for(var i = 0; i < p.boneDisplayCount; i++) {
    this._parseBoneDisplay(p, i);
  }
};


PMDFileParser.prototype._parseBoneDisplay = function(p, n) {
  var s = this._BONE_DISPLAY_STRUCTURE;
  var d = new PMDBoneDisplay(n);
  this._parseObject(d, s);
  p.boneDisplays[n] = d;
};


PMDFileParser.prototype._parseEnglishHeader = function(p) {
  var s = this._ENGLISH_HEADER_STRUCTURE;
  p.englishHeader = new PMDEnglishHeader();
  this._parseObject(p.englishHeader, s);

  if(p.englishHeader.compatibility == 0) {
    this.offset -= this._sizeofObject(s);
    this.offset += this._sizeof(s.compatibility);
    this.englishCompatibility = false;
  } else {
    this.englishCompatibility = true;
  }
};


PMDFileParser.prototype._parseEnglishBoneNames = function(p) {
  var s = this._ENGLISH_BONE_NAME_STRUCTURE;
  p.englishBoneNames.length = 0;
  for(var i = 0; i < p.boneCount; i++) {
    var b = new PMDEnglishBoneName(i);
    this._parseObject(b, s);
    p.englishBoneNames[i] = b;
  }
};


PMDFileParser.prototype._parseEnglishFaceNames = function(p) {
  var s = this._ENGLISH_FACE_NAME_STRUCTURE;
  p.englishFaceNames.length = 0;
  for(var i = 0; i < p.faceCount-1; i++) {
    var b = new PMDEnglishFaceName(i);
    this._parseObject(b, s);
    p.englishFaceNames[i] = b;
  }
};


PMDFileParser.prototype._parseEnglishBoneFrameNames = function(p) {
  var s = this._ENGLISH_BONE_FRAME_NAME_STRUCTURE;
  p.englishBoneFrameNames.length = 0;
  for(var i = 0; i < p.boneFrameNameCount; i++) {
    var n = new PMDEnglishBoneFrameName(i);
    this._parseObject(n, s);
    p.englishBoneFrameNames[i] = n;
  }
};


PMDFileParser.prototype._parseToonTextures = function(p) {
  var s = this._TOON_TEXTURE_STRUCTURE;
  p.toonTextureCount = 10;
  p.toonTextures.length = 0;
  for(var i = 0; i < p.toonTextureCount; i++) {
    var t = new PMDToonTexture(i);
    this._parseObject(t, s);
    p.toonTextures[i] = t;
  }
};


PMDFileParser.prototype._parseRigidBodies = function(p) {
  var s = this._RIGID_BODIES_STRUCTURE;
  p.rigidBodyCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.rigidBodies.length = 0;
  for(var i = 0; i < p.rigidBodyCount; i++) {
    this._parseRigidBody(p, i);
  }
};


PMDFileParser.prototype._parseRigidBody = function(p, n) {
  var s = this._RIGID_BODY_STRUCTURE;
  var b = new PMDRigidBody(n);
  this._parseObject(b, s);
  p.rigidBodies[n] = b;
};


PMDFileParser.prototype._parseJoints = function(p) {
  var s = this._JOINTS_STRUCTURE;
  p.jointCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  p.joints.length = 0;
  for(var i = 0; i < p.jointCount; i++) {
    this._parseJoint(p, i);
  }
};


PMDFileParser.prototype._parseJoint = function(p, n) {
  var s = this._JOINT_STRUCTURE;
  var j = new PMDJoint(n);
  this._parseObject(j, s);
  p.joints[n] = j;
};
module.exports = PMDFileParser;

},{"../FileParser":1,"../Inherit":2,"./PMDBoneDisplay":7,"./PMDBoneFrameName":8,"./PMDEnglishBoneFrameName":9,"./PMDEnglishBoneName":10,"./PMDEnglishFaceName":11,"./PMDEnglishHeader":12,"./PMDFaceDisplay":13,"./PMDFaceVertex":14,"./PMDJoint":16,"./PMDRigidBody":18,"./PMDToonTexture":19,"./Pmd":21,"./PmdBone":22,"./PmdFace":23,"./PmdHeader":24,"./PmdIk":25,"./PmdMaterial":27,"./PmdVertex":28,"./PmdVertexIndex":29}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){

/* global vec3,vec4,quat4,mat4 */
'use strict';
var Physics = require('../Physics/Physics');
/**
 * TODO: refactoring
 */
function PMDModelView(layer, pmd, pmdView) {
  this.layer = layer;
  this.pmd = pmd;
  this.view = pmdView;
  this.vmd = null;
  this.audio = null;

  this.vtf = layer.generateTexture(document.createElement('img'));
  this.vtfWidth = layer.calculateVTFWidth(pmd.boneCount*7);
  var buffer = new ArrayBuffer(this.vtfWidth * this.vtfWidth * 4);
  this.vtfUint8Array = new Uint8Array(buffer);
  this.vtfFloatArray = new Float32Array(buffer);

  this.vArray = layer.createFloatArray(pmd.vertexCount*this._V_ITEM_SIZE);
  this.vArray1 = layer.createFloatArray(pmd.vertexCount*this._V_ITEM_SIZE);
  this.vArray2 = layer.createFloatArray(pmd.vertexCount*this._V_ITEM_SIZE);
  this.vmArray = layer.createFloatArray(pmd.vertexCount*this._V_ITEM_SIZE);
  this.veArray = layer.createFloatArray(pmd.vertexCount*this._VE_ITEM_SIZE);
  this.mtArray1 = layer.createFloatArray(pmd.vertexCount*this._MT_ITEM_SIZE);
  this.mtArray2 = layer.createFloatArray(pmd.vertexCount*this._MT_ITEM_SIZE);
  this.mrArray1 = layer.createFloatArray(pmd.vertexCount*this._MR_ITEM_SIZE);
  this.mrArray2 = layer.createFloatArray(pmd.vertexCount*this._MR_ITEM_SIZE);
  this.cArray = layer.createFloatArray(pmd.vertexCount*this._C_ITEM_SIZE);
  this.iArray = layer.createUintArray(pmd.vertexIndexCount);
  this.biArray = layer.createFloatArray(pmd.vertexCount*this._BI_ITEM_SIZE);
  this.bwArray = layer.createFloatArray(pmd.vertexCount*this._BW_ITEM_SIZE);
  this.vnArray = layer.createFloatArray(pmd.vertexCount*this._VN_ITEM_SIZE);

  this.vBuffer = layer.createBuffer();
  this.vBuffer1 = layer.createBuffer();
  this.vBuffer2 = layer.createBuffer();
  this.vmBuffer = layer.createBuffer();
  this.veBuffer = layer.createBuffer();
  this.mtBuffer1 = layer.createBuffer();
  this.mtBuffer2 = layer.createBuffer();
  this.mrBuffer1 = layer.createBuffer();
  this.mrBuffer2 = layer.createBuffer();
  this.cBuffer = layer.createBuffer();
  this.iBuffer = layer.createBuffer();
  this.biBuffer = layer.createBuffer();
  this.bwBuffer = layer.createBuffer();
  this.vnBuffer = layer.createBuffer();

  this.textures = [];
  this.toonTextures = [];
  this.sphereTextures = [];

  this.basePosition = [0, 0, 0];

  this.frame = 0;

  this.motions = [];
  this.originalMotions = {};

  this.posFromBone1 = [];
  this.posFromBone2 = [];

  this.dancing = false;

  this.physics = new Physics(this.pmd);
};

// Note: for reference
PMDModelView.prototype.Math = Math;
PMDModelView.prototype.vec3 = vec3;
PMDModelView.prototype.quat4 = quat4;
PMDModelView.prototype.mat4 = mat4;

PMDModelView.prototype._V_ITEM_SIZE  = 3;
PMDModelView.prototype._C_ITEM_SIZE  = 2;
PMDModelView.prototype._I_ITEM_SIZE  = 1;
PMDModelView.prototype._BW_ITEM_SIZE = 1;
PMDModelView.prototype._BI_ITEM_SIZE = 2;
PMDModelView.prototype._MT_ITEM_SIZE = 3;
PMDModelView.prototype._MR_ITEM_SIZE = 4;
PMDModelView.prototype._VN_ITEM_SIZE = 3;
PMDModelView.prototype._VE_ITEM_SIZE  = 1;


PMDModelView.prototype.setup = function() {
  // TODO: temporal
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    for(var j = 0; j < this._MT_ITEM_SIZE; j++) {
      this.mtArray1[i*this._MT_ITEM_SIZE+j] = 0;
      this.mtArray2[i*this._MT_ITEM_SIZE+j] = 0;
    }
    for(var j = 0; j < this._MR_ITEM_SIZE; j++) {
      this.mrArray1[i*this._MR_ITEM_SIZE+j] = 0;
      this.mrArray2[i*this._MR_ITEM_SIZE+j] = 0;
    }
  }
  var layer = this.layer;
  layer.pourArrayBuffer(this.mtBuffer1, this.mtArray1,
                        this._MT_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mtBuffer2, this.mtArray2,
                        this._MT_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mrBuffer1, this.mrArray1,
                        this._MR_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mrBuffer2, this.mrArray2,
                        this._MR_ITEM_SIZE, this.pmd.vertexCount);

  this._initArrays();
  this._initTextures();
  this._pourArrays();
  this._bindBuffers();
};


/**
 * TODO: temporal
 */
PMDModelView.prototype.setBasePosition = function(x, y, z) {
  this.basePosition[0] = x;
  this.basePosition[1] = y;
  this.basePosition[2] = z;

  this._initMotions2();
  for(var i = 0; i < this.pmd.boneCount; i++) {
    this._getBoneMotion(i);
  }
  this.physics.resetRigidBodies(this.motions);
};


PMDModelView.prototype.setVMD = function(vmd) {
  this.vmd = vmd;
};


PMDModelView.prototype.startDance = function() {
  this.vmd.setup(this.pmd);
  this.dancing = true;
  this.frame = 0;

  this._initMotions2();
  this._moveBone(1);
  this.physics.resetRigidBodies(this.motions);
};


PMDModelView.prototype._initArrays = function() {
  this._initVertices();
  this._initVerticesFromBones();
  this._initVertexMorphs();
  this._initVertexEdges();
  this._initCoordinates();
  this._initIndices();
  this._initBoneWeights();
  this._initBoneIndices();
  this._initVertexNormals();
  this._initMotions();
  this._initMotionArrays();
};


PMDModelView.prototype._initVertices = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var pos = this.pmd.vertices[i].position;
    var index = i * this._V_ITEM_SIZE;

    for(var j = 0; j < this._V_ITEM_SIZE; j++) {
      this.vArray[index+j] = pos[j];
    }
  }
};


PMDModelView.prototype._initVerticesFromBones = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var pos = this.pmd.vertices[i].position;
    var bi1 = this.pmd.vertices[i].boneIndices[0];
    var bi2 = this.pmd.vertices[i].boneIndices[1];
    var b1 = this.pmd.bones[bi1];
    var b2 = this.pmd.bones[bi2];

    var v1 = this.vec3.create();
    var v2 = this.vec3.create();
    for(var j = 0; j < this._V_ITEM_SIZE; j++) {
      v1[j] = pos[j] - b1.position[j];
      v2[j] = pos[j] - b2.position[j];
    }
    this.posFromBone1.push(v1);
    this.posFromBone2.push(v2);

    var index = i * this._V_ITEM_SIZE;
    for(var j = 0; j < this._V_ITEM_SIZE; j++) {
      this.vArray1[index+j] = pos[j] - b1.position[j];
      this.vArray2[index+j] = pos[j] - b2.position[j];
    }
  }
};


PMDModelView.prototype._initVertexMorphs = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var index = i * this._V_ITEM_SIZE;

    for(var j = 0; j < this._V_ITEM_SIZE; j++) {
      this.vmArray[index+j] = 0;
    }
  }
};


PMDModelView.prototype._initVertexEdges = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    this.veArray[i] = this.pmd.vertices[i].edgeFlag ? 0.0 : 1.0;
  }
};


PMDModelView.prototype._initCoordinates = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var index = i * this._C_ITEM_SIZE;
    var uv = this.pmd.vertices[i].uv;
    for(var j = 0; j < this._C_ITEM_SIZE; j++) {
      this.cArray[index+j] = uv[j];
    }
  }
};


PMDModelView.prototype._initIndices = function() {
  for(var i = 0; i < this.pmd.vertexIndexCount; i++) {
    this.iArray[i] = this.pmd.vertexIndices[i].index;
  }
};


PMDModelView.prototype._initBoneWeights = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    this.bwArray[i] = this.pmd.vertices[i].boneWeight / 100;
  }
};


PMDModelView.prototype._initBoneIndices = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    for(var j = 0; j < this._BI_ITEM_SIZE; j++) {
      this.biArray[i*this._BI_ITEM_SIZE+j] =
        this.pmd.vertices[i].boneIndices[j];
    }
  }
};


PMDModelView.prototype._initVertexNormals = function() {
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var nor = this.pmd.vertices[i].normal;
    var index = i * this._VN_ITEM_SIZE;

    for(var j = 0; j < this._VN_ITEM_SIZE; j++) {
      this.vnArray[index+j] = nor[j];
    }
  }
};


PMDModelView.prototype._initMotionArrays = function() {
  if(this.view.skinningType == this.view._SKINNING_CPU) {
    this._skinning();
    return;
  }

  if(this.view.skinningType == this.view._SKINNING_GPU) {
    this._pourVTF();
    return;
  }

  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var bn1 = this.pmd.vertices[i].boneIndices[0];
    var bn2 = this.pmd.vertices[i].boneIndices[1];
    var m1 = this._getBoneMotion(bn1);
    var m2 = this._getBoneMotion(bn2);

    var index = i * this._MT_ITEM_SIZE;
    for(var j = 0; j < this._MT_ITEM_SIZE; j++) {
      this.mtArray1[index+j] = m1.p[j];
      this.mtArray2[index+j] = m2.p[j];
    }

    index = i * this._MR_ITEM_SIZE;
    for(var j = 0; j < this._MR_ITEM_SIZE; j++) {
      this.mrArray1[index+j] = m1.r[j];
      this.mrArray2[index+j] = m2.r[j];
    }
  }

  var layer = this.layer;
  var gl = this.layer.gl;
  var shader = this.layer.shader;
  layer.pourArrayBuffer(this.mtBuffer1, this.mtArray1,
                        this._MT_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mtBuffer2, this.mtArray2,
                        this._MT_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mrBuffer1, this.mrArray1,
                        this._MR_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.mrBuffer2, this.mrArray2,
                        this._MR_ITEM_SIZE, this.pmd.vertexCount);
};


/**
 * TODO: consider the case if images aren't loaded yet.
 */
PMDModelView.prototype._initTextures = function() {
  for(var i = 0; i < this.pmd.materialCount; i++) {
    this.textures[i] = this.layer.generateTexture(this.pmd.images[i]);
  }

  for(var i = 0; i < this.pmd.toonTextureCount; i++) {
    this.toonTextures[i] = this.layer.generateTexture(this.pmd.toonImages[i]);
  }

  for(var i = 0; i < this.pmd.materialCount; i++) {
    this.sphereTextures[i] = 
      this.layer.generateTexture(this.pmd.sphereImages[i]);
  }
};


PMDModelView.prototype._initMotions = function() {
  for(var i = 0; i < this.pmd.boneCount; i++) {
    this.motions[i] = {
      r: this.quat4.create(),
      p: this.vec3.create(),
      done: false
    };

    var b = this.pmd.bones[i];
    var a = {};
    a.location = [0, 0, 0];
    a.rotation = [0, 0, 0, 1];
    this.originalMotions[b.name] = a;
  }

};


/**
 * TODO: temporal
 */
PMDModelView.prototype._initMotions2 = function() {
  for(var i = 0; i < this.pmd.boneCount; i++) {
    this.quat4.clear(this.motions[i].r);
    this.vec3.clear(this.motions[i].p);
    this.motions[i].done = false;

    var b = this.pmd.bones[i];
    var a = this.originalMotions[b.name];
    this.vec3.clear(a.location);
    this.quat4.clear(a.rotation);
  }
};


PMDModelView.prototype._packTo4Uint8 = function(f, uint8Array, offset) {
  f = f * 1.0;
  var sign = (f < 0.0) ? 0x80 : 0x00;
  f = this.Math.abs(f);
  uint8Array[offset+0] = sign | (f & 0x7F);
  uint8Array[offset+1] = (f * 256.0) & 0xFF;
  uint8Array[offset+2] = (f * 256.0 * 256.0) & 0xFF;
  uint8Array[offset+3] = (f * 256.0 * 256.0 * 256.0) & 0xFF;
};


PMDModelView.prototype._pourVTF = function() {
  for(var i = 0; i < this.pmd.boneCount; i++) {
    var offset = 7 * i * 4;

    // Motion Translation x, y, z
    var m = this._getBoneMotion(i);
    this._packTo4Uint8(m.p[0], this.vtfUint8Array, offset+0);
    this._packTo4Uint8(m.p[1], this.vtfUint8Array, offset+4);
    this._packTo4Uint8(m.p[2], this.vtfUint8Array, offset+8);

    // Motion Rotation x, y, z, w
    this._packTo4Uint8(m.r[0], this.vtfUint8Array, offset+12);
    this._packTo4Uint8(m.r[1], this.vtfUint8Array, offset+16);
    this._packTo4Uint8(m.r[2], this.vtfUint8Array, offset+20);
    this._packTo4Uint8(m.r[3], this.vtfUint8Array, offset+24);
  }
  this.layer.pourVTF(this.vtf, this.vtfUint8Array, this.vtfWidth);
};


/**
 * TODO: rename
 */
PMDModelView.prototype.skinningOneBone = function(b) {
  if(b.id === null)
    return null;

  var m = this._getBoneMotion(b.id);
  var v = b.posFromBone;
  var vd = [0, 0, 0];
  this.quat4.multiplyVec3(m.r, v, vd);
  this.vec3.add(vd, m.p, vd);
  return vd;
};


PMDModelView.prototype._skinning = function() {
  var vd1 = this.vec3.create();
  var vd2 = this.vec3.create();
  for(var i = 0; i < this.pmd.vertexCount; i++) {
    var v = this.pmd.vertices[i];
    var bw = v.boneWeight;

    var b1Num = v.boneIndices[0];
    var b1 = this.pmd.bones[b1Num];
    var m1 = this._getBoneMotion(b1Num);
    var v1 = this.posFromBone1[i];
    this.quat4.multiplyVec3(m1.r, v1, vd1);
    this.vec3.add(vd1, m1.p, vd1);

    var index = i * this._V_ITEM_SIZE;
    if(bw >= 99) {
      this.vArray[index+0] = vd1[0];
      this.vArray[index+1] = vd1[1];
      this.vArray[index+2] = vd1[2];
    } else {
      var b2Num = v.boneIndices[1];
      var b2 = this.pmd.bones[b2Num];
      var m2 = this._getBoneMotion(b2Num);
      var v2 = this.posFromBone2[i];
      this.quat4.multiplyVec3(m2.r, v2, vd2);
      this.vec3.add(vd2, m2.p, vd2);

      var bw1 = v.boneWeightFloat1;
      var bw2 = v.boneWeightFloat2;
      this.vArray[index+0] = vd1[0] * bw1 + vd2[0] * bw2;
      this.vArray[index+1] = vd1[1] * bw1 + vd2[1] * bw2;
      this.vArray[index+2] = vd1[2] * bw1 + vd2[2] * bw2;
    }
  }

  this.layer.pourArrayBuffer(this.vBuffer, this.vArray,
                             this._V_ITEM_SIZE, this.pmd.vertexCount);
};


PMDModelView.prototype._pourArrays = function() {
  var layer = this.layer;
  layer.pourArrayBuffer(this.vBuffer, this.vArray,
                        this._V_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.vBuffer1, this.vArray1,
                        this._V_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.vBuffer2, this.vArray2,
                        this._V_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.vmBuffer, this.vmArray,
                        this._V_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.cBuffer, this.cArray,
                        this._C_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourElementArrayBuffer(this.iBuffer, this.iArray,
                        this._I_ITEM_SIZE, this.pmd.vertexIndexCount);
  layer.pourArrayBuffer(this.bwBuffer, this.bwArray,
                        this._BW_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.biBuffer, this.biArray,
                        this._BI_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.vnBuffer, this.vnArray,
                        this._VN_ITEM_SIZE, this.pmd.vertexCount);
  layer.pourArrayBuffer(this.veBuffer, this.veArray,
                        this._VE_ITEM_SIZE, this.pmd.vertexCount);
};


/**
 * TODO: remove shader specific attribute names from this class.
 */
PMDModelView.prototype._bindBuffers = function() {
  var layer = this.layer;
  var gl = this.layer.gl;
  var shader = this.layer.shader;

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute);
  gl.vertexAttribPointer(shader.vertexPositionAttribute,
                         this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer1);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute1);
  gl.vertexAttribPointer(shader.vertexPositionAttribute1,
                         this.vBuffer1.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer2);
  gl.enableVertexAttribArray(shader.vertexPositionAttribute2);
  gl.vertexAttribPointer(shader.vertexPositionAttribute2,
                         this.vBuffer2.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vmBuffer);
  gl.enableVertexAttribArray(shader.vertexMorphAttribute);
  gl.vertexAttribPointer(shader.vertexMorphAttribute,
                         this.vmBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.cBuffer);
  gl.enableVertexAttribArray(shader.textureCoordAttribute);
  gl.vertexAttribPointer(shader.textureCoordAttribute,
                         this.cBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.bwBuffer);
  gl.enableVertexAttribArray(shader.boneWeightAttribute);
  gl.vertexAttribPointer(shader.boneWeightAttribute,
                         this.bwBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.biBuffer);
  gl.enableVertexAttribArray(shader.boneIndicesAttribute);
  gl.vertexAttribPointer(shader.boneIndicesAttribute,
                         this.biBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vnBuffer);
  gl.enableVertexAttribArray(shader.vertexNormalAttribute);
  gl.vertexAttribPointer(shader.vertexNormalAttribute,
                         this.vnBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.veBuffer);
  gl.enableVertexAttribArray(shader.vertexEdgeAttribute);
  gl.vertexAttribPointer(shader.vertexEdgeAttribute,
                         this.veBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.mtBuffer1);
  gl.enableVertexAttribArray(shader.motionTranslationAttribute1);
  gl.vertexAttribPointer(shader.motionTranslationAttribute1,
                         this.mtBuffer1.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.mtBuffer2);
  gl.enableVertexAttribArray(shader.motionTranslationAttribute2);
  gl.vertexAttribPointer(shader.motionTranslationAttribute2,
                         this.mtBuffer2.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.mrBuffer1);
  gl.enableVertexAttribArray(shader.motionRotationAttribute1);
  gl.vertexAttribPointer(shader.motionRotationAttribute1,
                         this.mrBuffer1.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.mrBuffer2);
  gl.enableVertexAttribArray(shader.motionRotationAttribute2);
  gl.vertexAttribPointer(shader.motionRotationAttribute2,
                         this.mrBuffer2.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
};


PMDModelView.prototype._draw = function(texture, pos, num) {
  this.layer.draw(texture, this.layer._BLEND_ALPHA, num, pos);
};


/**
 * TODO: temporal
 */
PMDModelView.prototype.update = function(dframe) {
  this._initMotions2();

  if(this.dancing) {
    this._moveBone(dframe);
    if(this.view.morphType == this.view._MORPH_ON) {
      this._moveFace();
    }
  }

  for(var i = 0; i < this.pmd.boneCount; i++) {
    this._getBoneMotion(i);
  }

  if(this.view.physicsType == this.view._PHYSICS_ON)
    this._runPhysics(dframe);

  this._initMotionArrays();
};


/**
 * TODO: temporal
 * TODO: optimize
 */
PMDModelView.prototype.draw = function() {
  var layer = this.layer;
  var gl = this.layer.gl;
  var shader = this.layer.shader;

  this._bindBuffers();

  // TODO: temporal
  if(this.view.skinningType == this.view._SKINNING_GPU) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.vtf);
    gl.uniform1i(shader.uVTFUniform, 1);
  } else {
    gl.uniform1i(shader.uVTFUniform, 0);
  }

  gl.uniform1i(shader.edgeUniform, 0);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
                       gl.SRC_ALPHA, gl.DST_ALPHA);

  var offset = 0;
  for(var i = 0; i < this.pmd.materialCount; i++) {
    var m = this.pmd.materials[i];

    // TODO: temporal
    if(m.edgeFlag)
      gl.uniform1i(shader.shadowUniform, 1);
    else
      gl.uniform1i(shader.shadowUniform, 0);

    // TODO: temporal
    if(this.view.edgeType == this.view._EDGE_ON && m.color[3] == 1.0) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
    } else {
      gl.disable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
    }

    gl.uniform4fv(shader.diffuseColorUniform, m.color);
    gl.uniform3fv(shader.ambientColorUniform, m.mirrorColor);
    gl.uniform3fv(shader.specularColorUniform, m.specularColor);
    gl.uniform1f(shader.shininessUniform, m.specularity);

    // TODO: rename tune to toon
    if(m.hasToon()) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.toonTextures[m.tuneIndex]);
      gl.uniform1i(shader.toonTextureUniform, 2);
      gl.uniform1i(shader.useToonUniform, 1);
    } else {
      gl.uniform1i(shader.useToonUniform, 0);
    }

    if(this.view.sphereMapType == this.view._SPHERE_MAP_ON &&
       m.hasSphereTexture()) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.sphereTextures[i]);
      gl.uniform1i(shader.sphereTextureUniform, 3);
      gl.uniform1i(shader.useSphereMapUniform, 1);
      if(m.isSphereMapAddition()) {
        gl.uniform1i(shader.useSphereMapAdditionUniform, 1);
      } else {
        gl.uniform1i(shader.useSphereMapAdditionUniform, 0);
      }
    } else {
      gl.uniform1i(shader.useSphereMapUniform, 0);
    }

    var num = this.pmd.materials[i].vertexCount;
    this._draw(this.textures[i], offset, num);
    offset += num;
  }
};


PMDModelView.prototype.drawEdge = function() {
  var layer = this.layer;
  var gl = this.layer.gl;
  var shader = this.layer.shader;

  gl.uniform1i(shader.edgeUniform, 1);
  gl.uniform1i(shader.useToonUniform, 0);
  gl.cullFace(gl.BACK);
  gl.disable(gl.BLEND);
  gl.enable(gl.CULL_FACE);

  // Note: attempt to call _draw() as less as possible
  var offset = 0;
  var num = 0;
  var flag = false;
  for(var i = 0; i < this.pmd.materialCount; i++) {
    num += this.pmd.materials[i].vertexCount;
    if(! this.pmd.materials[i].edgeFlag) {
      if(flag)
        this._draw(this.textures[0], offset, num);
      offset += num;
      num = 0;
      flag = false;
    } else {
      flag = true;
    }
  }
  if(flag)
    this._draw(this.textures[0], offset, num);
};


PMDModelView.prototype.drawShadowMap = function() {
  var layer = this.layer;
  var gl = this.layer.gl;
  var shader = this.layer.shader;

  this._bindBuffers();

  // TODO: temporal
  if(this.view.skinningType == this.view._SKINNING_GPU) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.vtf);
    gl.uniform1i(shader.uVTFUniform, 1);
  } else {
    gl.uniform1i(shader.uVTFUniform, 0);
  }

  gl.uniform1i(shader.edgeUniform, 0);

  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);

  this._draw(this.textures[0], 0, this.pmd.vertexIndexCount);
};


/**
 * TODO: temporal
 */
PMDModelView.prototype._runPhysics = function(dframe) {
  if(dframe == 1)
    this.physics.simulate(this.motions);
  else
    this.physics.simulateFrame(this.motions, dframe);
};


/**
 * TODO: rename
 */
PMDModelView.prototype._loadFromVMD = function(dframe) {
  this.vmd.loadMotion();

  if(this.view.morphType == this.view._MORPH_ON)
    this.vmd.loadFace();

  this.vmd.step(dframe);
  this.frame += dframe;
};


/**
 * TODO: temporal
 * TODO: any ways to avoid update all morph Buffer?
 */
PMDModelView.prototype._moveFace = function() {
  var done = false;
  for(var i = 0; i < this.pmd.faceCount; i++) {
    var f = this.vmd.getFace(this.pmd.faces[i]);
    if(f.available) {
      this._moveMorph(this.pmd.faces[i].id, f.weight);
      done = true;
    }
  }

  if(! done)
    return;

  this.layer.pourArrayBuffer(this.vmBuffer, this.vmArray,
                             this._V_ITEM_SIZE, this.pmd.vertexCount);

  var base = this.pmd.faces[0];
  for(var i = 0; i < base.vertexCount; i++) {
    var v = base.vertices[i];
    var o = v.index * this._V_ITEM_SIZE;
    this.vmArray[o+0] = 0;
    this.vmArray[o+1] = 0;
    this.vmArray[o+2] = 0;
  }

};


/**
 * TODO: temporal
 */
PMDModelView.prototype._moveBone = function(dframe) {
  this._loadFromVMD(dframe);

  for(var i = 0; i < this.pmd.boneCount; i++) {
    this._getBoneMotion(i);
  }

  if(this.view.ikType == this.view._IK_ON)
    this._resolveIK();
};


// TODO: move generic place
vec3.clear = function(v) {
  v[0] = 0;
  v[1] = 0;
  v[2] = 0;
};


quat4.clear = function(q) {
  q[0] = 0;
  q[1] = 0;
  q[2] = 0;
  q[3] = 1;
};


PMDModelView.prototype._getOriginalBoneMotion = function(bone) {
  return (this.dancing)
           ? this.vmd.getBoneMotion(bone)
           : this.originalMotions[bone.name];
};


PMDModelView.prototype._getBoneMotion = function(index) {
  var motion = this.motions[index];
  if(! motion.done) {
    this._resolveFK(motion, index);
  }
  return motion;
};


PMDModelView.prototype._resolveFK = function(motion, index) {
  // TODO: temporal work around
  var m = this._getOriginalBoneMotion(this.pmd.bones[index]);

  var b = this.pmd.bones[index];

  if(this.pmd.bones[index].parentIndex === 0xFFFF) {
    this.vec3.add(b.position, m.location, motion.p);
    this.vec3.add(motion.p, this.basePosition, motion.p);
    this.quat4.set(m.rotation, motion.r);
  } else {
    var parentMotion = this._getBoneMotion(b.parentIndex);
    var parentBone = this.pmd.bones[b.parentIndex];
    this.quat4.multiply(parentMotion.r, m.rotation, motion.r);
    this.vec3.subtract(b.position, parentBone.position, motion.p);
    this.vec3.add(motion.p, m.location, motion.p);
    this.quat4.multiplyVec3(parentMotion.r, motion.p, motion.p);
    this.vec3.add(motion.p, parentMotion.p, motion.p);
  }
  motion.done = true;
};


/**
 * copied from MMD.js so far
 */
PMDModelView.prototype._resolveIK = function() {
  var axis = this.vec3.create();
  var tbv = this.vec3.create();
  var ikv = this.vec3.create();
  var tmpQ = this.quat4.create();
  var tmpR = this.quat4.create();

  for(var i = 0; i < this.pmd.ikCount; i++) {
    var ik = this.pmd.iks[i];
    var ikb = this.pmd.bones[ik.index];
    var tb = this.pmd.bones[ik.targetBoneIndex];
    var tpb = this.pmd.bones[tb.parentIndex]
    var ikm = this._getBoneMotion(ik.index);
    var tbm = this._getBoneMotion(ik.targetBoneIndex);
    var iterations = ik.iteration;
    var chainLength = ik.chainLength;

    this.vec3.subtract(tb.position, tpb.position, axis);
    var minLength = 0.1 * this.vec3.length(axis);

    for(var j = 0; j < iterations; j++) {
      this.vec3.subtract(tbm.p, ikm.p, axis);
      if(minLength > this.vec3.length(axis)) {
        break;
      }

      for(var k = 0; k < chainLength; k++) {
        var bn = ik.childBoneIndices[k];
        var cb = this.pmd.bones[bn];
        var cbm = this._getBoneMotion(bn);
        tbm = this._getBoneMotion(ik.targetBoneIndex);

        this.vec3.subtract(tbm.p, cbm.p, tbv);
        this.vec3.subtract(ikm.p, cbm.p, ikv);
        this.vec3.cross(tbv, ikv, axis);
        var tbvl = this.vec3.length(tbv);
        var ikvl = this.vec3.length(ikv);
        var axisLen = this.vec3.length(axis);
        var sinTheta = axisLen / ikvl / tbvl;

        // Note: somehow tbm.p can be NaN and make sinTheta Nan.
        // TODO: fix this problem because isNaN not so light function.
        if(isNaN(sinTheta)) {
          continue;
        }

        if(tbvl < minLength || ikvl < minLength || sinTheta < 0.001)
          continue;

        var maxangle = (k+1) * ik.limitation * 4;

        var theta = this.Math.asin(sinTheta);
        if(this.vec3.dot(tbv, ikv) < 0) {
          theta = 3.141592653589793 - theta;
        }
        if(theta > maxangle)
          theta = maxangle;

        this.vec3.scale(axis, this.Math.sin(theta/2) / axisLen, axis);
        this.vec3.set(axis, tmpQ);
        tmpQ[3] = this.Math.cos(theta / 2);
        var parentRotation = this._getBoneMotion(cb.parentIndex).r;
        this.quat4.inverse(parentRotation, tmpR);
        this.quat4.multiply(tmpR, tmpQ, tmpR)
        this.quat4.multiply(tmpR, cbm.r, tmpR);

        if(this.pmd.bones[bn].isKnee()) {
          var c = tmpR[3] > 1.0 ? 1.0 : tmpR[3]; // Note: Not to be NaN
          // TODO: is this negative x right?
          this.quat4.set([-this.Math.sqrt(1 - c * c), 0, 0, c], tmpR);
          this.quat4.inverse(cbm.r, tmpQ);
          this.quat4.multiply(tmpR, tmpQ, tmpQ);
          this.quat4.multiply(parentRotation, tmpQ, tmpQ);
        }

        this.quat4.normalize(tmpR, this.vmd.getBoneMotion(cb).rotation);
        this.quat4.multiply(tmpQ, cbm.r, cbm.r);
        this.motions[ik.targetBoneIndex].done = false;
        for(var l = 0; l <= k; l++) {
          this.motions[ik.childBoneIndices[l]].done = false;
        }
      }
    }
  }
};


/**
 * TODO: temporal
 */
PMDModelView.prototype._moveMorph = function(index, weight) {
//  this._initVertexMorphs();

  // TODO: temporal
  if(index == 0) {
    return;
  }

  var f = this.pmd.faces[index];
  var base = this.pmd.faces[0];
  for(var i = 0; i < f.vertexCount; i++) {
    var v = base.vertices[f.vertices[i].index];
    var o = v.index * this._V_ITEM_SIZE;
    this.vmArray[o+0] += f.vertices[i].position[0] * weight;
    this.vmArray[o+1] += f.vertices[i].position[1] * weight;
    this.vmArray[o+2] += f.vertices[i].position[2] * weight;
  }

};

module.exports = PMDModelView;

},{"../Physics/Physics":3}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
'use strict';

function PMDToonTexture(id) {
  this.id = id;
  this.fileName = null;
}


PMDToonTexture.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'fileName: ' + this.fileName + '\n';
  return str;
};

module.exports = PMDToonTexture;

},{}],20:[function(require,module,exports){

/* global vec3,vec4,quat4,mat4 */
'use strict';
/**
 * TODO: refactoring
 */
function PMDView(layer) {
  this.layer = layer;
  this.modelViews = []; // PmdModelView �C���X�^���X�ꗗ

  this.vmd = null;
  this.audio = null;

  this.eye = [0, 0, 0];
  this.center = [0, 0, 0];
  this.up = [0, 1, 0];

  this.cameraTranslation = [0, 0, 0];
  this.cameraQuaternion = [0, 0, 0, 1];
  this.cameraDistance = 0;

  this.frame = 0;
  this.dframe = 1;

  this.camera = {};
  this.camera.location = [0, 0, 0];
  this.camera.rotation = [0, 0, 0];
  this.length = 0;
  this.angle = 0;

  this.oldDate = null;
  this.startDate = null;
  this.audioStart = false;
  this.dancing = false;
  this.elapsedTime = 0.0;

  this.skinningType = null;
  this.lightingType = null;
  this.ikType = null;
  this.edgeType = null;
  this.morphType = null;
  this.sphereMapType = null;
  this.shadowMappingType = null;
  this.lightColor = [0, 0, 0];
  this.runType = null;
  this.stageType = null;
  this.effectFlag = null;
  this.audioType = null;
  this.physicsType = null;

  this.setLightingType(this._LIGHTING_ON);
  this.setSkinningType(this._SKINNING_CPU_AND_GPU);
  this.setIKType(this._IK_ON);
  this.setMorphType(this._MORPH_ON);
  this.setSphereMapType(this._SPHERE_MAP_ON);
  this.setShadowMappingType(this._SHADOW_MAPPING_OFF);
  this.setEdgeType(this._EDGE_ON);
  this.setRunType(this._RUN_REALTIME_ORIENTED);
  this.setStageType(this._STAGE_2);
  this.setEffectFlag(this._EFFECT_OFF);
  this.setAudioType(this._AUDIO_ON);
  this.setPhysicsType(this._PHYSICS_ON);
  this.setLightColor(1.0);
}

// Note: for reference
PMDView.prototype.Math = Math;
PMDView.prototype.vec3 = vec3;
PMDView.prototype.quat4 = quat4;
PMDView.prototype.mat4 = mat4;

PMDView.prototype._FRAME_S  = 1/60;
PMDView.prototype._FRAME_MS = 1/60*1000;

PMDView.prototype._PHYSICS_OFF        = 0;
PMDView.prototype._PHYSICS_ON         = 1;
PMDView.prototype._PHYSICS_WORKERS_ON = 2;

// Note: these skinning�@parameters must correspond to vertex shader.
PMDView.prototype._SKINNING_CPU         = 0;
PMDView.prototype._SKINNING_GPU         = 1;
PMDView.prototype._SKINNING_CPU_AND_GPU = 2;

// Note: these lighting parameters must correspond to vertex shader.
PMDView.prototype._LIGHTING_OFF          = 0;
PMDView.prototype._LIGHTING_ON           = 1;
PMDView.prototype._LIGHTING_ON_WITH_TOON = 2;

PMDView.prototype._IK_OFF = 0;
PMDView.prototype._IK_ON  = 1;

PMDView.prototype._MORPH_OFF = 0;
PMDView.prototype._MORPH_ON  = 1;

PMDView.prototype._SPHERE_MAP_OFF = 0;
PMDView.prototype._SPHERE_MAP_ON  = 1;

PMDView.prototype._SHADOW_MAPPING_OFF  = 0;
PMDView.prototype._SHADOW_MAPPING_ON   = 1;
PMDView.prototype._SHADOW_MAPPING_ONLY = 2;

PMDView.prototype._RUN_FRAME_ORIENTED    = 0;
PMDView.prototype._RUN_REALTIME_ORIENTED = 1;
PMDView.prototype._RUN_AUDIO_ORIENTED    = 2;

PMDView.prototype._AUDIO_OFF = 0;
PMDView.prototype._AUDIO_ON  = 1;

PMDView.prototype._EDGE_OFF = 0;
PMDView.prototype._EDGE_ON  = 1;

PMDView.prototype._STAGE_OFF = 0;
PMDView.prototype._STAGE_1   = 1;
PMDView.prototype._STAGE_2   = 2;
PMDView.prototype._STAGE_3   = 3;

PMDView.prototype._EFFECT_OFF         = 0x0;
PMDView.prototype._EFFECT_BLUR        = 0x1;
PMDView.prototype._EFFECT_GAUSSIAN    = 0x2;
PMDView.prototype._EFFECT_DIFFUSION   = 0x4;
PMDView.prototype._EFFECT_DIVISION    = 0x8;
PMDView.prototype._EFFECT_LOW_RESO    = 0x10;
PMDView.prototype._EFFECT_FACE_MOSAIC = 0x20;

PMDView._PHYSICS_OFF        = PMDView.prototype._PHYSICS_OFF;
PMDView._PHYSICS_ON         = PMDView.prototype._PHYSICS_ON;
PMDView._PHYSICS_WORKERS_ON = PMDView.prototype._PHYSICS_WORKERS_ON;

PMDView._SKINNING_CPU         = PMDView.prototype._SKINNING_CPU;
PMDView._SKINNING_GPU         = PMDView.prototype._SKINNING_GPU;
PMDView._SKINNING_CPU_AND_GPU = PMDView.prototype._SKINNING_CPU_AND_GPU;

PMDView._LIGHTING_OFF           = PMDView.prototype._LIGHTING_OFF;
PMDView._LIGHTING_ON            = PMDView.prototype._LIGHTING_ON;
PMDView._LIGHTING_ON_WITH_TOON  = PMDView.prototype._LIGHTING_ON_WITH_TOON;

PMDView._IK_OFF = PMDView.prototype._IK_OFF;
PMDView._IK_ON  = PMDView.prototype._IK_ON;

PMDView._MORPH_OFF = PMDView.prototype._MORPH_OFF;
PMDView._MORPH_ON  = PMDView.prototype._MORPH_ON;

PMDView._SPHERE_MAP_OFF = PMDView.prototype._SPHERE_MAP_OFF;
PMDView._SPHERE_MAP_ON  = PMDView.prototype._SPHERE_MAP_ON;

PMDView._SHADOW_MAPPING_OFF  = PMDView.prototype._SHADOW_MAPPING_OFF;
PMDView._SHADOW_MAPPING_ON   = PMDView.prototype._SHADOW_MAPPING_ON;
PMDView._SHADOW_MAPPING_ONLY = PMDView.prototype._SHADOW_MAPPING_ONLY;

PMDView._RUN_FRAME_ORIENTED    = PMDView.prototype._RUN_FRAME_ORIENTED;
PMDView._RUN_REALTIME_ORIENTED = PMDView.prototype._RUN_REALTIME_ORIENTED;
PMDView._RUN_AUDIO_ORIENTED    = PMDView.prototype._RUN_AUDIO_ORIENTED;

PMDView._AUDIO_OFF = PMDView.prototype._AUDIO_OFF = 0;
PMDView._AUDIO_ON  = PMDView.prototype._AUDIO_ON  = 1;

PMDView._EDGE_OFF = PMDView.prototype._EDGE_OFF;
PMDView._EDGE_ON  = PMDView.prototype._EDGE_ON;

PMDView._STAGE_OFF = PMDView.prototype._STAGE_OFF;
PMDView._STAGE_1   = PMDView.prototype._STAGE_1;
PMDView._STAGE_2   = PMDView.prototype._STAGE_2;
PMDView._STAGE_3   = PMDView.prototype._STAGE_3;

PMDView._EFFECT_OFF         = PMDView.prototype._EFFECT_OFF;
PMDView._EFFECT_BLUR        = PMDView.prototype._EFFECT_BLUR;
PMDView._EFFECT_GAUSSIAN    = PMDView.prototype._EFFECT_GAUSSIAN;
PMDView._EFFECT_DIFFUSION   = PMDView.prototype._EFFECT_DIFFUSION;
PMDView._EFFECT_DIVISION    = PMDView.prototype._EFFECT_DIVISION;
PMDView._EFFECT_LOW_RESO    = PMDView.prototype._EFFECT_LOW_RESO;
PMDView._EFFECT_FACE_MOSAIC = PMDView.prototype._EFFECT_FACE_MOSAIC;


PMDView.prototype.addModelView = function(view) {
  this.modelViews.push(view);
};


PMDView.prototype.getModelView = function(index) {
  return this.modelViews[index];
};


PMDView.prototype.getModelNum = function() {
  return this.modelViews.length;
};


PMDView.prototype.setup = function() {
  for(var i = 0; i < this.modelViews.length; i++) {
    this.modelViews[i].setup();
  }
  this.elapsedTime = 0.0;
};


PMDView.prototype.setVMD = function(vmd) {
  this.vmd = vmd;
  this.vmd.supply();
};


PMDView.prototype.setAudio = function(audio, offset) {
  this.audio = {};
  this.audio.audio = audio;
  this.audio.offset = offset;
};


PMDView.prototype.startDance = function() {
  this.vmd.setup(this.modelViews[0].pmd);
  this.elapsedTime = 0.0;
  this.dancing = true;
  this.oldDate = null;
  this.startDate = Date.now();

  this.frame = 0;
  this.dframe = 0;

  for(var i = 0; i < this.modelViews.length; i++) {
    this.modelViews[i].setVMD(this.vmd.clone());
    this.modelViews[i].startDance();
  }
};


PMDView.prototype.setEye = function(eye) {
  for(var i = 0; i < this.eye.length; i++) {
    this.eye[i] = eye[i];
  }
  this.center[0] = eye[0];
  this.center[1] = eye[1];

  this.resetCameraMove();
};


PMDView.prototype.setPhysicsType = function(type) {
  this.physicsType = type;
};


PMDView.prototype.setSkinningType = function(type) {
  this.skinningType = type;
};


PMDView.prototype.setLightingType = function(type) {
  this.lightingType = type;
};


PMDView.prototype.setLightColor = function(color) {
  this.lightColor[0] = color;
  this.lightColor[1] = color;
  this.lightColor[2] = color;
};


PMDView.prototype.setIKType = function(type) {
  this.ikType = type;
};


PMDView.prototype.setMorphType = function(type) {
  this.morphType = type;
};


PMDView.prototype.setSphereMapType = function(type) {
  this.sphereMapType = type;
};


PMDView.prototype.setShadowMappingType = function(type) {
  this.shadowMappingType = type;
};


PMDView.prototype.setRunType = function(type) {
  this.runType = type;
};


PMDView.prototype.setStageType = function(type) {
  this.stageType = type;
};


/**
 * TODO: override so far
 */
PMDView.prototype.setEffectFlag = function(flag) {
  this.effectFlag = flag;
};


PMDView.prototype.setAudioType = function(type) {
  this.audioType = type;
};


PMDView.prototype.setEdgeType = function(type) {
  this.edgeType = type;
};


PMDView.prototype.moveCameraQuaternion = function(q) {
  this.quat4.multiply(this.cameraQuaternion, q, this.cameraQuaternion);
};


PMDView.prototype.moveCameraQuaternionByXY = function(dx, dy) {
  dx = -dx;
  dy = -dy;

  var length = this.Math.sqrt(dx * dx + dy * dy);

  if(length != 0.0) {
    var radian = length * this.Math.PI;
    var theta = this.Math.sin(radian) / length;
    var q = this.quat4.create([dy * theta,
                               dx * theta,
                               0.0,
                               this.Math.cos(radian)]);
    this.moveCameraQuaternion(q);
    return true;
  }
  return false;
};


PMDView.prototype.moveCameraTranslation = function(dx, dy) {
  dy = -dy;

  this.cameraTranslation[0] += dx * 50;
  this.cameraTranslation[1] += dy * 50;
};


PMDView.prototype.resetCameraMove = function() {
  this.cameraDistance = 0;
  this.cameraTranslation[0] = 0;
  this.cameraTranslation[1] = 0;
  this.cameraTranslation[2] = 0;
  this.cameraQuaternion[0] = 0;
  this.cameraQuaternion[1] = 0;
  this.cameraQuaternion[2] = 0;
  this.cameraQuaternion[3] = 1;
};


PMDView.prototype.moveCameraForward = function(d) {
  if(d > 0)
    this.cameraDistance -= 25;
  if(d < 0)
    this.cameraDistance += 25;

  if(this.cameraDistance <= -100)
    this.cameraDistance = -99;
};



PMDView.prototype._getCalculatedCameraParams = function(eye, center, up) {
  this.vec3.set(this.eye, eye);
  this.vec3.set(this.center, center);
  this.vec3.set(this.up, up);
  this.quat4.multiplyVec3(this.cameraQuaternion, eye, eye);
  this.quat4.multiplyVec3(this.cameraQuaternion, up, up);

  var t = [0, 0, 0];
  this.vec3.set(this.cameraTranslation, t);
  this.quat4.multiplyVec3(this.cameraQuaternion, t, t);

  this.vec3.add(eye, t, eye);
  this.vec3.add(center, t, center);

  var d = [0, 0, 0];
  this.vec3.subtract(eye, center, d);
  eye[0] += d[0] * this.cameraDistance * 0.01;
  eye[1] += d[1] * this.cameraDistance * 0.01;
  eye[2] += d[2] * this.cameraDistance * 0.01;
};


/**
 * TODO: temporal
 * TODO: optimize
 */
PMDView.prototype._calculateDframe = function() {
  var newDate = Date.now();
  if(this.runType == this._RUN_FRAME_ORIENTED) {
    this.dframe = 1;
    this.elapsedTime += this._FRAME_MS;
  } else if(this.runType == this._RUN_REALTIME_ORIENTED ||
            ! this.dancing ||
            this.audio === null) {
    if(this.oldDate) {
      var prevElapsedTime = this.elapsedTime;
      var oldFrame = (this.elapsedTime / this._FRAME_MS) | 0;
      this.elapsedTime += (newDate - this.oldDate);
      var newFrame = (this.elapsedTime / this._FRAME_MS) | 0;
      var dframe = (newFrame - oldFrame);
      if(dframe <= 0) {
        newDate = this.oldDate;
        dframe = 0;
        this.elapsedTime = prevElapsedTime;
      }
      this.dframe = dframe;
    } else {
      this.dframe = 0;
    }
  } else {
    // TODO: temporal logic
    if(this.audioStart) {
      newDate = this.audio.audio.currentTime * 1000 + this.startDate
                  + this.audio.offset * this._FRAME_MS;
    }
    if(this.oldDate) {
      var prevElapsedTime = this.elapsedTime;
      var oldFrame = (this.elapsedTime / this._FRAME_MS) | 0;
      this.elapsedTime += (newDate - this.oldDate);
      var newFrame = (this.elapsedTime / this._FRAME_MS) | 0;
      var dframe = (newFrame - oldFrame);
      if(dframe <= 0) {
        newDate = this.oldDate;
        dframe = 0;
        this.elapsedTime = prevElapsedTime;
      }
      this.dframe = dframe;
    } else {
      this.dframe = 0;
    }
  }
  this.oldDate = newDate;
};


/**
 * TODO: temporal
 * TODO: maybe better to avoid dom operation to improve the performance
 */
PMDView.prototype._controlAudio = function() {
  if(! this.audio || this.audioStart ||
     this.audioType == this._AUDIO_OFF)
    return;

  if(! this.audio.offset || this.frame >= this.audio.offset) {
    this.audio.audio.play();
    if(this.audio.offset < 0) {
      this.audio.audio.currentTime = -this.audio.offset * this._FRAME_S;
    }
    this.audioStart = true;
  }
};


/**
 * TODO: temporal
 */
PMDView.prototype.update = function() {
  this._controlAudio();
  this._calculateDframe();

  if(this.dframe == 0)
    return;

  if(this.dancing) {
    this._loadFromVMD(this.dframe);
  }

  for(var i = 0; i < this.modelViews.length; i++) {
    this.modelViews[i].update(this.dframe);
  }
};


/**
 * TODO: multiple post effect support.
 * TODO: optimize
 */
PMDView.prototype.draw = function() {
  if(this.dframe == 0)
    return;

  var layer = this.layer;
  var gl = layer.gl;
  var shader = layer.shader;

  // TODO: temmporal
  var postEffect =
   (this.effectFlag & this._EFFECT_BLUR)      ? layer.postEffects['blur'] :
   (this.effectFlag & this._EFFECT_GAUSSIAN)  ? layer.postEffects['gaussian'] :
   (this.effectFlag & this._EFFECT_DIFFUSION) ? layer.postEffects['diffusion'] :
   (this.effectFlag & this._EFFECT_DIVISION)  ? layer.postEffects['division'] :
   (this.effectFlag & this._EFFECT_LOW_RESO)  ? layer.postEffects['low_reso'] :
   (this.effectFlag & this._EFFECT_FACE_MOSAIC) ? layer.postEffects['face_mosaic'] :
                                                null;

  if(this.shadowMappingType != this._SHADOW_MAPPING_OFF) {
    if(this.shadowMappingType == this._SHADOW_MAPPING_ONLY) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      layer.viewport();
      layer.perspective(layer.viewAngle);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.shadowFrameBuffer.f);
      gl.viewport(0, 0,
                  layer.shadowFrameBufferSize, layer.shadowFrameBufferSize);
      this.mat4.perspective(layer.viewAngle, 1,
                            layer.viewNear, layer.viewFar, layer.pMatrix);
    }

    layer.identity();
    layer.lookAt(layer.lightPosition, layer.lightCenter,
                 layer.lightUpDirection);
    layer.registerLightMatrix();

    gl.uniform1i(shader.shadowGenerationUniform, 1);
    gl.uniform1i(shader.shadowTextureUniform, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for(var i = 0; i < this.modelViews.length; i++) {
      this.modelViews[i].drawShadowMap();
    }
    gl.flush();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.uniform1i(shader.shadowMappingUniform, 1);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.layer.shadowFrameBuffer.t);
    gl.uniform1i(shader.shadowTextureUniform, 4);
    gl.uniformMatrix4fv(shader.lightMatrixUniform, false, layer.lightMatrix);

    if(this.shadowMappingType == this._SHADOW_MAPPING_ONLY)
      return;

  } else {
    gl.uniform1i(shader.shadowMappingUniform, 0);
  }

  this._setCamera();
  this._setDrawParameters();

  gl.uniform1i(shader.shadowGenerationUniform, 0);

  var postShader = (postEffect === null) ? null : postEffect.shader;

  if(this.effectFlag != this._EFFECT_OFF) {
    postEffect.bindFrameBufferForScene();
  } else {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  for(var i = 0; i < this.modelViews.length; i++) {
    this.modelViews[i].draw();
    if(this.edgeType == this._EDGE_ON) {
      this.modelViews[i].drawEdge();
    }
  }

  if(this.stageType != this._STAGE_OFF) {
    this._drawStage();
    if(this.effectFlag == this._EFFECT_OFF)
      gl.useProgram(shader);
  }
  gl.flush();

  if(this.effectFlag != this._EFFECT_OFF) {
    gl.useProgram(postShader);
    postShader.frame = this.frame;
    postEffect.draw(this);
    gl.useProgram(shader);
  }
};


PMDView.prototype._setCamera = function() {
  var layer = this.layer;
  var gl = layer.gl;
  var shader = layer.shader;

  layer.viewport();

  var angle = 60;
  if(this.dancing && this.vmd.getCamera().available) {
    angle = this.vmd.getCamera().angle;
    this.vmd.getCalculatedCameraParams(this.eye, this.center, this.up);
  }

  layer.perspective(angle);
  layer.identity();

  var eye = [0, 0, 0];
  var center = [0, 0, 0];
  var up = [0, 0, 0];
  this._getCalculatedCameraParams(eye, center, up);
  layer.lookAt(eye, center, up);
//  layer.lookAt(this.eye, this.center, this.up);
};


PMDView.prototype._setDrawParameters = function() {
  var layer = this.layer;
  var gl = layer.gl;
  var shader = layer.shader;

  gl.uniform1i(shader.uSkinningTypeUniform, this.skinningType);
  gl.uniform1i(shader.uLightingTypeUniform, this.lightingType);
  gl.uniform3fv(shader.lightColorUniform, this.lightColor);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};


/**
 * TODO: temporal
 * TODO: optimize
 */
PMDView.prototype._drawStage = function() {
  var layer = this.layer;
  var gl = this.layer.gl;
  var stage = this.layer.stageShaders[this.stageType-1];
  var shader = stage.shader;

  var cPos = [];
  var lfPos = [];
  var rfPos = [];
  for(var i = 0; i < this.modelViews.length; i++) {
    var v = this.modelViews[i];
    cPos.push(v.skinningOneBone(v.pmd.centerBone));
    lfPos.push(v.skinningOneBone(v.pmd.leftFootBone));
    rfPos.push(v.skinningOneBone(v.pmd.rightFootBone));
  }
  cPos = [].concat.apply([], cPos);
  lfPos = [].concat.apply([], lfPos);
  rfPos = [].concat.apply([], rfPos);

  var sFlag = false;
  if(this.shadowMappingType == this._SHADOW_MAPPING_ON) {
    sFlag = true;
  }

  stage.draw(this.frame, this.modelViews.length, cPos, lfPos, rfPos,
             sFlag, layer.lightMatrix);
};


/**
 * TODO: rename
 */
PMDView.prototype._loadFromVMD = function(dframe) {
  this.vmd.loadCamera();
  this.vmd.loadLight();

  this.vmd.step(dframe);
  this.frame += dframe;
};


/**
 * TODO: implement correctly
 */
PMDView.prototype._moveLight = function() {
  var light = this.vmd.getLight();
  if(! light.available)
    return;

  this.layer.gl.uniform3fv(this.layer.shader.lightColorUniform,
                           light.color);
  this.layer.lightPosition = light.location;
};
module.exports = PMDView;

},{}],21:[function(require,module,exports){
'use strict';

var PMDImageLoader = require('./PmdImageloader');
/**
 * instance of classes in this file should be created and
 * their fields should be set by PMDFileParser.
 * TODO: rename fields to appropriate ones.
 */
function PMD() {
  this.header = null;
  this.englishHeader = null;
  this.vertexCount = null;
  this.vertexIndexCount = null;
  this.materialCount = null;
  this.boneCount = null;
  this.ikCount = null;
  this.faceCount = null;
  this.faceDisplayCount = null;
  this.boneFrameNameCount = null;
  this.boneDisplayCount = null;
  this.toonTextureCount = null;
  this.rigidBodyCount = null;
  this.jointCount = null;

  this.vertices = [];
  this.vertexIndices = []
  this.materials = [];
  this.bones = [];
  this.iks = [];
  this.faces = [];
  this.faceDisplays = [];
  this.boneFrameNames = [];
  this.boneDisplays = [];
  this.englishBoneNames = [];
  this.englishFaceNames = [];
  this.englishBoneFrameNames = [];
  this.toonTextures = [];
  this.rigidBodies = [];
  this.joints = [];

  this.bonesHash = {};
  this.facesHash = {};

  this.images = [];
  this.toonImages = [];
  this.sphereImages = [];

  this.centerBone = {};
  this.leftFootBone = {};
  this.rightFootBone = {};
  this.leftEyeBone = {};
  this.rightEyeBone = {};
};


PMD.prototype.valid = function() {
  return this.header.valid();
};


PMD.prototype.getParentBone = function(bone) {
  return this.bones[bone.parentIndex];
};


PMD.prototype.loadImages = function(baseURL, callback) {
  var loader = new PMDImageLoader(this, baseURL);
  loader.load(callback);
};


PMD.prototype.setup = function() {
  for(var i = 0; i < this.vertexCount; i++) {
    this.vertices[i].setup();
  }

  for(var i = 0; i < this.boneCount; i++) {
    this.bonesHash[this.bones[i].name] = this.bones[i];
  }

  for(var i = 0; i < this.faceCount; i++) {
    this.facesHash[this.faces[i].name] = this.faces[i];
  }
//  this.toRight();

  this._keepSomeBonesInfo();
};


PMD.prototype.toRight = function() {
  for(var i = 0; i < this.vertexCount; i++) {
    this.vertices[i].toRight();
  }

  for(var i = 0; i < this.boneCount; i++) {
    this.bones[i].toRight();
  }

  for(var i = 0; i < this.faceCount; i++) {
    this.faces[i].toRight();
  }

  for(var i = 0; i < this.rigidBodyCount; i++) {
    this.rigidBodies[i].toRight();
  }

  for(var i = 0; i < this.jointCount; i++) {
    this.joints[i].toRight();
  }
};


/**
 * TODO: change strings if sjis-lib is used
 */
PMD.prototype._keepSomeBonesInfo = function() {
  // �Z���^�[, ������, �E����, ����, �E��
  this._keepBoneInfo(this.centerBone,    '0x830x5a0x830x930x830x5e0x810x5b');
  this._keepBoneInfo(this.leftFootBone,  '0x8d0xb60x910xab0x8e0xf1');
  this._keepBoneInfo(this.rightFootBone, '0x890x450x910xab0x8e0xf1');
  this._keepBoneInfo(this.leftEyeBone,   '0x8d0xb60x960xda');
  this._keepBoneInfo(this.rightEyeBone,  '0x890x450x960xda');
};


PMD.prototype._keepBoneInfo = function(obj, name) {
  var boneNum = this._findBoneNumberByName(name);
  if(boneNum !== null) {
    var bone = this.bones[boneNum];
    obj.pos = this._getAveragePositionOfBone(bone);
    obj.id = boneNum;
    obj.bone = bone;
    obj.posFromBone = [];
    obj.posFromBone[0] = obj.pos[0] - bone.position[0];
    obj.posFromBone[1] = obj.pos[1] - bone.position[1];
    obj.posFromBone[2] = obj.pos[2] - bone.position[2];
  } else {
    obj.pos = null;
    obj.id = null;
    obj.bone = null;
    obj.posFromBone = null;
  }
};


PMD.prototype._findBoneNumberByName = function(name) {
  for(var i = 0; i < this.boneCount; i++) {
    if(this.bones[i].name == name)
      return i;
  }
  return null;
};


/**
 * TODO: consider the algorithm again.
 */
PMD.prototype._getAveragePositionOfBone = function(bone) {
  var num = 0;
  var pos = [0, 0, 0];
  for(var i = 0; i < this.vertexCount; i++) {
    var v = this.vertices[i];
    // TODO: consider boneWeight?
    if(v.boneIndices[0] == bone.id || v.boneIndices[1] == bone.id) {
      pos[0] += v.position[0];
      pos[1] += v.position[1];
      pos[2] += v.position[2];
      num++;
    }
/*
    if(v.boneIndices[0] == bone.id) {
      pos[0] += v.position[0] * (v.boneIndex / 100);
      pos[1] += v.position[1] * (v.boneIndex / 100);
      pos[2] += v.position[2] * (v.boneIndex / 100);
      num++;
    } else if(v.boneIndices[1] == bone.id) {
      pos[0] += v.position[0] * ((100 - v.boneIndex) / 100);
      pos[1] += v.position[1] * ((100 - v.boneIndex) / 100);
      pos[2] += v.position[2] * ((100 - v.boneIndex) / 100);
      num++;
    }
*/
  }
  if(num != 0) {
    pos[0] = pos[0] / num;
    pos[1] = pos[1] / num;
    pos[2] = pos[2] / num;
  }
  return pos;
};


PMD.prototype.getBoneNames = function() {
  var array = [];
  for(var i = 0; i < this.boneCount; i++) {
    array[i] = this.bones[i].name;
  }
  return array;
};


PMD.prototype.getFaceNames = function() {
  var array = [];
  for(var i = 0; i < this.faceCount; i++) {
    array[i] = this.faces[i].name;
  }
  return array;
};


PMD.prototype.dump = function() {
  var str = '';

  str += 'vertexCount: '        + this.vertexCount        + '\n';
  str += 'vertexIndexCount: '   + this.vertexIndexCount   + '\n';
  str += 'materialCount: '      + this.materialCount      + '\n';
  str += 'boneCount: '          + this.boneCount          + '\n';
  str += 'ikCount: '            + this.ikCount            + '\n';
  str += 'faceCount: '          + this.faceCount          + '\n';
  str += 'faceDisplayCount: '   + this.faceDisplayCount   + '\n';
  str += 'boneFrameNameCount: ' + this.boneFrameNameCount + '\n';
  str += 'boneDisplayCount: '   + this.boneDisplayCount   + '\n';
  str += 'toonTextureCount: '   + this.toonTextureCount   + '\n';
  str += 'rigidBodyCount: '     + this.rigidBodyCount     + '\n';
  str += 'jointCount: '         + this.jointCount         + '\n';
  str += '\n';

  str += this._dumpHeader();
  str += this._dumpVertices();
  str += this._dumpVertexIndices();
  str += this._dumpMaterials();
  str += this._dumpBones();
  str += this._dumpIKs();
  str += this._dumpFaces();
  str += this._dumpfaceDisplays();
  str += this._dumpBoneFrameNames();
  str += this._dumpBoneDisplays();
  str += this._dumpEnglishHeader();
  str += this._dumpEnglishBoneNames();
  str += this._dumpEnglishFaceNames();
  str += this._dumpToonTextures();
  str += this._dumpRigidBodies();
  str += this._dumpJoints();

  return str;
};


PMD.prototype.boneNumsOfMaterials = function() {
  var offset = 0;
  var result = [];
  for(var i = 0; i < this.materialCount; i++) {
    var array = [];
    for(var j = 0; j < this.boneCount; j++) {
      array[j] = 0;
    }

    var count = 0;
    var num = this.materials[i].vertexCount;
    for(var j = 0; j < num; j++) {
      var v = this.vertices[this.vertexIndices[offset + j].index];
      for(var k = 0; k < v.boneIndices.length; k++) {
        var index = v.boneIndices[k];
        if(array[index] == 0)
          count++;
        array[index]++;
      }
    }
    result.push(count);
    offset += num;
  }
  return result;
};


PMD.prototype._dumpHeader = function() {
  var str = '';
  str += '-- Header --\n';
  str += this.header.dump();
  str += '\n';
  return str;
};


PMD.prototype._dumpEnglishHeader = function() {
  var str = '';
  str += '-- Header(English) --\n';
  str += this.englishHeader.dump();
  str += '\n';
  return str;
};


PMD.prototype._dumpVertices = function() {
  var str = '';
  str += '-- Vertices --\n';
  for(var i = 0; i < this.vertexCount; i++) {
    str += this.vertices[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpVertexIndices = function() {
  var str = '';
  str += '-- VertexIndices --\n';
  for(var i = 0; i < this.vertexIndexCount; i++) {
    str += this.vertexIndices[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpMaterials = function() {
  var str = '';
  str += '-- Materials --\n';
  for(var i = 0; i < this.materialCount; i++) {
    str += this.materials[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpBones = function() {
  var str = '';
  str += '-- Bones --\n';
  for(var i = 0; i < this.boneCount; i++) {
    str += this.bones[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpIKs = function() {
  var str = '';
  str += '-- IKs --\n';
  for(var i = 0; i < this.ikCount; i++) {
    str += this.iks[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpFaces = function() {
  var str = '';
  str += '-- Faces --\n';
  for(var i = 0; i < this.faceCount; i++) {
    str += this.faces[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpFaceDisplays = function() {
  var str = '';
  str += '-- Face Displays --\n';
  for(var i = 0; i < this.faceDisplayCount; i++) {
    str += this.faceDisplays[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpBoneFrameNames = function() {
  var str = '';
  str += '-- Bone Frame Names --\n';
  for(var i = 0; i < this.boneFrameNameCount; i++) {
    str += this.boneFrameNames[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpBoneDisplays = function() {
  var str = '';
  str += '-- Bone Displays --\n';
  for(var i = 0; i < this.boneDisplayCount; i++) {
    str += this.boneDisplays[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpEnglishBoneNames = function() {
  var str = '';
  str += '-- Bone Names(English) --\n';
  for(var i = 0; i < this.boneCount; i++) {
    str += this.englishBoneNames[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpEnglishFaceNames = function() {
  var str = '';
  str += '-- Face Names(English) --\n';
  for(var i = 0; i < this.faceCount-1; i++) {
    str += this.englishFaceNames[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpEnglishBoneFrameNames = function() {
  var str = '';
  str += '-- Bone Frame Names(English) --\n';
  for(var i = 0; i < this.boneFrameNameCount; i++) {
    str += this.englishBoneFrameNames[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpToonTextures = function() {
  var str = '';
  str += '-- Toon Textures --\n';
  for(var i = 0; i < this.toonTextureCount; i++) {
    str += this.toonTextures[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpRigidBodies = function() {
  var str = '';
  str += '-- Rigid Bodies --\n';
  for(var i = 0; i < this.rigidBodyCount; i++) {
    str += this.rigidBodies[i].dump();
  }
  str += '\n';
  return str;
};


PMD.prototype._dumpJoints = function() {
  var str = '';
  str += '-- Joints --\n';
  for(var i = 0; i < this.jointCount; i++) {
    str += this.joints[i].dump();
  }
  str += '\n';
  return str;
};

module.exports = PMD;

},{"./PmdImageloader":26}],22:[function(require,module,exports){
'use strict';
function PMDBone(id) {
  this.id = id;
  this.name = null;
  this.parentIndex = null;
  this.tailIndex = null;
  this.type = null;
  this.ikIndex = null;
  this.position = null;

  this.motionIndex = null; // Note: be set by VMD;
                           // TODO: remove and use id in VMD
                           //       instead of motionIndex
                           //       not to have VMD related info here
}


PMDBone.prototype.isKnee = function() {
  // TODO: change this parameter if name type changes.
  return this.name.indexOf('0x820xd00x820xb4') >= 0;
};


PMDBone.prototype.dump = function() {
  var str = '';
  str += 'id: '          + this.id          + '\n';
  str += 'name: '        + this.name        + '\n';
  str += 'parentIndex: ' + this.parentIndex + '\n';
  str += 'tailIndex: '   + this.tailIndex   + '\n';
  str += 'type: '        + this.type        + '\n';
  str += 'ikIndex: '     + this.ikIndex     + '\n';
  str += 'position: '    + this.position    + '\n';
  return str;
};


PMDBone.prototype.toRight = function() {
  this.position[2] = -this.position[2];
};



module.exports = PMDBone;

},{}],23:[function(require,module,exports){
'use strict';
function PMDFace(id) {
  this.id = id;
  this.name = null;
  this.vertexCount = null;
  this.type = null;
  this.vertices = null;
  this.done = false;

  this.motionIndex = null; // Note: be set by VMD;
                           // TODO: remove and use id in VMD
                           //       instead of motionIndex
                           //       not to have VMD related info here
}


PMDFace.prototype.dump = function() {
  var str = '';
  str += 'id: ' + this.id + '\n';
  str += 'name: ' + this.name + '\n';
  str += 'vertexCount: ' + this.vertexCount + '\n';
  str += 'type: ' + this.type + '\n';

  for(var i = 0; i < this.vertices.length; i++) {
    str += this.vertices[i].dump();
  }

  return str;
};


PMDFace.prototype.toRight = function() {
  for(var i = 0; i < this.vertices.length; i++) {
    this.vertices[i].toRight();
  }
};

module.exports = PMDFace;

},{}],24:[function(require,module,exports){
'use strict';
function PMDHeader() {
  this.magic = null;
  this.version = null;
  this.modelName = null;
  this.comment = null;
}


PMDHeader.prototype.valid = function() {
  return (this.magic == 'Pmd');
};


PMDHeader.prototype.dump = function() {
  var str = '';
  str += 'magic: '      + this.magic     + '\n';
  str += 'version: '    + this.version   + '\n';
  str += 'model_name: ' + this.modelName + '\n';
  str += 'comment: '    + this.comment   + '\n';
  return str;
};


module.exports = PMDHeader;

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
'use strict';

function PMDImageLoader(pmd, baseURL) {
  this.pmd = pmd;
  this.baseURL = baseURL;

  this.errorImageNum = 0;
  this.loadedImageNum = 0;
  this.noImageNum = 0;
}


/**
 * TODO: temporal
 */
PMDImageLoader.prototype.load = function(callback) {
  this.pmd.images.length = 0;
  this.pmd.toonImages.length = 0;
  this.pmd.sphereImages.length = 0;

  this.errorImageNum = 0;
  this.loadedImageNum = 0;
  this.noImageNum = 0;

  for(var i = 0; i < this.pmd.materialCount; i++) {
    // PmdMaterial->convertedFileName
    var fileName = this.pmd.materials[i].convertedFileName(); // tga -> png にファイル名変更
    if(fileName == '' ||
       fileName.indexOf('.spa') >= 0 ||
       fileName.indexOf('.sph') >= 0) {
      this.pmd.images[i] = this._generatePixelImage();
      this.noImageNum++;
      this._checkDone(callback);
      continue;
    }

    var self = this;
    this.pmd.images[i] = new Image();
    this.pmd.images[i].onerror = function(event) {
      self.errorImageNum++;
      self._checkDone(callback);
    }
    this.pmd.images[i].onload = function(event) {
      self.loadedImageNum++;
      self._checkDone(callback);
    }
    this.pmd.images[i].src = this.baseURL + '/' + fileName;
  }

  // TODO: duplicated code
  for(var i = 0; i < this.pmd.toonTextureCount; i++) {
    var fileName = this.pmd.toonTextures[i].fileName;
    if(fileName == '' ||
       fileName.indexOf('.spa') >= 0 ||
       fileName.indexOf('.sph') >= 0) {
      this.pmd.toonImages[i] = this._generatePixelImage();
      this.noImageNum++;
      this._checkDone(callback);
      continue;
    }

    var self = this;
    this.pmd.toonImages[i] = new Image();
    this.pmd.toonImages[i].onerror = function(event) {
      self.errorImageNum++;
      self._checkDone(callback);
    }
    this.pmd.toonImages[i].onload = function(event) {
      self.loadedImageNum++;
      self._checkDone(callback);
    }
    this.pmd.toonImages[i].src = this.baseURL + '/' + fileName;
  }

  // TODO: duplicated code
  for(var i = 0; i < this.pmd.materialCount; i++) {
    if(! this.pmd.materials[i].hasSphereTexture()) {
      this.pmd.sphereImages[i] = this._generatePixelImage();
      this.noImageNum++;
      this._checkDone(callback);
      continue;
    }

    var fileName = this.pmd.materials[i].sphereMapFileName();
    var self = this;
    this.pmd.sphereImages[i] = new Image();
    this.pmd.sphereImages[i].onerror = function(event) {
      self.errorImageNum++;
      self._checkDone(callback);
    }
    this.pmd.sphereImages[i].onload = function(event) {
      self.loadedImageNum++;
      self._checkDone(callback);
    }
    this.pmd.sphereImages[i].src = this.baseURL + '/' + fileName;
  }

};


PMDImageLoader.prototype._generatePixelImage = function() {
  var cvs = document.createElement('canvas');
  cvs.width = 1;
  cvs.height = 1;
  var ctx = cvs.getContext('2d');

  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.fillRect(0, 0, 1, 1);
  return cvs;
};


PMDImageLoader.prototype._checkDone = function(callback) {
  if(this.loadedImageNum + this.noImageNum + this.errorImageNum
       >= this.pmd.materialCount * 2 + this.pmd.toonTextureCount) {
    callback(this.pmd);
  }
};
module.exports = PMDImageLoader;

},{}],27:[function(require,module,exports){
'use strict';

function PMDMaterial(id) {
  this.id = id;
  this.color = null;
  this.specularity = null;
  this.specularColor = null;
  this.mirrorColor = null;
  this.tuneIndex = null;
  this.edgeFlag = null;
  this.vertexCount = null;
  this.fileName = null;
}


/**
 * TODO: temporal
 */
PMDMaterial.prototype.convertedFileName = function() {
  var filename = this.fileName.replace('.tga', '.png');

  // TODO: ignore sphere map so far
  var index;
  if((index = filename.lastIndexOf('*')) >= 0) {
    filename = filename.substring(0, index);
  }

  return filename;
};


/**
 * TODO: temporal
 */
PMDMaterial.prototype.hasSphereTexture = function() {
  if(this.fileName.lastIndexOf('.sph') >= 0 ||
     this.fileName.lastIndexOf('.spa') >= 0)
    return true;

  return false;
};


/**
 * TODO: temporal
 */
PMDMaterial.prototype.isSphereMapAddition = function() {
  var filename = this.fileName;

  if(filename.lastIndexOf('.spa') >= 0)
    return true;

  return false;
};


/**
 * TODO: temporal
 */
PMDMaterial.prototype.sphereMapFileName = function() {
  var filename = this.fileName;
  var index;
  if((index = filename.lastIndexOf('*')) >= 0) {
    filename = filename.slice(index+1);
  }
  if((index = filename.lastIndexOf('+')) >= 0) {
    filename = filename.slice(index+1);
  }
  return filename;
};


PMDMaterial.prototype.hasToon = function() {
  return this.tuneIndex >= 10 ? false : true;
};


PMDMaterial.prototype.dump = function() {
  var str = '';
  str += 'id: '            + this.id            + '\n';
  str += 'color: '         + this.color         + '\n';
  str += 'specularity: '   + this.specularity   + '\n';
  str += 'specularColor: ' + this.specularColor + '\n';
  str += 'mirrorColor: '   + this.mirrorColor   + '\n';
  str += 'tuneIndex: '     + this.tuneIndex     + '\n';
  str += 'edgeFlag: '      + this.edgeFlag      + '\n';
  str += 'vertexCount: '   + this.vertexCount   + '\n';
  str += 'fileName: '      + this.fileName      + '\n';
  return str;
};

module.exports = PMDMaterial;

},{}],28:[function(require,module,exports){
'use strict';
function PMDVertex(id) {
  this.id = id;
  this.position = null;
  this.normal = null;
  this.uv = null;
  this.boneIndices = null;
  this.boneWeight = null;
  this.edgeFlag = null;
  this.boneWeightFloat1 = null;
  this.boneWeightFloat2 = null;
}


PMDVertex.prototype.setup = function() {
  this.boneWeightFloat1 = this.boneWeight/100;
  this.boneWeightFloat2 = (100-this.boneWeight)/100;
};


PMDVertex.prototype.dump = function() {
  var str = '';
  str += 'id: '          + this.id          + '\n';
  str += 'position: '    + this.position    + '\n';
  str += 'normal: '      + this.normal      + '\n';
  str += 'uv: '          + this.uv          + '\n';
  str += 'boneIndices: ' + this.boneIndices + '\n';
  str += 'boneWeight: '  + this.boneWeight  + '\n';
  str += 'edgeFlag: '    + this.edgeFlag    + '\n';
  return str;
};


PMDVertex.prototype.toRight = function() {
  this.position[2] = -this.position[2];
  this.normal[2] = -this.normal[2];
};
module.exports = PMDVertex;

},{}],29:[function(require,module,exports){
'use strict';
function PMDVertexIndex(id) {
  this.id = id;
  this.index = null;
}


PMDVertexIndex.prototype.dump = function() {
  var str = '';
  str += 'id: '    + this.id    + '\n';
  str += 'index: ' + this.index + '\n';
  return str;
};



module.exports = PMDVertexIndex;

},{}],30:[function(require,module,exports){
'use strict';
/**
 * @param {Integer} type bin->2, oct->8, degit->10, hex->16
 * @param {Integer} num
 * @param {Integer} figures
 */
function __toString(type, num, figure) {

  var base = '';
  var prefix = '';
  var minus = '';

  if(type === 8)
    prefix = '0';
  else if(type === 16)
    prefix = '0x';

  for(var i = 0; i < figure; i++)
    base += '0' ;

  return prefix + (base + num.toString(type)).substr(-1 * figure);
}

module.exports = __toString;

},{}],31:[function(require,module,exports){
'use strict';

var FileParser = require('../FileParser');
var __inherit = require('../Inherit').__inherit;
var VMD = require('./Vmd');
var VMDHeader = require('./VmdHeader');
var VMDMotion = require('./VmdMotion');
var VMDFace = require('./VmdFace');
var VMDCamera = require('./VmdCamera');
var VMDLight = require('./VmdLight');

function VMDFileParser(buffer) {
  this.parent = FileParser;
  this.parent.call(this, buffer);
}
__inherit(VMDFileParser, FileParser);

VMDFileParser.prototype._HEADER_STRUCTURE = {
  magic: {type: 'char', isArray: true, size: 30},
  modelName: {type: 'char', isArray: true, size: 20}
};

VMDFileParser.prototype._MOTIONS_STRUCTURE = {
  count: {type: 'uint32'},
  motions: {type: 'object', isArray: true, size: 'count'}
};

VMDFileParser.prototype._MOTION_STRUCTURE = {
  boneName: {type: 'strings', isArray: true, size: 15},
  frameNum: {type: 'uint32'},
  location: {type: 'float', isArray: true, size: 3},
  rotation: {type: 'float', isArray: true, size: 4},
  interpolation: {type: 'uint8', isArray: true, size: 64}
};

VMDFileParser.prototype._FACES_STRUCTURE = {
  count: {type: 'uint32'},
  faces: {type: 'object', isArray: true, size: 'count'}
};

VMDFileParser.prototype._FACE_STRUCTURE = {
  name: {type: 'strings', isArray: true, size: 15},
  frameNum: {type: 'uint32'},
  weight: {type: 'float'}
};

VMDFileParser.prototype._CAMERAS_STRUCTURE = {
  count: {type: 'uint32'},
  cameras: {type: 'object', isArray: true, size: 'count'}
};

VMDFileParser.prototype._CAMERA_STRUCTURE = {
  frameNum: {type: 'uint32'},
  length: {type: 'float'},
  location: {type: 'float', isArray: true, size: 3},
  rotation: {type: 'float', isArray: true, size: 3},
  interpolation: {type: 'uint8', isArray: true, size: 24},
  angle: {type: 'uint32'},
  perspective: {type: 'uint8'}
};

VMDFileParser.prototype._LIGHTS_STRUCTURE = {
  count: {type: 'uint32'},
  lights: {type: 'object', isArray: true, size: 'count'}
};

VMDFileParser.prototype._LIGHT_STRUCTURE = {
  frameNum: {type: 'uint32'},
  color: {type: 'float', isArray: true, size: 3},
  location: {type: 'float', isArray: true, size: 3},
};


VMDFileParser.prototype.parse = function() {
  this.offset = 0;

  var v = new VMD();
  this._parseHeader(v);
  this._parseMotions(v);
  this._parseFaces(v);
  this._parseCameras(v);
  this._parseLights(v);

  return v;
};


/**
 * TODO: be more strict.
 */
VMDFileParser.prototype.valid = function() {
  var tmp = this.offset;
  this.offset = 0;

  var v = new VMD();
  this._parseHeader(v);

  this.offset = tmp;

  return v.valid();
};


VMDFileParser.prototype._parseHeader = function(v) {
  var s = this._HEADER_STRUCTURE;
  v.header = new VMDHeader();
  this._parseObject(v.header, s);
};


VMDFileParser.prototype._parseMotions = function(v) {
  var s = this._MOTIONS_STRUCTURE;
  v.motionCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  v.motions.length = 0;
  for(var i = 0; i < v.motionCount; i++) {
    this._parseMotion(v, i);
  }
};


VMDFileParser.prototype._parseMotion = function(v, n) {
  var s = this._MOTION_STRUCTURE;
  var m = new VMDMotion(n);
  this._parseObject(m, s);
  v.motions[n] = m;
};


VMDFileParser.prototype._parseFaces = function(v) {
  var s = this._FACES_STRUCTURE;
  v.faceCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  v.faces.length = 0;
  for(var i = 0; i < v.faceCount; i++) {
    this._parseFace(v, i);
  }
};


VMDFileParser.prototype._parseFace = function(v, n) {
  var s = this._FACE_STRUCTURE;
  var f = new VMDFace(n);
  this._parseObject(f, s);
  v.faces[n] = f;
};


VMDFileParser.prototype._parseCameras = function(v) {
  var s = this._CAMERAS_STRUCTURE;
  v.cameraCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  v.cameras.length = 0;
  for(var i = 0; i < v.cameraCount; i++) {
    this._parseCamera(v, i);
  }
};


VMDFileParser.prototype._parseCamera = function(v, n) {
  var s = this._CAMERA_STRUCTURE;
  var c = new VMDCamera(n);
  this._parseObject(c, s);
  v.cameras[n] = c;
};


VMDFileParser.prototype._parseLights = function(v) {
  var s = this._LIGHTS_STRUCTURE;
  v.lightCount = this._getValue(s.count, this.offset);
  this.offset += this._sizeof(s.count);

  v.lights.length = 0;
  for(var i = 0; i < v.lightCount; i++) {
    this._parseLight(v, i);
  }
};


VMDFileParser.prototype._parseLight = function(v, n) {
  var s = this._LIGHT_STRUCTURE;
  var l = new VMDLight(n);
  this._parseObject(l, s);
  v.lights[n] = l;
};

module.exports = VMDFileParser;

},{"../FileParser":1,"../Inherit":2,"./Vmd":32,"./VmdCamera":33,"./VmdFace":34,"./VmdHeader":35,"./VmdLight":36,"./VmdMotion":37}],32:[function(require,module,exports){

/* global vec3,vec4,quat4,mat4 */
'use strict';
/**
 * instance of classes in this file should be created and
 * their fields should be set by VMDFileParser.
 */
function VMD() {
  this.header = null;
  this.motionCount = null;
  this.faceCount = null;
  this.cameraCount = null;
  this.lightCount = null;

  this.motions = [];
  this.faces = [];
  this.cameras = [];
  this.lights = [];

  this.frame = 0;
  this.orderedMotions = [];
  this.orderedFaces = [];
  this.orderedCameras = [];
  this.orderedLights = [];

  this.cameraIndex = -1;
  this.lightIndex = -1;

  // TODO: rename
  this.stepMotions = [];
  this.stepFaces = [];
  this.stepCamera = {location: [0, 0, 0],
                     rotation: [0, 0, 0],
                     length: 0,
                     angle: 0,
                     available: true};
  this.stepLight = {color: [0, 0, 0],
                    location: [0, 0, 0],
                    available: true};
};

// for reference
VMD.prototype.Object = Object;
VMD.prototype.Math = Math;
VMD.prototype.vec3 = vec3;
VMD.prototype.quat4 = quat4;


VMD.prototype.valid = function() {
  return this.header.valid();
};


VMD.prototype.supply = function() {
  for(var i = 0; i < this.motionCount; i++)
    this.motions[i].supply();

  for(var i = 0; i < this.faceCount; i++)
    this.faces[i].supply();

  for(var i = 0; i < this.cameraCount; i++)
    this.cameras[i].supply();

  for(var i = 0; i < this.lightCount; i++)
    this.lights[i].supply();
};


/**
 * TODO: temporal
 */
VMD.prototype.clone = function() {
  var v = new VMD();

  v.motionCount = this.motionCount;
  v.faceCount = this.faceCount;
  v.cameraCount = this.cameraCount;
  v.lightCount = this.lightCount;

  for(var i = 0; i < this.motionCount; i++) {
    v.motions[i] = this.motions[i];
  }

  for(var i = 0; i < this.faceCount; i++) {
    v.faces[i] = this.faces[i];
  }

  for(var i = 0; i < this.cameraCount; i++) {
    v.cameras[i] = this.cameras[i];
  }

  for(var i = 0; i < this.lightCount; i++) {
    v.lights[i] = this.lights[i];
  }

  return v;
};


VMD.prototype.setup = function(pmd) {
  this.frame = 0;
  this.cameraIndex = -1;
  this.lightIndex = -1;

  if(pmd) {
    this._setupMotions(pmd);
    this._setupFaces(pmd);
  }
  this._setupCameras();
  this._setupLights();

  // TODO: temporal
  this.step(1);
};


/**
 * TODO: optimize
 */
VMD.prototype._setupMotions = function(pmd) {
  var arrays = {};
  for(var i = 0; i < this.motionCount; i++) {
    var m = this.motions[i];

    // Note: remove unnecessary element for PMD
    if(pmd.bonesHash[m.boneName] === undefined)
      continue;

    if(arrays[m.boneName] === undefined) {
      arrays[m.boneName] = {};
      arrays[m.boneName].motions = [];
      arrays[m.boneName].index = -1;
    }
    arrays[m.boneName].motions.push(m);
  }

  for(var key in arrays) {
    arrays[key].motions.sort(function(a, b) {
      return a.frameNum - b.frameNum;
    });
  }

  this.orderedMotions.length = 0;
  var motionKeys = this.Object.keys(arrays);
  for(var i = 0; i < motionKeys.length; i++) {
    this.orderedMotions[i] = arrays[motionKeys[i]];
  }

  this.stepMotions.length = 0;
  for(var i = 0; i < pmd.boneCount; i++) {
    var a = {};
    a.location = [0, 0, 0];
    a.rotation = [0, 0, 0, 1];
    this._clearVec3(a.location);   // just in case
    this._clearQuat4(a.rotation);  // just in case
    this.stepMotions[i] = a;
  }

  var boneNames = pmd.getBoneNames();
  var tmp = 0;
  for(var i = 0; i < pmd.bones.length; i++) {
    var p = pmd.bones[i];
    p.motionIndex = motionKeys.indexOf(p.name);
    if(p.motionIndex == -1) {
      p.motionIndex = motionKeys.length + tmp;
      tmp++;
    }
  }
};


VMD.prototype._setupFaces = function(pmd) {
  var arrays = {};
  for(var i = 0; i < this.faceCount; i++) {
    var f = this.faces[i];

    if(pmd.facesHash[f.name] === undefined)
      continue;

    if(arrays[f.name] === undefined) {
      arrays[f.name] = {};
      arrays[f.name].faces = [];
      arrays[f.name].index = -1;
    }
    arrays[f.name].faces.push(f);
  }

  for(var key in arrays) {
    arrays[key].faces.sort(function(a, b) {
      return a.frameNum - b.frameNum;
    });
  }

  this.orderedFaces.length = 0;
  var faceKeys = this.Object.keys(arrays);
  for(var i = 0; i < faceKeys.length; i++) {
    this.orderedFaces[i] = arrays[faceKeys[i]];
  }

  this.stepFaces.length = 0;
  for(var i = 0; i < pmd.faceCount; i++) {
    var a = {};
    a.weight = 0;
    a.available = true;
    this.stepFaces[i] = a;
  }

  var faceNames = pmd.getFaceNames();
  var tmp = 0;
  for(var i = 0; i < pmd.faces.length; i++) {
    var p = pmd.faces[i];
    p.motionIndex = faceKeys.indexOf(p.name);
    if(p.motionIndex == -1) {
      p.motionIndex = faceKeys.length + tmp;
      this.stepFaces[p.motionIndex].available = false;
      tmp++;
    }
  }

};


VMD.prototype._setupCameras = function() {
  this.orderedCameras.length = 0;
  for(var i = 0; i < this.cameraCount; i++) {
    this.orderedCameras[i] = this.cameras[i];
  }

  this.orderedCameras.sort(function(a, b) {
      return a.frameNum - b.frameNum;
  });
};


VMD.prototype._setupLights = function() {
  this.orderedLights.length = 0;
  for(var i = 0; i < this.lightCount; i++) {
    this.orderedLights[i] = {};
    this.orderedLights[i].light = this.lights[i];
  }

  this.orderedLights.sort(function(a, b) {
      return a.light.frameNum - b.light.frameNum;
  });
};


VMD.prototype.step = function(dframe) {
  this._stepMotion();
  this._stepFace();
  this._stepCamera();
  this._stepLight();

//  this.frame++;
  this.frame += dframe;
};


/**
 * TODO: check the logic.
 */
VMD.prototype._stepMotion = function() {
  for(var i = 0; i < this.orderedMotions.length; i++) {
    var m = this.orderedMotions[i];
    while(m.index+1 < m.motions.length &&
          m.motions[m.index+1].frameNum <= this.frame) {
      m.index++;
    }
  }
};


/**
 * TODO: check the logic.
 */
VMD.prototype._stepFace = function() {
  for(var i = 0; i < this.orderedFaces.length; i++) {
    var f = this.orderedFaces[i];
    while(f.index+1 < f.faces.length &&
          f.faces[f.index+1].frameNum <= this.frame) {
      f.index++;
    }
  }
};


/**
 * TODO: check the logic.
 */
VMD.prototype._stepCamera = function() {
  while(this.cameraIndex+1 < this.cameras.length &&
        this.orderedCameras[this.cameraIndex+1].frameNum <= this.frame) {
    this.cameraIndex++;
  }
};


/**
 * TODO: check the logic.
 */
VMD.prototype._stepLight = function() {
  while(this.lightIndex+1 < this.lights.length &&
        this.orderedLights[this.lightIndex+1].light.frameNum <= this.frame) {
    this.lightIndex++;
  }
};


VMD.prototype.merge = function(v) {
  this.motionCount += v.motionCount;
  this.faceCount += v.faceCount;
  this.cameraCount += v.cameraCount;
  this.lightCount += v.lightCount;

  for(var i = 0; i < v.motionCount; i++) {
    this.motions.push(v.motions[i]);
  }
  for(var i = 0; i < v.faceCount; i++) {
    this.faces.push(v.faces[i]);
  }
  for(var i = 0; i < v.cameraCount; i++) {
    this.cameras.push(v.cameras[i]);
  }
  for(var i = 0; i < v.lightCount; i++) {
    this.lights.push(v.lights[i]);
  }
};


VMD.prototype.addOffset = function(o) {
  for(var i = 0; i < this.motionCount; i++) {
    this.motions[i].frameNum += o;
  }
  for(var i = 0; i < this.faceCount; i++) {
    this.faces[i].frameNum += o;
  }
  for(var i = 0; i < this.cameraCount; i++) {
    this.cameras[i].frameNum += o;
  }
  for(var i = 0; i < this.lightCount; i++) {
    this.lights[i].frameNum += o;
  }
};


/**
 * TODO: temporal
 * TODO: calculate next frameNum at setup phase?
 * TODO: check the logic
 */
VMD.prototype.loadMotion = function() {
  for(var i = 0; i < this.orderedMotions.length; i++) {
    var m = this.orderedMotions[i];

    if(m.index == -1)
      continue;

    var m1 = m.motions[m.index];
    var m2 = m.motions[m.index+1];
    var m3 = this.stepMotions[i];

    if(m1.frameNum == this.frame
         || m2 === undefined
         || m2.frameNum - m1.frameNum <= 2) {
      this._setVec3(m1.location, m3.location);
      this._setQuat4(m1.rotation, m3.rotation);
    } else {
      // Note: linear interpolation so far
      var d = m2.frameNum - m1.frameNum;
      var d2 = this.frame - m1.frameNum;
      var r = d2/d;
      this._slerpQuat4(m1.rotation, m2.rotation, r, m3.rotation);
      this._lerpVec3(m1.location, m2.location, r, m3.location);
    }
  }

  for(var i = this.orderedMotions.length;
          i < this.stepMotions.length;
          i++) {
    var s = this.stepMotions[i];
    this._clearVec3(s.location);
    this._clearQuat4(s.rotation);
  }
};


/**
 * TODO: temporal
 * TODO: any ways to avoid update all morph Buffer?
 * TODO: check the logic.
 */
VMD.prototype.loadFace = function() {
  for(var i = 0; i < this.orderedFaces.length; i++) {
    var f = this.orderedFaces[i];

    if(f.index == -1)
      continue;

    var f1 = f.faces[f.index];
    var f2 = f.faces[f.index+1];
    var f3 = this.stepFaces[i];

    if(f1.frameNum == this.frameNum
         || f2 === undefined
         || f2.frameNum - f1.frameNum <= 2) {
      f3.weight = f1.weight;
    } else {
      var d = f2.frameNum - f1.frameNum;
      var d2 = this.frame - f1.frameNum;
      var r = d2/d;
      f3.weight = this._lerp(f1.weight, f2.weight, r);
    }
  }
};


/**
 * TODO: check the logic
 */
VMD.prototype.loadCamera = function() {
  var ocs = this.orderedCameras;
  var index = this.cameraIndex;
  this.stepCamera.available = false;

  if(index == -1)
    return;

  this.stepCamera.available = true;
  var c1 = ocs[index];
  var c2 = ocs[index+1];

  if(c1.frameNum == this.frame
       || c2 === undefined
       || c2.frameNum - c1.frameNum <= 2) {
    this._setVec3(c1.location, this.stepCamera.location);
    this._setVec3(c1.rotation, this.stepCamera.rotation);
    this.stepCamera.length = c1.length;
    this.stepCamera.angle = c1.angle;
  } else {
    // Note: linear interpolation so far
    var d = c2.frameNum - c1.frameNum;
    var d2 = this.frame - c1.frameNum;
    var r = d2/d;

    this._lerpVec3(c1.location, c2.location, r, this.stepCamera.location);
    this._lerpVec3(c1.rotation, c2.rotation, r, this.stepCamera.rotation);
    this.stepCamera.length = this._lerp(c1.length, c2.length, r);
    this.stepCamera.angle = this._lerp(c1.angle, c2.angle, r);
  }
};


/**
 * TODO: check the logic.
 * TODO: implement correctly
 */
VMD.prototype.loadLight = function() {
  var ols = this.orderedLights;
  var index = this.lightIndex;
  this.stepLight.available = false;

  if(index == -1)
    return;

  var light = ols[index].light;
  this.stepLight.available = true;
  this._setVec3(light.color,    this.stepLight.color);
  this._setVec3(light.location, this.stepLight.location);
};


VMD.prototype._setVec3 = function(a, b) {
  b[0] = a[0];
  b[1] = a[1];
  b[2] = a[2];
};


VMD.prototype._setQuat4 = function(a, b) {
  b[0] = a[0];
  b[1] = a[1];
  b[2] = a[2];
  b[3] = a[3];
};


VMD.prototype._clearVec3 = function(a) {
  a[0] = 0;
  a[1] = 0;
  a[2] = 0;
};


VMD.prototype._clearQuat4 = function(a) {
  a[0] = 0;
  a[1] = 0;
  a[2] = 0;
  a[3] = 1;
};


VMD.prototype._lerp = function(a, b, c) {
  return a * (1-c) + b * c;
};


VMD.prototype._lerpVec3 = function(a, b, c, d) {
  d[0] = this._lerp(a[0], b[0], c);
  d[1] = this._lerp(a[1], b[1], c);
  d[2] = this._lerp(a[2], b[2], c);
};


/**
 * copied from somewhere so far
 * TODO: move this logic to general matrix class or somewhere
 */
VMD.prototype._slerpQuat4 = function(q, r, t, p) {
  var cosHalfTheta = q[0]*r[0] + q[1]*r[1] + q[2]*r[2] + q[3]*r[3];
  if(cosHalfTheta < 0) {
    p[0] = -r[0];
    p[1] = -r[1];
    p[2] = -r[2];
    p[3] = -r[3];
    cosHalfTheta = -cosHalfTheta;
  } else {
    p[0] = r[0];
    p[1] = r[1];
    p[2] = r[2];
    p[3] = r[3];
  }

  if(this.Math.abs(cosHalfTheta) >= 1.0) {
    p[0] = q[0];
    p[1] = q[1];
    p[2] = q[2];
    p[3] = q[3];
    return p;
  }

  var halfTheta = this.Math.acos(cosHalfTheta);
  var sinHalfTheta = this.Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

  if(this.Math.abs(sinHalfTheta) < 0.001) {
    p[0] = 0.5 * (q[0]+r[0]);
    p[1] = 0.5 * (q[1]+r[1]);
    p[2] = 0.5 * (q[2]+r[2]);
    p[3] = 0.5 * (q[3]+r[3]);
    return p;
  }

  var ratioA = this.Math.sin((1-t) * halfTheta) / sinHalfTheta;
  var ratioB = this.Math.sin(t * halfTheta) / sinHalfTheta;

  p[0] = (q[0] * ratioA + p[0] * ratioB);
  p[1] = (q[1] * ratioA + p[1] * ratioB);
  p[2] = (q[2] * ratioA + p[2] * ratioB);
  p[3] = (q[3] * ratioA + p[3] * ratioB);
  return p;
};


/**
 * just copied from MMD.js so far
 */
vec3.rotateX = function(vec, angle, dest) {
  var rotation = mat4.rotateX(mat4.identity(mat4.create()), angle);
  return mat4.multiplyVec3(rotation, vec, dest);
};
vec3.rotateY = function(vec, angle, dest) {
  var rotation = mat4.rotateY(mat4.identity(mat4.create()), angle);
  return mat4.multiplyVec3(rotation, vec, dest);
};
vec3.rotateZ = function(vec, angle, dest) {
  var rotation = mat4.rotateZ(mat4.identity(mat4.create()), angle);
  return mat4.multiplyVec3(rotation, vec, dest);
};


VMD.prototype.getBoneMotion = function(bone) {
  return this.stepMotions[bone.motionIndex];
};


VMD.prototype.getFace = function(face) {
  return this.stepFaces[face.motionIndex];
};


VMD.prototype.getCamera = function() {
  return this.stepCamera;
};


VMD.prototype.getLight = function() {
  return this.stepLight;
};


/**
 * TODO: rename
 */
VMD.prototype.getCalculatedCameraParams = function(eye, center, up) {
  var yOffset = 0.0;
  var camera = this.getCamera();

  center[0] = camera.location[0];
  center[1] = camera.location[1]+yOffset;
  center[2] = camera.location[2];

  eye[0] = 0;
  eye[1] = 0+yOffset;
  eye[2] = camera.length;

  up[0] = 0;
  up[1] = 1;
  up[2] = 0;

  this.vec3.rotateX(eye, camera.rotation[0], eye);
  this.vec3.rotateY(eye, camera.rotation[1], eye);
  this.vec3.rotateZ(eye, camera.rotation[2], eye);
  this.vec3.add(eye, camera.location, eye);

  this.vec3.rotateX(up, camera.rotation[0], up);
  this.vec3.rotateY(up, camera.rotation[1], up);
  this.vec3.rotateZ(up, camera.rotation[2], up);
};


VMD.prototype.dump = function() {
  var str = '';

  str += 'motionCount: ' + this.motionCount + '\n';
  str += 'faceCount: '   + this.faceCount   + '\n';
  str += 'cameraCount: ' + this.cameraCount + '\n';
  str += 'lightCount: '  + this.lightCount  + '\n';

  str += this._dumpMotions();
  str += this._dumpFaces();
  str += this._dumpCameras();
  str += this._dumpLights();

  return str;
};


VMD.prototype._dumpMotions = function() {
  var str = '';
  str += '-- Motions --\n';
  for(var i = 0; i < this.motionCount; i++) {
    str += this.motions[i].dump();
  }
  str += '\n';
  return str;
};


VMD.prototype._dumpFaces = function() {
  var str = '';
  str += '-- Faces --\n';
  for(var i = 0; i < this.faceCount; i++) {
    str += this.faces[i].dump();
  }
  str += '\n';
  return str;
};


VMD.prototype._dumpCameras = function() {
  var str = '';
  str += '-- Cameras --\n';
  for(var i = 0; i < this.cameraCount; i++) {
    str += this.cameras[i].dump();
  }
  str += '\n';
  return str;
};


VMD.prototype._dumpLights = function() {
  var str = '';
  str += '-- Lights --\n';
  for(var i = 0; i < this.lightCount; i++) {
    str += this.lights[i].dump();
  }
  str += '\n';
  return str;
};

module.exports = VMD;

},{}],33:[function(require,module,exports){
'use strict';

function VMDCamera(id) {
  this.id = id;
  this.frameNum = null;
  this.length = null;
  this.location = null;
  this.rotation = null;
  this.interpolation = null;
  this.angle = null;
  this.perspective = null;
}


VMDCamera.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDCamera.prototype.dump = function() {
  var str = '';
  str += 'id: '            + this.id            + '\n';
  str += 'frameNum: '      + this.frameNum      + '\n';
  str += 'length: '        + this.length        + '\n';
  str += 'location: '      + this.location      + '\n';
  str += 'rotation: '      + this.rotation      + '\n';
  str += 'interpolation: ' + this.interpolation + '\n';
  str += 'angle: '         + this.angle         + '\n';
  str += 'perspective: '   + this.perspective   + '\n';
  return str;
};
module.exports = VMDCamera;

},{}],34:[function(require,module,exports){
 'use strict';

function VMDFace(id) {
  this.id = id;
  this.name = null;
  this.frameNum = null;
  this.weight = null;
}


VMDFace.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDFace.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'name: '     + this.name     + '\n';
  str += 'frameNum: ' + this.frameNum + '\n';
  str += 'weight: '   + this.weight   + '\n';
  return str;
};

module.exports = VMDFace;

},{}],35:[function(require,module,exports){
'use strict';
function VMDHeader() {
  this.magic = null;
  this.modelName = null;
}


VMDHeader.prototype.valid = function() {
  return (this.magic == 'Vocaloid Motion Data 0002');
};


VMDHeader.prototype.dump = function() {
  var str = '';
  str += 'magic: '     + this.magic     + '\n';
  str += 'modelName: ' + this.modelName + '\n';
  return str;
};
module.exports = VMDHeader;

},{}],36:[function(require,module,exports){
'use strict';

function VMDLight(id) {
  this.id = id;
  this.frameNum = null;
  this.color = null;
  this.location = null;
}


VMDLight.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDLight.prototype.dump = function() {
  var str = '';
  str += 'id: '       + this.id       + '\n';
  str += 'frameNum: ' + this.frameNum + '\n';
  str += 'color: '    + this.color    + '\n';
  str += 'location: ' + this.location + '\n';
  return str;
};
module.exports = VMDLight;

},{}],37:[function(require,module,exports){
'use strict';

function VMDMotion(id) {
  this.id = id;
  this.boneName = null;
  this.frameNum = null;
  this.location = null;
  this.rotation = null;
  this.interpolation = null;
}


VMDMotion.prototype.supply = function() {
  this.frameNum *= 2;
};


VMDMotion.prototype.dump = function() {
  var str = '';
  str += 'id: '            + this.id            + '\n';
  str += 'boneName: '      + this.boneName      + '\n';
  str += 'frameNum: '      + this.frameNum      + '\n';
  str += 'location: '      + this.location      + '\n';
  str += 'rotation: '      + this.rotation      + '\n';
  str += 'interpolation: ' + this.interpolation + '\n';
  return str;
};

module.exports = VMDMotion;

},{}],38:[function(require,module,exports){
/* jshint multistr: true */
'use strict';

var PostEffect = require('./PostEffect');

var __inherit = require('../Inherit').__inherit;

function BlurEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
}
__inherit(BlurEffect, PostEffect);


/* from http://wgld.org/d/webgl/w041.html */
BlurEffect.prototype._FSHADER = {};
BlurEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
BlurEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec4 color = texture2D(uSampler, gl_FragCoord.st * st);\
    color *= 0.72;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-1.0,  1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 0.0,  1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 1.0,  1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-1.0,  0.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 1.0,  0.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-1.0, -1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 0.0, -1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 1.0, -1.0)) * st)\
                        * 0.02;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-2.0,  2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-1.0,  2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 0.0,  2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 1.0,  2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 2.0,  2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-2.0,  1.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 2.0,  1.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-2.0,  0.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 2.0,  0.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-2.0, -1.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 2.0, -1.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-2.0, -2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2(-1.0, -2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 0.0, -2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 1.0, -2.0)) * st)\
                        * 0.01;\
    color += texture2D(uSampler, (gl_FragCoord.st + vec2( 2.0, -2.0)) * st)\
                        * 0.01;\
    gl_FragColor = color;\
  }\
';

module.exports = BlurEffect;

},{"../Inherit":2,"./PostEffect":46}],39:[function(require,module,exports){

/* jshint multistr: true */
'use strict';

var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;
var __copyParentMethod = require('../Inherit').__copyParentMethod;

function DiffusionBlurEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 2);
}
__inherit(DiffusionBlurEffect, PostEffect);


DiffusionBlurEffect.prototype._FSHADER = {};
DiffusionBlurEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
DiffusionBlurEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
  uniform float     uWeight[10];\
  uniform bool      uIsX;\
\
void main(void){\
  vec2 st = vec2(1.0/uWidth, 1.0/uHeight);\
  vec2 fc = gl_FragCoord.st;\
  vec4 color = vec4(0.0);\
\
  if(uIsX){\
    color += texture2D(uSampler, (fc + vec2(-9.0, 0.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(-8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(-7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(-6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(-5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(-4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(-3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(-2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(-1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 0.0, 0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2( 1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2( 3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2( 4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2( 5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2( 6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2( 7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2( 8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2( 9.0, 0.0)) * st) * uWeight[9];\
  }else{\
    color += texture2D(uSampler, (fc + vec2(0.0, -9.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(0.0, -8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0, -7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0, -6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0, -5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0, -4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0, -3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0, -2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0, -1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2(0.0,  1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0,  3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0,  4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0,  5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0,  6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0,  7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0,  8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0,  9.0)) * st) * uWeight[9];\
    vec4 color2 = texture2D(uSampler2, gl_FragCoord.st * st);\
    vec4 color3 = vec4(color2.rgb * color2.rgb, color2.a);\
    color = color3 + color - color3 * color;\
    color = max(color, color2);\
    color = mix(color2, color, 0.67);\
/*    color.a = max(color.a, color2.a);*/\
  }\
  gl_FragColor = color;\
}\
';


DiffusionBlurEffect.prototype._initUniforms = function(shader, gl) {
  this.parent.prototype._initUniforms.call(this, shader, gl);

  shader.isXUniformLocation =
    gl.getUniformLocation(shader, 'uIsX');
  shader.weightUniformLocation =
    gl.getUniformLocation(shader, 'uWeight');
};


DiffusionBlurEffect.prototype._initParams = function(shader, gl) {
  this.parent.prototype._initParams.call(this, shader, gl);

  var weight = [];
  this._getGaussianWeight(weight, 10, 20);
  shader.weight = weight;
};


__copyParentMethod(DiffusionBlurEffect, PostEffect, '_setUniforms');
DiffusionBlurEffect.prototype._setUniforms = function(n, params) {
  this.PostEffect_setUniforms(n, params);

  var shader = this.shader;
  var gl = this.layer.gl;

  gl.uniform1fv(shader.weightUniformLocation, shader.weight);
  gl.uniform1i(shader.isXUniformLocation, n == 0 ? 1 : 0);
};
module.exports = DiffusionBlurEffect;

},{"../Inherit":2,"./PostEffect":46}],40:[function(require,module,exports){

/* jshint multistr: true */
'use strict';
var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;

function DivisionEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
}
__inherit(DivisionEffect, PostEffect);


/* from http://clemz.io/article-retro-shaders-rayman-legends */
DivisionEffect.prototype._FSHADER = {};
DivisionEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
DivisionEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 2.0;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = mod(gl_FragCoord.st * st, 1.0 / n) * n;\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';
module.exports = DivisionEffect;

},{"../Inherit":2,"./PostEffect":46}],41:[function(require,module,exports){
/* jshint multistr: true */
'use strict';

var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;
var __copyParentMethod = require('../Inherit').__copyParentMethod;

/* the idea is from https://github.com/i-saint/Unity5Effects */
function FaceMosaicEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
}
__inherit(FaceMosaicEffect, PostEffect);


FaceMosaicEffect.prototype._FSHADER = {};
FaceMosaicEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
FaceMosaicEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform int   uModelNum;\
  uniform vec3  uModelFacePositions[5];\
  uniform float uModelFaceAngles[5];\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 50.0;\
    const float xSize = 0.05;\
    const float ySize = 0.02;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = gl_FragCoord.st * st;\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
\
      vec3 fpos = uModelFacePositions[i];\
      float angle = uModelFaceAngles[i];\
      vec2 dpos = pos - fpos.xy;\
      vec2 apos = vec2( dpos.x * cos(angle) + dpos.y * sin(angle), \
                       -dpos.x * sin(angle) + dpos.y * cos(angle));\
      if(apos.x > -xSize / fpos.z && \
         apos.x <  xSize / fpos.z && \
         apos.y > -ySize / fpos.z && \
         apos.y <  ySize / fpos.z) {\
        pos = floor(pos * n) / n;\
        break;\
      }\
    }\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';


FaceMosaicEffect.prototype._initUniforms = function(shader, gl) {
  this.parent.prototype._initUniforms.call(this, shader, gl);

  shader.modelNumUniformLocation =
    gl.getUniformLocation(shader, 'uModelNum');
  shader.modelFacePositionsUniformLocation =
    gl.getUniformLocation(shader, 'uModelFacePositions');
  shader.modelFaceAnglesUniformLocation =
    gl.getUniformLocation(shader, 'uModelFaceAngles');
};


/**
 * TODO: temporal
 */
__copyParentMethod(FaceMosaicEffect, PostEffect, '_setUniforms');
FaceMosaicEffect.prototype._setUniforms = function(n, params) {
  this.PostEffect_setUniforms(n);

  var shader = this.shader;
  var gl = this.layer.gl;

  var view = params; // PMDView

  var mvMatrix = this.layer.mvMatrix;
  var pMatrix = this.layer.pMatrix;
  var mvpMatrix = this.mat4.create();

  this.mat4.multiply(pMatrix, mvMatrix, mvpMatrix);

  var width = this.layer.gl.width;
  var height = this.layer.gl.height;
  var near = 0.1;
  var far = 2000.0;

  var num = 0;
  var array = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var angles = [0, 0, 0, 0, 0];
  for(var i = 0; i < view.getModelNum(); i++) {
    var v = view.modelViews[i];
    var le = v.pmd.leftEyeBone;
    var re = v.pmd.rightEyeBone;

    if(le.id === null || re.id === null)
      continue;

    var a1 = v.skinningOneBone(le);
    var a2 = v.skinningOneBone(re);
    a1[3] = 1.0;
    a2[3] = 1.0;

    var a = [(a1[0] + a2[0]) / 2.0,
             (a1[1] + a2[1]) / 2.0,
             (a1[2] + a2[2]) / 2.0,
             1.0];

    this.mat4.multiplyVec4(mvpMatrix, a, a)
    this.mat4.multiplyVec4(mvpMatrix, a1, a1)
    this.mat4.multiplyVec4(mvpMatrix, a2, a2)

    a[0] = a[0] / a[3];
    a[1] = a[1] / a[3];
    a[2] = a[2] / a[3];
    a[0] = (a[0] + 1.0) / 2.0;
    a[1] = (a[1] + 1.0) / 2.0;
    a[2] = (a[2] + 1.0) / 2.0;
    a1[0] = a1[0] / a1[3];
    a1[1] = a1[1] / a1[3];
    a1[2] = a1[2] / a1[3];
    a1[0] = (a1[0] + 1.0) / 2.0;
    a1[1] = (a1[1] + 1.0) / 2.0;
    a1[2] = (a1[2] + 1.0) / 2.0;
    a2[0] = a2[0] / a2[3];
    a2[1] = a2[1] / a2[3];
    a2[2] = a2[2] / a2[3];
    a2[0] = (a2[0] + 1.0) / 2.0;
    a2[1] = (a2[1] + 1.0) / 2.0;
    a2[2] = (a2[2] + 1.0) / 2.0;

    var angle = this.Math.atan2(a2[1] - a1[1], a2[0] - a1[0]);

    angles[num] = angle;
    array[num*3+0] = a[0];
    array[num*3+1] = a[1];
    array[num*3+2] = a[2];
    num++;
  }

  gl.uniform3fv(shader.modelFacePositionsUniformLocation, array);
  gl.uniform1fv(shader.modelFaceAnglesUniformLocation, angles);
  gl.uniform1i(shader.modelNumUniformLocation, num);
};

module.exports = FaceMosaicEffect;

},{"../Inherit":2,"./PostEffect":46}],42:[function(require,module,exports){
/* jshint multistr: true */
'use strict';

var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;
var __copyParentMethod = require('../Inherit').__copyParentMethod;
function GaussianBlurEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 2);
}
__inherit(GaussianBlurEffect, PostEffect);

GaussianBlurEffect.prototype._FSHADER = {};
GaussianBlurEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
// from: http://wgld.org/d/webgl/w057.html
GaussianBlurEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
  uniform float     uWeight[10];\
  uniform bool      uIsX;\
\
void main(void){\
  vec2 st = vec2(1.0/uWidth, 1.0/uHeight);\
  vec2 fc = gl_FragCoord.st;\
  vec4 color = vec4(0.0);\
\
  if(uIsX){\
    color += texture2D(uSampler, (fc + vec2(-9.0, 0.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(-8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(-7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(-6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(-5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(-4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(-3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(-2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(-1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 0.0, 0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2( 1.0, 0.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2( 2.0, 0.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2( 3.0, 0.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2( 4.0, 0.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2( 5.0, 0.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2( 6.0, 0.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2( 7.0, 0.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2( 8.0, 0.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2( 9.0, 0.0)) * st) * uWeight[9];\
  }else{\
    color += texture2D(uSampler, (fc + vec2(0.0, -9.0)) * st) * uWeight[9];\
    color += texture2D(uSampler, (fc + vec2(0.0, -8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0, -7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0, -6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0, -5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0, -4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0, -3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0, -2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0, -1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  0.0)) * st) * uWeight[0];\
    color += texture2D(uSampler, (fc + vec2(0.0,  1.0)) * st) * uWeight[1];\
    color += texture2D(uSampler, (fc + vec2(0.0,  2.0)) * st) * uWeight[2];\
    color += texture2D(uSampler, (fc + vec2(0.0,  3.0)) * st) * uWeight[3];\
    color += texture2D(uSampler, (fc + vec2(0.0,  4.0)) * st) * uWeight[4];\
    color += texture2D(uSampler, (fc + vec2(0.0,  5.0)) * st) * uWeight[5];\
    color += texture2D(uSampler, (fc + vec2(0.0,  6.0)) * st) * uWeight[6];\
    color += texture2D(uSampler, (fc + vec2(0.0,  7.0)) * st) * uWeight[7];\
    color += texture2D(uSampler, (fc + vec2(0.0,  8.0)) * st) * uWeight[8];\
    color += texture2D(uSampler, (fc + vec2(0.0,  9.0)) * st) * uWeight[9];\
  }\
  gl_FragColor = color;\
}\
';


GaussianBlurEffect.prototype._initUniforms = function(shader, gl) {
  this.parent.prototype._initUniforms.call(this, shader, gl);

  shader.isXUniformLocation =
    gl.getUniformLocation(shader, 'uIsX');
  shader.weightUniformLocation =
    gl.getUniformLocation(shader, 'uWeight');
};


GaussianBlurEffect.prototype._initParams = function(shader, gl) {
  this.parent.prototype._initParams.call(this, shader, gl);

  var weight = [];
  this._getGaussianWeight(weight, 10, 25);
  shader.weight = weight;
};


__copyParentMethod(GaussianBlurEffect, PostEffect, '_setUniforms');
GaussianBlurEffect.prototype._setUniforms = function(n, params) {
  this.PostEffect_setUniforms(n, params);

  var shader = this.shader;
  var gl = this.layer.gl;

  gl.uniform1fv(shader.weightUniformLocation, shader.weight);
  gl.uniform1i(shader.isXUniformLocation, n == 0 ? 1 : 0);
};

module.exports = GaussianBlurEffect;

},{"../Inherit":2,"./PostEffect":46}],43:[function(require,module,exports){

/* global mat4,mat3,alert,vec3 */
/* jshint multistr: true */
'use strict';

var BlurEffect = require('./BlurEffect');
var GaussianBlurEffect = require('./GaussianBlurEffect');
var DiffusionBlurEffect = require('./DiffusionBlurEffect');
var DivisionEffect = require('./DivisionEffect');
var LowResolutionEffect = require('./LowResolutionEffect');
var FaceMosaicEffect = require('./FaceMosaicEffect');
var SimpleStage = require('./SimpleStage');
var MeshedStage = require('./MeshedStage');
var TrialStage = require('./TrialStage');

function Layer(canvas) {
  this.canvas = canvas;
  this.gl = this._initGl(canvas);
  this.shader = this._initShader(this.gl);

  this.viewNear = 0.1;
  this.viewFar = 2000.0;
  this.viewAngle = 60;
  this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
  this.gl.clearDepth(1.0);

  this.stageShaders = [];
  this.postEffects = {};

  this.mvMatrix = this.mat4.create();
  this.pMatrix = this.mat4.create();
  this.mvpMatrix = this.mat4.create();

 // TODO: temporal
  this.lightPosition = [20, 50, -40];
  this.lightCenter = [0, 0, 10];
  this.lightUpDirection = [0, 1, 0];
  this.lightMatrix = this.mat4.create();
  this.shadowFrameBuffer = null;
  this.shadowFrameBufferSize = 1024;

  this._initPostEffects();
  this._initStageShaders();
  this._initShadowFrameBuffer();
}

// only for reference.
Layer.prototype.mat4 = mat4;
Layer.prototype.Math = Math;

Layer.prototype._NAMES = ['webgl', 'experimental-webgl'];

Layer.prototype._BLEND_ALPHA     = 0;
Layer.prototype._BLEND_ALPHA2    = 1;
Layer.prototype._BLEND_ADD_ALPHA = 2;

Layer.prototype._SHADERS = {};

Layer.prototype._SHADERS['shader-vs'] = {};
Layer.prototype._SHADERS['shader-vs'].type = 'x-shader/x-vertex';
Layer.prototype._SHADERS['shader-vs'].src = '\
  attribute vec3 aVertexPosition;\
  attribute vec3 aVertexPosition1;\
  attribute vec3 aVertexPosition2;\
  attribute vec3 aVertexNormal;\
  attribute vec3 aVertexMorph;\
  attribute float aVertexEdge;\
  attribute vec2 aBoneIndices;\
  attribute float aBoneWeight;\
  attribute vec3 aMotionTranslation1;\
  attribute vec3 aMotionTranslation2;\
  attribute vec4 aMotionRotation1;\
  attribute vec4 aMotionRotation2;\
  attribute vec2 aTextureCoordinates;\
\
  uniform mat4 uMVMatrix;\
  uniform mat4 uPMatrix;\
  uniform mat4 uMVPMatrix;\
  uniform mat3 uNMatrix;\
  uniform vec3 uLightColor;\
  uniform vec3 uLightDirection;\
  uniform vec4 uDiffuseColor;\
  uniform vec3 uAmbientColor;\
  uniform vec3 uSpecularColor;\
  uniform float uShininess;\
  uniform int uSkinningType;\
  uniform int uLightingType;\
  uniform int uVTFWidth;\
  uniform sampler2D uVTF;\
  uniform sampler2D uToonTexture;\
  uniform bool uUseToon;\
  uniform bool uEdge;\
  uniform bool uShadow;\
  uniform mat4 uLightMatrix;\
  uniform bool uShadowGeneration;\
  uniform bool uShadowMapping;\
\
  varying vec2 vTextureCoordinates;\
  varying vec4 vLightWeighting;\
  varying vec3 vNormal;\
  varying vec4 vShadowDepth;\
\
  highp float binary32(vec4 rgba) {\
    rgba = floor(255.0 * rgba + 0.5);\
    highp float val;\
    val  = rgba[0];\
    val += rgba[1] / (256.0);\
    val += rgba[2] / (256.0 * 256.0);\
    val += rgba[3] / (256.0 * 256.0 * 256.0);\
    return rgba[0] >= 128.0 ? -(val - 128.0) : val;\
  }\
\
  float getU(float index) {\
    float unit = 1.0 / float(uVTFWidth);\
    return fract(index * unit + unit * 0.5);\
  }\
\
  float getV(float index) {\
    float unit = 1.0 / float(uVTFWidth);\
    return floor(index * unit) * unit + unit * 0.5;\
  }\
\
  vec2 getUV(float index) {\
    float u = getU(index);\
    float v = getV(index);\
    return vec2(u, v);\
  }\
\
  vec4 getVTF(float index) {\
    return texture2D(uVTF, getUV(index));\
  }\
\
  vec3 getMotionTranslation(float bn) {\
    float index = bn * 7.0 + 0.0;\
    highp float x = binary32(getVTF(index+0.0));\
    highp float y = binary32(getVTF(index+1.0));\
    highp float z = binary32(getVTF(index+2.0));\
    return vec3(x, y, z);\
  }\
\
  vec4 getMotionRotation(float bn) {\
    float index = bn * 7.0 + 3.0;\
    highp float x = binary32(getVTF(index+0.0));\
    highp float y = binary32(getVTF(index+1.0));\
    highp float z = binary32(getVTF(index+2.0));\
    highp float w = binary32(getVTF(index+3.0));\
    return vec4(x, y, z, w);\
  }\
\
  vec3 qtransform(vec3 v, vec4 q) {\
    return v + 2.0 * cross(cross(v, q.xyz) - q.w*v, q.xyz);\
  }\
\
  void main() {\
    vec3 pos;\
    vec3 norm;\
    if(uSkinningType == 2) {\
      vec3 v1 = aVertexPosition1 + aVertexMorph;\
      v1 = qtransform(v1, aMotionRotation1) + aMotionTranslation1;\
      norm = qtransform(aVertexNormal, aMotionRotation1);\
      if(aBoneWeight < 0.99) {\
        vec3 v2 = aVertexPosition2 + aVertexMorph;\
        v2 = qtransform(v2, aMotionRotation2) + aMotionTranslation2;\
        pos = mix(v2, v1, aBoneWeight);\
        vec3 n2 = qtransform(aVertexNormal, aMotionRotation2);\
        norm = normalize(mix(n2, norm, aBoneWeight));\
      } else {\
        pos = v1;\
      }\
    } else if(uSkinningType == 1) {\
      float b1 = floor(aBoneIndices.x + 0.5);\
      vec3 v1 = aVertexPosition1 + aVertexMorph;\
      v1 = qtransform(v1, getMotionRotation(b1)) + getMotionTranslation(b1);\
      norm = qtransform(aVertexNormal, getMotionRotation(b1));\
      if(aBoneWeight < 0.99) {\
        float b2 = floor(aBoneIndices.y + 0.5);\
        vec3 v2 = aVertexPosition2 + aVertexMorph;\
        v2 = qtransform(v2, getMotionRotation(b2)) + getMotionTranslation(b2);\
        pos = mix(v2, v1, aBoneWeight);\
        vec3 n2 = qtransform(aVertexNormal, getMotionRotation(b2));\
        norm = normalize(mix(n2, norm, aBoneWeight));\
      } else {\
        pos = v1;\
      }\
    } else {\
      pos = aVertexPosition + aVertexMorph;\
      norm = normalize(aVertexNormal);\
    }\
\
    gl_Position = uMVPMatrix * vec4(pos, 1.0);\
\
    if(uShadowGeneration) {\
      vShadowDepth = gl_Position;\
      return;\
    }\
\
    vTextureCoordinates = aTextureCoordinates;\
    vNormal = normalize(norm);\
\
    if(uShadowMapping) {\
      vShadowDepth = uLightMatrix * vec4(pos, 1.0);\
    }\
\
    if(! uEdge && uLightingType > 0) {\
      vec4 vertexPositionEye4 = uMVMatrix * vec4(pos, 1.0);\
      vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;\
      vec3 vectorToLightSource = normalize(uLightDirection -\
                                           vertexPositionEye3);\
      vec3 normalEye = normalize(uNMatrix * norm);\
      float diffuseLightWeightning = (uShadow)\
                                       ? max(dot(normalEye,\
                                                 vectorToLightSource), 0.0)\
                                       : 1.0;\
      vec3 reflectionVector = normalize(reflect(-vectorToLightSource,\
                                                 normalEye));\
      vec3 viewVectorEye = -normalize(vertexPositionEye3);\
      float rdotv = max(dot(reflectionVector, viewVectorEye), 0.0);\
      float specularLightWeightning = pow(rdotv, uShininess);\
\
      vec3 vLight = uAmbientColor + \
                    uLightColor *\
                      (uDiffuseColor.rgb * diffuseLightWeightning +\
                       uSpecularColor * specularLightWeightning);\
\
      vLightWeighting = clamp(vec4(vLight, uDiffuseColor.a), 0.0, 1.0);\
\
      if(uLightingType == 2 && uUseToon) {\
        vec2 toonCoord = vec2(0.0, 0.5 * (1.0 - dot(uLightDirection,\
                                                    normalEye)));\
        vLightWeighting.rgb *= texture2D(uToonTexture, toonCoord).rgb;\
      }\
    } else {\
      vLightWeighting = uDiffuseColor;\
    }\
\
    /* just copied from MMD.js */\
    if(uEdge) {\
      const float thickness = 0.003;\
      vec4 epos = gl_Position;\
      vec4 epos2 = uMVPMatrix * vec4(pos + norm, 1.0);\
      vec4 enorm = normalize(epos2 - epos);\
      gl_Position = epos + enorm * thickness * aVertexEdge * epos.w;\
    }\
  }\
';

Layer.prototype._SHADERS['shader-fs'] = {};
Layer.prototype._SHADERS['shader-fs'].type = 'x-shader/x-fragment';
Layer.prototype._SHADERS['shader-fs'].src = '\
  precision mediump float;\
  varying vec2 vTextureCoordinates;\
  uniform sampler2D uSampler;\
  uniform bool uEdge;\
  uniform bool uUseSphereMap;\
  uniform bool uUseSphereMapAddition;\
  uniform bool uShadowGeneration;\
  uniform bool uShadowMapping;\
  uniform sampler2D uSphereTexture;\
  uniform sampler2D uShadowTexture;\
  varying vec4 vLightWeighting;\
  varying vec3 vNormal;\
  varying vec4 vShadowDepth;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  void main() {\
\
    if(uEdge) {\
      gl_FragColor = vec4(vec3(0.0), vLightWeighting.a);\
      return;\
    }\
\
    if(uShadowGeneration) {\
/*      gl_FragColor = packDepth(gl_FragCoord.z);*/\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      gl_FragColor = packDepth(lightCoord.z);\
      return;\
    }\
\
    vec4 textureColor = texture2D(uSampler, vTextureCoordinates);\
\
    /* just copied from MMD.js */\
    if(uUseSphereMap) {\
      vec2 sphereCood = 0.5 * (1.0 + vec2(1.0, -1.0) * vNormal.xy);\
      vec3 sphereColor = texture2D(uSphereTexture, sphereCood).rgb;\
      if(uUseSphereMapAddition) {\
        textureColor.rgb += sphereColor;\
      } else {\
        textureColor.rgb *= sphereColor;\
      }\
    }\
\
    vec4 color = vLightWeighting * textureColor;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth2 - 0.00002 > depth) {\
        color.rgb *= 0.7;\
      }\
    }\
\
    gl_FragColor = color;\
  }\
';


Layer.prototype._initGl = function(canvas) {
  var names = this._NAMES;
  var context = null;
  for(var i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i], {antialias: true});
    } catch(e) {
      if(context)
        break;
    }
  }
  if(context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
};


Layer.prototype._compileShaderFromDOM = function(gl, id) {
  var script = document.getElementById(id);

  if(!script)
    return null;

  var source = '';
  var currentChild = script.firstChild;
  while(currentChild) {
    if(currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      source += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  return this.compileShader(gl, source, script.type);
};


Layer.prototype.compileShader = function(gl, source, type) {
  var shader;
  if(type == 'x-shader/x-fragment') {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if(type == 'x-shader/x-vertex') {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
};


Layer.prototype._initVertexShader = function(gl) {
  var params = this._SHADERS['shader-vs'];

  // TODO: temporal workaround
  if(this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) <= 0) {
    params.src = params.src.replace('texture2D(uVTF, getUV(index))',
                                    'vec4(0.0)');
    params.src = params.src.replace(
        'vLightWeighting.rgb *= texture2D(uToonTexture, toonCoord).rgb',
        'vLightWeighting.rgb *= vec3(1.0)');
  }

  return this.compileShader(gl, params.src, params.type);
};


Layer.prototype._initFragmentShader = function(gl) {
  var params = this._SHADERS['shader-fs'];
  return this.compileShader(gl, params.src, params.type);
};


Layer.prototype._initShader = function(gl) {
  var vertexShader = this._initVertexShader(gl);
  var fragmentShader = this._initFragmentShader(gl);

  var shader = gl.createProgram();
  gl.attachShader(shader, vertexShader);
  gl.attachShader(shader, fragmentShader);
  gl.linkProgram(shader);

  if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shader);

  shader.vertexPositionAttribute =
    gl.getAttribLocation(shader, 'aVertexPosition');
  shader.vertexPositionAttribute1 =
    gl.getAttribLocation(shader, 'aVertexPosition1');
  shader.vertexPositionAttribute2 =
    gl.getAttribLocation(shader, 'aVertexPosition2');
  shader.vertexMorphAttribute =
    gl.getAttribLocation(shader, 'aVertexMorph');
  shader.vertexEdgeAttribute =
    gl.getAttribLocation(shader, 'aVertexEdge');
  shader.vertexNormalAttribute =
    gl.getAttribLocation(shader, 'aVertexNormal');
  shader.boneWeightAttribute =
    gl.getAttribLocation(shader, 'aBoneWeight');
  shader.boneIndicesAttribute =
    gl.getAttribLocation(shader, 'aBoneIndices');

  shader.motionTranslationAttribute1 =
    gl.getAttribLocation(shader, 'aMotionTranslation1');
  shader.motionTranslationAttribute2 =
    gl.getAttribLocation(shader, 'aMotionTranslation2');
  shader.motionRotationAttribute1 =
    gl.getAttribLocation(shader, 'aMotionRotation1');
  shader.motionRotationAttribute2 =
    gl.getAttribLocation(shader, 'aMotionRotation2');

  shader.textureCoordAttribute = 
    gl.getAttribLocation(shader, 'aTextureCoordinates');

  shader.pMatrixUniform =
    gl.getUniformLocation(shader, 'uPMatrix');
  shader.mvMatrixUniform =
    gl.getUniformLocation(shader, 'uMVMatrix');
  shader.mvpMatrixUniform =
    gl.getUniformLocation(shader, 'uMVPMatrix');
  shader.nMatrixUniform =
    gl.getUniformLocation(shader, 'uNMatrix');

  shader.lightColorUniform =
    gl.getUniformLocation(shader, 'uLightColor');
  shader.lightDirectionUniform =
    gl.getUniformLocation(shader, 'uLightDirection');
  shader.diffuseColorUniform =
    gl.getUniformLocation(shader, 'uDiffuseColor');
  shader.ambientColorUniform =
    gl.getUniformLocation(shader, 'uAmbientColor');
  shader.specularColorUniform =
    gl.getUniformLocation(shader, 'uSpecularColor');
  shader.shininessUniform =
    gl.getUniformLocation(shader, 'uShininess');

  shader.uSamplerUniform =
    gl.getUniformLocation(shader, 'uSampler');

  shader.uSkinningTypeUniform =
    gl.getUniformLocation(shader, 'uSkinningType');
  shader.uLightingTypeUniform =
    gl.getUniformLocation(shader, 'uLightingType');

  shader.uVTFUniform =
    gl.getUniformLocation(shader, 'uVTF');
  shader.uVTFWidthUniform =
    gl.getUniformLocation(shader, 'uVTFWidth');

  shader.useToonUniform =
    gl.getUniformLocation(shader, 'uUseToon');
  shader.toonTextureUniform =
    gl.getUniformLocation(shader, 'uToonTexture');

  shader.edgeUniform =
    gl.getUniformLocation(shader, 'uEdge');
  shader.shadowUniform =
    gl.getUniformLocation(shader, 'uShadow');

  shader.sphereTextureUniform =
    gl.getUniformLocation(shader, 'uSphereTexture');
  shader.useSphereMapUniform =
    gl.getUniformLocation(shader, 'uUseSphereMap');
  shader.useSphereMapAdditionUniform =
    gl.getUniformLocation(shader, 'uUseSphereMapAddition');

  shader.shadowGenerationUniform =
    gl.getUniformLocation(shader, 'uShadowGeneration');
  shader.shadowMappingUniform =
    gl.getUniformLocation(shader, 'uShadowMapping');
  shader.shadowTextureUniform =
    gl.getUniformLocation(shader, 'uShadowTexture');
  shader.lightMatrixUniform =
    gl.getUniformLocation(shader, 'uLightMatrix');

  return shader;
}


/**
 * TODO: temporal
 */
Layer.prototype._initPostEffects = function() {
  this.postEffects['blur']        = new BlurEffect(this);
  this.postEffects['gaussian']    = new GaussianBlurEffect(this);
  this.postEffects['diffusion']   = new DiffusionBlurEffect(this);
  this.postEffects['division']    = new DivisionEffect(this);
  this.postEffects['low_reso']    = new LowResolutionEffect(this);
  this.postEffects['face_mosaic'] = new FaceMosaicEffect(this);
};


Layer.prototype._initStageShaders = function() {
  this.stageShaders[0] = new SimpleStage(this);
  this.stageShaders[1] = new MeshedStage(this);
  this.stageShaders[2] = new TrialStage(this);
};


Layer.prototype._initShadowFrameBuffer = function() {
  var width = this.shadowFrameBufferSize;
  var height = this.shadowFrameBufferSize;
  this.shadowFrameBuffer =
    this._createFrameBuffer(this.shader, this.gl, width, height);
};


Layer.prototype.setMatrixUniforms = function(gl) {
  gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, this.pMatrix);
  gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, this.mvMatrix);
  this.mat4.multiply(this.pMatrix, this.mvMatrix, this.mvpMatrix);
  gl.uniformMatrix4fv(this.shader.mvpMatrixUniform, false, this.mvpMatrix);

  var nMat = mat3.create();
  mat4.toInverseMat3(this.mvMatrix, nMat);
  mat3.transpose(nMat);
  gl.uniformMatrix3fv(this.shader.nMatrixUniform, false, nMat);

  //  TODO: temporal
  var lightDirection = vec3.normalize(vec3.create(this.lightPosition));
  var nMat4 = mat4.create();
  mat3.toMat4(nMat, nMat4);
  mat4.multiplyVec3(nMat4, lightDirection, lightDirection);
  gl.uniform3fv(this.shader.lightDirectionUniform, lightDirection);
}


Layer.prototype.registerLightMatrix = function() {
  this.mat4.multiply(this.pMatrix, this.mvMatrix, this.lightMatrix);
};


Layer.prototype.viewport = function() {
  this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
};


Layer.prototype.clear = function() {
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};


Layer.prototype.perspective = function(angle) {
  this.mat4.perspective(angle, this.gl.viewportWidth / this.gl.viewportHeight,
                        this.viewNear, this.viewFar, this.pMatrix);
  this.pMatrix[0] *= -1; // TODO: temporal workaround
};


Layer.prototype.ortho = function(near, far) {
  this.mat4.ortho(0, this.gl.viewportWidth, -this.gl.viewportHeight, 0,
                  near, far, this.pMatrix);
};


Layer.prototype.lookAt = function(eye, center, up) {
  this.mat4.lookAt(eye, center, up, this.mvMatrix);
};


Layer.prototype.identity = function() {
  this.mat4.identity(this.mvMatrix);
};


/**
 * pre_multiplied argument is a last resort.
 */
Layer.prototype.generateTexture = function(image) {
  var gl = this.gl;
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
//  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
//  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
};


Layer.prototype.pourVTF = function(texture, array, width) {
  var gl = this.gl;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, width, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, array);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.uniform1i(this.shader.uVTFWidthUniform, width);
};

// オフスクリーンレンダリング用の FrameBuffer
Layer.prototype._createFrameBuffer = function(shader, gl, width, height) {
  var frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  var depthRenderBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                             gl.RENDERBUFFER, depthRenderBuffer);

  var fTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height,
                0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                          gl.TEXTURE_2D, fTexture, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {f: frameBuffer, d: depthRenderBuffer, t: fTexture};
};


Layer.prototype.draw = function(texture, blend, num, offset) {
  if(! offset)
    offset = 0;

  var gl = this.gl;
  var shader = this.shader;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(shader.uSamplerUniform, 0);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  this.setMatrixUniforms(gl);
  gl.drawElements(gl.TRIANGLES, num, gl.UNSIGNED_SHORT, offset*2);
};


/**
 * TODO: gl.bufferSubData and pratial update could improve
 *       CPU-GPU transfer performance.
 */
Layer.prototype.pourArrayBuffer = function(buffer, array, itemSize, numItems) {
  var gl = this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
  buffer.itemSize = itemSize;
  buffer.numItems = numItems;
};


Layer.prototype.pourElementArrayBuffer = function(buffer, array, itemSize,
                                                  numItems) {
  var gl = this.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
  buffer.itemSize = itemSize;
  buffer.numItems = numItems;
};


Layer.prototype.createFloatArray = function(num) {
  return new Float32Array(num);
};


Layer.prototype.createUintArray = function(num) {
  return new Uint16Array(num);
};


Layer.prototype.createUint8Array = function(num) {
  return new Uint8Array(num);
};


Layer.prototype.createBuffer = function() {
  return this.gl.createBuffer();
};


Layer.prototype.calculateSquareValue = function(num) {
  var val = 1;
  while(num > val) {
    val = val << 1;
  }
  return val;
};


Layer.prototype.calculateVTFWidth = function(num) {
  var val = 1;
  while(num > val * val) {
    val = val * 2;
  }
  return val;
};

module.exports = Layer;

},{"./BlurEffect":38,"./DiffusionBlurEffect":39,"./DivisionEffect":40,"./FaceMosaicEffect":41,"./GaussianBlurEffect":42,"./LowResolutionEffect":44,"./MeshedStage":45,"./SimpleStage":47,"./TrialStage":49}],44:[function(require,module,exports){

/* jshint multistr: true */
'use strict';
var PostEffect = require('./PostEffect');
var __inherit = require('../Inherit').__inherit;

function LowResolutionEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
}
__inherit(LowResolutionEffect, PostEffect);


/* from http://clemz.io/article-retro-shaders-rayman-legends */
LowResolutionEffect.prototype._FSHADER = {};
LowResolutionEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
LowResolutionEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    const float n = 50.0;\
    vec2 st = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec2 pos = gl_FragCoord.st * st;\
    pos = floor(pos * n) / n;\
    gl_FragColor = texture2D(uSampler, pos);\
  }\
';
module.exports = LowResolutionEffect;

},{"../Inherit":2,"./PostEffect":46}],45:[function(require,module,exports){

/* jshint multistr: true */

'use strict';

var StageShader = require('./StageShader');
var __inherit = require('../Inherit').__inherit;
function MeshedStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
}
__inherit(MeshedStage, StageShader);


MeshedStage.prototype._FSHADER = {};
MeshedStage.prototype._FSHADER.type = 'x-shader/x-fragment';
MeshedStage.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying float vAlpha;\
  varying vec4  vShadowDepth;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  const float tileSize = 5.0;\
  const float pi = 3.1415926535;\
  const float circleRatio = 0.01;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  vec2 getTile(vec2 pos) {\
    return floor((pos + uWidth + (tileSize * 0.5)) / tileSize);\
  }\
\
  void main() {\
    vec3 pos = vPosition / uWidth;\
    float s = cos(uFrame/(pi*2.0));\
    float b = 0.0;\
    float alpha = vAlpha;\
    vec2 tile = getTile(vPosition.xz);\
    float visibility = 1.0;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth != 0.0) {\
        visibility = 0.5;\
      }\
    }\
\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
\
      vec2 ctile = getTile(uModelCenterPosition[i].xz);\
      vec2 ltile = getTile(uModelLeftFootPosition[i].xz);\
      vec2 rtile = getTile(uModelRightFootPosition[i].xz);\
\
      if(tile == ltile || tile == rtile) {\
        gl_FragColor = vec4(vec3(1.0, 0.5, 0.5)*s*visibility, alpha);\
        return;\
      }\
    }\
\
    tile = vec2(mod(tile.x, 2.0), mod(tile.y, 2.0));\
\
    if(pos.x * pos.x+ pos.z * pos.z > circleRatio) {\
      b = 0.8;\
    }\
\
    if(tile == vec2(0.0) || tile == vec2(1.0)) {\
      gl_FragColor = vec4((vec3(1.0)+b)*visibility, alpha);\
    } else {\
      gl_FragColor = vec4((vec3(0.0)+b)*visibility, alpha);\
    }\
  }\
';

module.exports = MeshedStage;

},{"../Inherit":2,"./StageShader":48}],46:[function(require,module,exports){

/* global mat4,mat3,alert,vec3,quat4 */
/* jshint multistr: true */
'use strict';

function PostEffect(layer, pathNum) {
  this.layer = layer;
  this.shader = null;
  this.pathNum = pathNum;
  this._init();
};

// for reference
PostEffect.prototype.Math = Math;
PostEffect.prototype.mat4 = mat4;
PostEffect.prototype.vec3 = vec3;
PostEffect.prototype.quat4 = quat4;


PostEffect.prototype._VSHADER = {};
PostEffect.prototype._VSHADER.type = 'x-shader/x-vertex';
PostEffect.prototype._VSHADER.src = '\
  attribute vec3 aPosition;\
  uniform   mat4 uMvpMatrix;\
\
  void main() {\
    gl_Position = uMvpMatrix * vec4(aPosition, 1.0);\
  }\
';

PostEffect.prototype._FSHADER = {};
PostEffect.prototype._FSHADER.type = 'x-shader/x-fragment';
PostEffect.prototype._FSHADER.src = '\
  precision mediump float;\
  uniform float uWidth;\
  uniform float uHeight;\
  uniform float uFrame;\
  uniform sampler2D uSampler;\
  uniform sampler2D uSampler2;\
\
  void main() {\
    vec2 ts = vec2(1.0 / uWidth, 1.0 / uHeight);\
    vec4 color = texture2D(uSampler, gl_FragCoord.st * ts);\
    gl_FragColor = color;\
  }\
';


PostEffect.prototype._init = function() {
  var gl = this.layer.gl;
  this.shader = this._initShader(gl);
  this._initAttributes(this.shader, gl);
  this._initUniforms(this.shader, gl);
  this._initBuffers(this.shader, gl);
  this._initMatrices(this.shader, gl);
  this._initParams(this.shader, gl);
  this._initFrameBuffers(this.shader, gl);
};


PostEffect.prototype._initShader = function(gl) {
  var vertexShader = this._compileShader(this._VSHADER);
  var fragmentShader = this._compileShader(this._FSHADER);

  var shader = gl.createProgram();
  gl.attachShader(shader, vertexShader);
  gl.attachShader(shader, fragmentShader);
  gl.linkProgram(shader);

  if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  return shader;
};


PostEffect.prototype._initAttributes = function(shader, gl) {
  shader.positionAttribute =
    gl.getAttribLocation(shader, 'aPosition');
};


PostEffect.prototype._initUniforms = function(shader, gl) {
  shader.mvpMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uMvpMatrix');
  shader.widthUniformLocation =
    gl.getUniformLocation(shader, 'uWidth');
  shader.heightUniformLocation =
    gl.getUniformLocation(shader, 'uHeight');
  shader.frameUniformLocation =
    gl.getUniformLocation(shader, 'uFrame');
  shader.samplerUniformLocation =
    gl.getUniformLocation(shader, 'uSampler');
  shader.sampler2UniformLocation =
    gl.getUniformLocation(shader, 'uSampler2');

  shader.width = this.layer.canvas.width;
  shader.height = this.layer.canvas.height;
  shader.frame = 0;
};


PostEffect.prototype._initBuffers = function(shader, gl) {
  var positions = [
    -1.0,  1.0,  0.0,
     1.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
     1.0, -1.0,  0.0
  ];

  var indices = [
    0, 1, 2,
    3, 2, 1
  ];

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                gl.STATIC_DRAW);

  shader.pBuffer = pBuffer;
  shader.iBuffer = iBuffer;
};


PostEffect.prototype._initMatrices = function(shader, gl) {
  var mMatrix = this.mat4.create();
  var vMatrix = this.mat4.create();
  var pMatrix = this.mat4.create();
  var vpMatrix = this.mat4.create();
  var mvpMatrix = this.mat4.create();

  this.mat4.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0, 1, 0], vMatrix);
  this.mat4.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);
  this.mat4.multiply(pMatrix, vMatrix, vpMatrix);
  this.mat4.identity(mMatrix);
  this.mat4.multiply(vpMatrix, mMatrix, mvpMatrix);

  shader.mvpMatrix = mvpMatrix;
};


PostEffect.prototype._initFrameBuffers = function(shader, gl) {
  shader.pathNum = this.pathNum;
  shader.frameBuffers = [];
  for(var i = 0; i < shader.pathNum; i++) {
    shader.frameBuffers.push(
      this.layer._createFrameBuffer(shader, gl, shader.width, shader.height));
  }
};


/**
 * override in child class
 */
PostEffect.prototype._initParams = function(shader, gl) {
};


PostEffect.prototype._compileShader = function(params) {
  return this.layer.compileShader(this.layer.gl, params.src, params.type);
};


/**
 * from: http://wgld.org/d/webgl/w057.html
 */
PostEffect.prototype._getGaussianWeight = function(array, length, strength) {
  var t = 0.0;
  var d = strength * strength / 100;
  for(var i = 0; i < length; i++){
    var r = 1.0 + 2.0 * i;
    var w = this.Math.exp(-0.5 * (r * r) / d);
    array[i] = w;
    if(i > 0)
      w *= 2.0;
    t += w;
  }
  for(i = 0; i < length; i++){
    array[i] /= t;
  }
};


PostEffect.prototype._bindAttributes = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, shader.pBuffer);
  gl.enableVertexAttribArray(shader.positionAttribute);
  gl.vertexAttribPointer(shader.positionAttribute,
                         3, gl.FLOAT, false, 0, 0);
};


PostEffect.prototype._bindIndices = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.iBuffer);
};


PostEffect.prototype._setUniforms = function(n, params) {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.uniformMatrix4fv(shader.mvpMatrixUniformLocation, false, shader.mvpMatrix);
  gl.uniform1f(shader.widthUniformLocation, shader.width);
  gl.uniform1f(shader.heightUniformLocation, shader.height);
  gl.uniform1f(shader.frameUniformLocation, shader.frame);
};


PostEffect.prototype.bindFrameBufferForScene = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, shader.frameBuffers[0].f);
};


PostEffect.prototype._bindFrameBuffer = function(n) {
  var shader = this.shader;
  var gl = this.layer.gl;
  var f = (shader.pathNum-1 == n) ? null : shader.frameBuffers[n+1].f;

  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};


PostEffect.prototype._bindFrameTextures = function(n) {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shader.frameBuffers[n].t);
  gl.uniform1i(shader.samplerUniformLocation, 0);

  if(shader.sampler2UniformLocation === null)
    return;

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, shader.frameBuffers[0].t);
  gl.uniform1i(shader.sampler2UniformLocation, 1);
};


PostEffect.prototype._enableConditions = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.enable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
};


/**
 * override in child class.
 */
PostEffect.prototype._setParams = function(n, params) {
};


PostEffect.prototype._draw = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.flush();
};


PostEffect.prototype.draw = function(params) {
  for(var i = 0; i < this.shader.pathNum; i++) {
    this._bindFrameBuffer(i);
    this._bindAttributes();
    this._setUniforms(i, params);
    this._bindIndices();
    this._bindFrameTextures(i);
    this._enableConditions();
    this._draw();
  }
};

module.exports = PostEffect;

},{}],47:[function(require,module,exports){
/* jshint multistr: true */
'use strict';

var __inherit = require('../Inherit').__inherit;

var StageShader = require('./StageShader');
function SimpleStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
}
__inherit(SimpleStage, StageShader);

SimpleStage.prototype._FSHADER = {};
SimpleStage.prototype._FSHADER.type = 'x-shader/x-fragment';
SimpleStage.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying vec4  vShadowDepth;\
  varying float vAlpha;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  void main() {\
    float r = cos(vPosition.x);\
    float g = cos(vPosition.z);\
    vec4 color = vec4(vec3(r*g), vAlpha);\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth != 0.0) {\
        color.rgb *= 0.5;\
      }\
    }\
    gl_FragColor = color;\
  }\
';

module.exports = SimpleStage;

},{"../Inherit":2,"./StageShader":48}],48:[function(require,module,exports){
/* jshint multistr: true */
'use strict';

function StageShader(layer) {
  this.layer = layer;
  this.shader = null;
  this._init();
};

StageShader.prototype._VSHADER = {};
StageShader.prototype._VSHADER.type = 'x-shader/x-vertex';
StageShader.prototype._VSHADER.src = '\
  attribute vec3 aPosition;\
  attribute float aAlpha;\
  uniform mat4 uMVMatrix;\
  uniform mat4 uPMatrix;\
  uniform mat4 uLightMatrix;\
  varying vec3 vPosition;\
  varying vec4 vShadowDepth;\
  varying float vAlpha;\
\
  void main() {\
    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);\
    vPosition = aPosition;\
    vAlpha = aAlpha;\
    vShadowDepth = uLightMatrix * vec4(aPosition, 1.0);\
  }\
';

StageShader.prototype._FSHADER = {};
StageShader.prototype._FSHADER.type = 'x-shader/x-fragment';
StageShader.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying vec4  vShadowDepth;\
  varying float vAlpha;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  void main() {\
    vec4 color = vec4(vec3(0.0), vAlpha);\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
/*      float depth2 = unpackDepth(packDepth(lightCoord.z));*/\
      float depth2 = lightCoord.z;\
      if(depth2 - 0.00008 > depth) {\
        color.rgb *= 0.7;\
      }\
    }\
\
    gl_FragColor = color;\
  }\
';


StageShader.prototype._init = function() {
  var gl = this.layer.gl;
  this.shader = this._initShader(gl);
  this._initAttributes(this.shader, gl);
  this._initUniforms(this.shader, gl);
  this._initBuffers(this.shader, gl);
  this._initParams(this.shader, gl);
};


StageShader.prototype._initShader = function(gl) {
  var vertexShader = this._compileShader(this._VSHADER);
  var fragmentShader = this._compileShader(this._FSHADER);

  var shader = gl.createProgram();
  gl.attachShader(shader, vertexShader);
  gl.attachShader(shader, fragmentShader);
  gl.linkProgram(shader);

  if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  return shader;
};


StageShader.prototype._initAttributes = function(shader, gl) {
  shader.positionAttribute =
    gl.getAttribLocation(shader, 'aPosition');
  shader.alphaAttribute =
    gl.getAttribLocation(shader, 'aAlpha');
};


StageShader.prototype._initUniforms = function(shader, gl) {
  shader.mvMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uMVMatrix');
  shader.pMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uPMatrix');
  shader.widthUniformLocation =
    gl.getUniformLocation(shader, 'uWidth');
  shader.frameUniformLocation =
    gl.getUniformLocation(shader, 'uFrame');
  shader.modelNumUniformLocation =
    gl.getUniformLocation(shader, 'uModelNum');
  shader.modelCenterPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelCenterPosition');
  shader.modelLeftFootPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelLeftFootPosition');
  shader.modelRightFootPositionUniformLocation =
    gl.getUniformLocation(shader, 'uModelRightFootPosition');
  shader.lightMatrixUniformLocation =
    gl.getUniformLocation(shader, 'uLightMatrix');
  shader.shadowMappingUniformLocation =
    gl.getUniformLocation(shader, 'uShadowMapping');
  shader.shadowTextureUniformLocation =
    gl.getUniformLocation(shader, 'uShadowTexture');
};


StageShader.prototype._initBuffers = function(shader, gl) {
  var w = 1000.0;
  var positions = [
    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,
  ];

  var indices = [
     0,  1,  2,
     3,  2,  1,

     6,  5,  4,
     5,  6,  7,
  ];

  var alphas = [
    1.0, 1.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.5
  ];

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  pBuffer.itemSize = 3;

  var aBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);
  aBuffer.itemSize = 1;

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                gl.STATIC_DRAW);
  iBuffer.itemNum = indices.length;

  shader.width = w;
  shader.pBuffer = pBuffer;
  shader.aBuffer = aBuffer;
  shader.iBuffer = iBuffer;
};


/**
 * override in child class
 */
StageShader.prototype._initParams = function(shader, gl) {
};


StageShader.prototype._compileShader = function(params) {
  return this.layer.compileShader(this.layer.gl, params.src, params.type);
};


StageShader.prototype._bindAttributes = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.pBuffer);
  gl.enableVertexAttribArray(shader.positionAttribute);
  gl.vertexAttribPointer(shader.positionAttribute,
                         shader.pBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, shader.aBuffer);
  gl.enableVertexAttribArray(shader.alphaAttribute);
  gl.vertexAttribPointer(shader.alphaAttribute,
                         shader.aBuffer.itemSize, gl.FLOAT, false, 0, 0);
};


StageShader.prototype._bindIndices = function() {
  var shader = this.shader;
  var gl = this.layer.gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shader.iBuffer);
};


/**
 * TODO: be param flexible
 */
StageShader.prototype._setUniforms = function(frame, num, cPos, lfPos, rfPos,
                                              sFlag, lMatrix) {
  var shader = this.shader;
  var gl = this.layer.gl;

  // TODO: temporal
  gl.uniformMatrix4fv(shader.mvMatrixUniformLocation, false,
                      this.layer.mvMatrix);
  gl.uniformMatrix4fv(shader.pMatrixUniformLocation, false,
                      this.layer.pMatrix);

  gl.uniform1f(shader.frameUniformLocation, frame);
  gl.uniform1f(shader.widthUniformLocation, shader.width);
  gl.uniform1i(shader.modelNumUniformLocation, num);

  if(cPos !== null)
    gl.uniform3fv(shader.modelCenterPositionUniformLocation, cPos);

  if(lfPos !== null)
    gl.uniform3fv(shader.modelLeftFootPositionUniformLocation, lfPos);

  if(rfPos !== null)
    gl.uniform3fv(shader.modelRightFootPositionUniformLocation, rfPos);

  if(sFlag) {
    gl.uniform1i(shader.shadowMappingUniformLocation, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.layer.shadowFrameBuffer.t);
    gl.uniform1i(shader.shadowTextureUniformLocation, 1);
    gl.uniformMatrix4fv(shader.lightMatrixUniformLocation, false, lMatrix);
  } else {
    gl.uniform1i(shader.shadowMappingUniformLocation, 0);
    gl.uniform1i(shader.shadowTextureUniformLocation, 0);
  }

};


StageShader.prototype._enableConditions = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA,
                       gl.ONE_MINUS_SRC_ALPHA,
                       gl.SRC_ALPHA,
                       gl.DST_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
};


StageShader.prototype._draw = function() {
  var shader = this.shader;
  var gl = this.layer.gl;

  gl.drawElements(gl.TRIANGLES, shader.iBuffer.itemNum, gl.UNSIGNED_SHORT, 0);
};


/**
 * TODO: be param flexible
 */
StageShader.prototype.draw = function(frame, num, cPos, lfPos, rfPos,
                                      sFlag, lMatrix) {
  this.layer.gl.useProgram(this.shader);
  this._bindAttributes();
  this._setUniforms(frame, num, cPos, lfPos, rfPos, sFlag, lMatrix);
  this._bindIndices();
  this._enableConditions();
  this._draw();
};

module.exports = StageShader;

},{}],49:[function(require,module,exports){

/* jshint multistr: true */
'use strict';

var StageShader = require('./StageShader');
var __inherit = require('../Inherit').__inherit;
function TrialStage(layer) {
  this.parent = StageShader;
  this.parent.call(this, layer);
};
__inherit(TrialStage, StageShader);

TrialStage.prototype._FSHADER = {};
TrialStage.prototype._FSHADER.type = 'x-shader/x-fragment';
TrialStage.prototype._FSHADER.src = '\
  precision mediump float;\
  varying vec3  vPosition;\
  varying vec4  vShadowDepth;\
  varying float vAlpha;\
  uniform float uFrame;\
  uniform float uWidth;\
  uniform int   uModelNum;\
  uniform vec3  uModelCenterPosition[5];\
  uniform vec3  uModelRightFootPosition[5];\
  uniform vec3  uModelLeftFootPosition[5];\
  uniform bool  uShadowMapping;\
  uniform sampler2D uShadowTexture;\
\
  vec4 packDepth(const in float depth) {\
    const vec4 bitShift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\
    const vec4 bitMask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\
    vec4 res = fract(depth * bitShift);\
    res -= res.xxyz * bitMask;\
    return res;\
  }\
\
  float unpackDepth(const in vec4 rgba) {\
    const vec4 bitShift = vec4(1.0/(256.0*256.0*256.0),\
                               1.0/(256.0*256.0), 1.0/256.0, 1.0);\
    float depth = dot(rgba, bitShift);\
    return depth;\
  }\
\
  const int num = 8;\
  const int unitAngle = 360 / num;\
\
  vec2 getVec2(vec3 v) {\
    if(vPosition.y == 0.0 || vPosition.y >= 2.0 * uWidth - 0.1)\
      return v.xz;\
    if(vPosition.x <= -uWidth + 0.1 || vPosition.x >= uWidth - 0.1)\
      return v.yz;\
    return v.xy;\
  }\
\
  vec2 getPosition(int unitAngle, float uTime, int i) {\
    float ax = abs(mod(uTime*0.4, 100.0) - 50.0);\
    float ay = abs(mod(uTime*0.6, 100.0) - 50.0);\
    float rad = radians(float(unitAngle * i) + uTime*1.0);\
    vec2 val = vec2(0, 0);\
    for(int i = 0; i < 5; i++) {\
      if(i >= uModelNum)\
        break;\
      val += getVec2(uModelCenterPosition[i]);\
    }\
    val = val / float(uModelNum);\
    float x = val.x + ax * cos(rad);\
    float y = val.y + ay * sin(rad);\
    return vec2(x, y);\
  }\
\
  void main() {\
    float color = 0.0;\
    vec2 val = getVec2(vPosition);\
    for(int i = 0; i < num; i++) {\
      vec2 pos = getPosition(unitAngle, uFrame, i);\
      float dist = length(val - pos) * 6.0;\
      color += 5.0 / dist;\
    }\
\
    float visibility = 1.0;\
\
    if(uShadowMapping) {\
      vec3 lightCoord = vShadowDepth.xyz / vShadowDepth.w;\
      vec4 rgbaDepth = texture2D(uShadowTexture, \
                                 lightCoord.xy*0.5+0.5);\
      float depth = unpackDepth(rgbaDepth);\
      if(depth != 0.0) {\
        visibility = 0.5;\
      }\
    }\
\
    gl_FragColor = vec4(vec3(color)*visibility, vAlpha);\
  }\
';



TrialStage.prototype._initBuffers = function(shader, gl) {
  var w = 100.0;
  var positions = [
    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  0.0,  w,
     w,  0.0,  w,
    -w,  0.0, -w,
     w,  0.0, -w,

    -w,  w*2,  w,
     w,  w*2,  w,
    -w,  0.0,  w,
     w,  0.0,  w,

    -w,  0.0, -w,
     w,  0.0, -w,
    -w,  w*2, -w,
     w,  w*2, -w,

     w,  0.0, -w,
     w,  0.0,  w,
     w,  w*2, -w,
     w,  w*w,  w,

    -w,  w*2, -w,
    -w,  w*2,  w,
    -w,  0.0, -w,
    -w,  0.0,  w,

    -w,  w*2, -w,
     w,  w*2, -w,
    -w,  w*2,  w,
     w,  w*2,  w,
  ];

  var indices = [
     0,  1,  2,
     3,  2,  1,

     6,  5,  4,
     5,  6,  7,

     8,  9, 10,
    11, 10,  9,

    12, 13, 14,
    15, 14, 13,

    16, 17, 18,
    19, 18, 17,

    20, 21, 22,
    23, 22, 21,

    24, 25, 26,
    27, 26, 25,
  ];

  var alphas = [
    1.0, 1.0, 1.0, 1.0,
    0.5, 0.5, 0.5, 0.5,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
  ];

  var pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  pBuffer.itemSize = 3;

  var aBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STATIC_DRAW);
  aBuffer.itemSize = 1;

  var iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices),
                gl.STATIC_DRAW);
  iBuffer.itemNum = indices.length;

  shader.width = w;
  shader.pBuffer = pBuffer;
  shader.aBuffer = aBuffer;
  shader.iBuffer = iBuffer;
};

module.exports = TrialStage;

},{"../Inherit":2,"./StageShader":48}],50:[function(require,module,exports){
/* global Whammy */
'use strict';

// require
var PMDView = require('./Pmd/PMDView');
var Layer = require('./WebGL/Layer');
var PMDFileParser = require('./Pmd/PMDFileParser');
var PMDModelView = require('./Pmd/PMDModelView');
var VMDFileParser = require('./Vmd/VMDFileParser');


// configurations
var __modelBaseURL = './model';
var __motionBaseURL = './vmd';
var __musicBaseURL = './music';

var __models = [
  {name: 'Kaito',
   url:  __modelBaseURL + '/default/kaito.pmd',
   eye:  [0, 10, -22]},
  {name: 'Haku',
   url:  __modelBaseURL + '/default/haku.pmd',
   eye:  [0, 10, -22]},
  {name: 'MEIKO',
   url:  __modelBaseURL + '/default/MEIKO.pmd',
   eye:  [0, 10, -22]},
  {name: 'Meiko (Sakine)',
   url:  __modelBaseURL + '/default/meiko_sakine.pmd',
   eye:  [0, 10, -22]},
  {name: 'Miku',
   url:  __modelBaseURL + '/default/miku.pmd',
   eye:  [0, 10, -22]},
  {name: 'Miku (Metal)',
   url:  __modelBaseURL + '/default/miku_m.pmd',
   eye:  [0, 10, -22]},
  {name: 'Miku (v2)',
   url:  __modelBaseURL + '/default/miku_v2.pmd',
   eye:  [0, 10, -22]},
  {name: 'Neru',
   url:  __modelBaseURL + '/default/neru.pmd',
   eye:  [0, 10, -22]},
  {name: 'Ren',
   url:  __modelBaseURL + '/default/ren.pmd',
   eye:  [0, 10, -22]},
  {name: 'Rin',
   url:  __modelBaseURL + '/default/rin.pmd',
   eye:  [0, 10, -22]},
  {name: 'Rin (act2)',
   url:  __modelBaseURL + '/default/rin_act2.pmd',
   eye:  [0, 10, -22]},
  {name: 'Miku (low poly)',
   url:  __modelBaseURL + '/low_miku/miku.pmd',
   eye:  [0, 10, -22]},
  {name: 'Gumi (low poly)',
   url:  __modelBaseURL + '/low_miku/gumi.pmd',
   eye:  [0, 10, -22]},
  {name: 'Mokou',
   url:  __modelBaseURL + '/mokou/mokou_A.pmd',
   eye:  [0, 10, -22]},
  {name: 'Alice',
   url:  __modelBaseURL + '/alice/alice.pmd',
   eye:  [0, 10, -22],
   selected: true},

/*
  {name: 'Marisa (Freckled)',
   url:  __modelBaseURL + '/low_marisa/marisa.pmd',
   eye:  [0, 10, -22]},
  {name: 'Reimu (Freckled)',
   url:  __modelBaseURL + '/low_reimu/reimu.pmd',
   eye:  [0, 10, -22]},
  {name: 'Marisa (Freckled ver2)',
   url:  __modelBaseURL + '/low_marisa2/marisa.pmd',
   eye:  [0, 10, -22]},
  {name: 'Marisa (Freckled ver2 T-shirt)',
   url:  __modelBaseURL + '/low_marisa2/marisa_t.pmd',
   eye:  [0, 10, -22]},
  {name: 'Alice',
   url:  __modelBaseURL + '/alice/alice.pmd',
   eye:  [0, 10, -22]},
  {name: 'Marisa (Lucille)',
   url:  __modelBaseURL + '/marisa/marisa.pmd',
   eye:  [0, 10, -22]},
  {name: 'Miku (lat)',
   url:  __modelBaseURL + '/miku/miku.pmd',
   eye:  [0, 10, -22]},
*/
];

var __motions = [
  {name: 'Toki No Kakera',
   url:  [__motionBaseURL + '/tokino_kakera.vmd',
          __motionBaseURL + '/tokino_kakera_cam.vmd'],
   eye:  [0, 10, -22]},
  {name: 'Sweet Magic',
   url:  [
	   __motionBaseURL + '/sweetmagic-lip.vmd',
	   __motionBaseURL + '/sweetmagic-left.vmd',
   ],
   eye:  [0, 10, -22],
   selected: true},

  {name: 'Wavefile (Short ver.)',
   url:  [__motionBaseURL + '/wavefile_v2.vmd'],
   eye:  [0, 10, -22],
   music: {url: __musicBaseURL + '/wavefile_short.mp3',
           offset: 320},
  },
/*
  {name: 'Koi Wa Kitto Kyujoushou',
   url:  [__motionBaseURL + '/koiwakitto.vmd',
          __motionBaseURL + '/koiwakitto_camera.vmd'],
   eye:  [0, 10, -22],
   music: {url : __musicBaseURL + '/koiwakitto.mp3',
           offset: 0}},
  {name: 'Luka Luka Night fever',
   url:  [__motionBaseURL + '/nightfever.vmd'],
   eye:  [0, 10, -22]},
  {name: 'Melt',
   url:  [__motionBaseURL + '/melt.vmd',
          __motionBaseURL + '/melt_camera.vmd'],
   eye:  [0, 10, -22],
   music: {url : __musicBaseURL + '/melt.mp3',
           offset: 0}},
  {name: 'Nekomimi Switch',
   url:  [__motionBaseURL + '/nekomimi_switch_mikuv2.vmd',
          __motionBaseURL + '/nekomimi_switch_camera.vmd'],
   eye:  [0, 10, -22],
   music: {url : __musicBaseURL + '/nekomimi_switch.mp3',
           offset: 0}},
  {name: 'Nyanyanya',
   url:  [__motionBaseURL + '/nya.vmd'],
   eye:  [0, 10, -22],
   music: {url : __musicBaseURL + '/nya.mp3',
           offset: 0}},
  {name: 'Senbon Zakura',
   url:  [__motionBaseURL + '/senbonzakura.vmd',
          __motionBaseURL + '/senbonzakura_camera.vmd'],
   eye:  [0, 10, -22],
   music: {url: __musicBaseURL + '/senbonzakura.mp3',
           offset: -50}},
  {name: 'Senbon Zakura(2)',
   url:  [__motionBaseURL + '/senbonzakura2.vmd',
          __motionBaseURL + '/senbonzakura_camera2.vmd'],
   eye:  [0, 10, -22],
   music: {url: __musicBaseURL + '/senbonzakura.mp3',
           offset: 0}},
  {name: 'Sweet Magic',
   url:  [__motionBaseURL + '/sweetmagic-left.vmd',
          __motionBaseURL + '/sweetmagic-lip.vmd'],
   eye:  [-10, 10, -22],
   music: {url: __musicBaseURL + '/sweetmagic.mp3',
           offset: 0}},
  {name: 'World is mine',
   url:  [__motionBaseURL + '/world_is_mine.vmd',
          __motionBaseURL + '/world_is_mine_camera.vmd'],
   eye:  [0, 10, -22],
   music: {url : __musicBaseURL + '/world_is_mine.mp3',
           offset: 0}},
*/
];


var __audios = [
  {name: 'Audio OFF',
   value: PMDView._AUDIO_OFF},
  {name: 'Audio ON',
   value: PMDView._AUDIO_ON,
   selected: true},
];


var __physicses = [
  {name: 'Physics OFF',
   value: PMDView._PHYSICS_OFF},
  {name: 'Physics ON',
   value: PMDView._PHYSICS_ON,
   selected: true},
/*
  {name: 'Physics ON (workers)',
   value: PMDView._PHYSICS_WORKERS_ON},
*/
];


var __iks = [
  {name: 'IK OFF',
   value: PMDView._IK_OFF},
  {name: 'IK ON',
   value: PMDView._IK_ON,
   selected: true},
];


var __morphs = [
  {name: 'Morphing OFF',
   value: PMDView._MORPH_OFF},
  {name: 'Morphing ON',
   value: PMDView._MORPH_ON,
   selected: true},
];


var __stages = [
  {name: 'Stage OFF',
   value: PMDView._STAGE_OFF},
  {name: 'Stage 1',
   value: PMDView._STAGE_1},
  {name: 'Stage 2',
   value: PMDView._STAGE_2,
   selected: true},
  {name: 'Stage 3',
   value: PMDView._STAGE_3},
];


var __sphereMaps = [
  {name: 'Sphere mapping OFF',
   value: PMDView._SPHERE_MAP_OFF},
  {name: 'Sphere mapping ON',
   value: PMDView._SPHERE_MAP_ON,
   selected: true},
];


var __shadowMappings = [
  {name: 'Shadow mapping OFF',
   value: PMDView._SHADOW_MAPPING_OFF,
   selected: true},
  {name: 'Shadow mapping ON',
   value: PMDView._SHADOW_MAPPING_ON},
  {name: 'Shadow mapping ONLY',
   value: PMDView._SHADOW_MAPPING_ONLY},
];


var __edges = [
  {name: 'Edge OFF',
   value: PMDView._EDGE_OFF,
   selected: true},
  {name: 'Edge ON',
   value: PMDView._EDGE_ON},
];


var __skinnings = [
  {name: 'CPU Skinning',
   value: PMDView._SKINNING_CPU},
  {name: 'GPU Skinning',
   value: PMDView._SKINNING_GPU},
  {name: 'CPU+GPU Skinning',
   value: PMDView._SKINNING_CPU_AND_GPU,
   selected: true},
];


var __runTypes = [
  {name: 'Frame Oriented',
   value: PMDView._RUN_FRAME_ORIENTED},
  {name: 'Real Time Oriented',
   value: PMDView._RUN_REALTIME_ORIENTED,
   selected: true},
/*
  // disabled because of Audio.currentTime is second precision.
  {name: 'Audio Oriented',
   value: PMDView._RUN_AUDIO_ORIENTED},
*/
];


var __lightings = [
  {name: 'Light OFF',
   value: PMDView._LIGHTING_OFF},
  {name: 'Light ON',
   value: PMDView._LIGHTING_ON},
  {name: 'Light ON w/ toon',
   value: PMDView._LIGHTING_ON_WITH_TOON,
   selected: true},
];


var __effects = [
  {name: 'Post effect OFF',
   value: PMDView._EFFECT_OFF,
   selected: true},
  {name: 'Blur',
   value: PMDView._EFFECT_BLUR},
  {name: 'Gaussian Blur',
   value: PMDView._EFFECT_GAUSSIAN},
  {name: 'Diffusion Blur',
   value: PMDView._EFFECT_DIFFUSION},
  {name: 'Division',
   value: PMDView._EFFECT_DIVISION},
  {name: 'Low Resolution',
   value: PMDView._EFFECT_LOW_RESO},
  {name: 'Face Mosaic',
   value: PMDView._EFFECT_FACE_MOSAIC},
];


// for console debug
// TODO: but some of them are used for work
//       they should be used only for console debug
var __pfp;
var __pmd;
var __pmdView;
var __vfp;
var __vmd;


// for fps calculation
var __oldTime;
var __count = 0;
var __fps_span = 60;


// for dom operation
var __canvas;
var __loadModelButton;
var __loadMotionButton;
var __videoGenerationCheckbox;
var __physicsCheckbox;
var __modelSelect;
var __motionSelect;
var __audioSelect;
var __physicsSelect;
var __ikSelect;
var __morphSelect;
var __stageSelect;
var __sphereMapSelect;
var __shadowMappingSelect;
var __runTypeSelect;
var __effectSelect;
var __edgeSelect;
var __skinningSelect;
var __lightingSelect;
var __lightColorRange;
var __lightColorSpan;


// for work 
var __layer;
var __pmdFileLoaded = false;
var __vmdFileLoaded = false;
var __worker = null;
var __selectedModel;
var __selectedMotion;
var __selectedAudio;
var __selectedPhysics;
var __selectedSkinning;
var __selectedLighting;
var __useWorkers = false;
var __videoEncoder = null;
var __isDragging = false;
var __previousMousePosition = {x:0, y:0};


var __putStatus = function(str) {
  var area = document.getElementById('statusArea');
  area.appendChild(document.createTextNode(str + '\n'));
  area.scrollTop = area.scrollHeight ;
};


var __initState = function() {
  __loadModelButton.disabled         = false;
  __loadMotionButton.disabled        = true;
  __modelSelect.disabled             = false;
  __motionSelect.disabled            = false;
  __audioSelect.disabled             = false;
  __videoGenerationCheckbox.disabled = false;
  __physicsSelect.disabled           = false;
  __ikSelect.disabled                = false;
  __morphSelect.disabled             = false;
  __stageSelect.disabled             = false;
  __sphereMapSelect.disabled         = false;
  __shadowMappingSelect.disabled     = false;
  __runTypeSelect.disabled           = false;
  __effectSelect.disabled            = false;
  __edgeSelect.disabled              = false;
  __skinningSelect.disabled          = false;
  __lightingSelect.disabled          = false;
  __lightColorRange.disabled         = false;
  __motionSelectedState();
  __videoGenerationCheckboxState();
  __audioSelectedState();
};


var __loadingFileState = function() {
  __loadModelButton.disabled         = true;
  __loadMotionButton.disabled        = true;
  __modelSelect.disabled             = true;
  __motionSelect.disabled            = true;
  __audioSelect.disabled             = true;
  __videoGenerationCheckbox.disabled = true;
  __physicsSelect.disabled           = true;
  __edgeSelect.disabled              = true;
  __ikSelect.disabled                = true;
  __morphSelect.disabled             = true;
  __stageSelect.disabled             = true;
  __sphereMapSelect.disabled         = true;
  __shadowMappingSelect.disabled     = true;
  __runTypeSelect.disabled           = true;
  __effectSelect.disabled            = true;
  __skinningSelect.disabled          = true;
  __lightingSelect.disabled          = true;
  __lightColorRange.disabled         = true;
};


var __pmdFileLoadedState = function() {
  // TODO: temporal
  if(__pmdView && __pmdView.getModelNum() >= 5-1) {
    __loadModelButton.disabled         = true;
  } else {
    __loadModelButton.disabled         = false;
  }
  __loadMotionButton.disabled        = false;
  __modelSelect.disabled             = false;
  __motionSelect.disabled            = false;
  __audioSelect.disabled             = false;
  __videoGenerationCheckbox.disabled = false;
  __physicsSelect.disabled           = false;
  __ikSelect.disabled                = false;
  __edgeSelect.disabled              = false;
  __morphSelect.disabled             = false;
  __stageSelect.disabled             = false;
  __sphereMapSelect.disabled         = false;
  __shadowMappingSelect.disabled     = false;
  __runTypeSelect.disabled           = false;
  __effectSelect.disabled            = false;
  __skinningSelect.disabled          = true;
  __lightingSelect.disabled          = false;
  __lightColorRange.disabled         = false;
  __motionSelectedState();
  __videoGenerationCheckboxState();
  __audioSelectedState();
};


var __vmdFileLoadedState = function() {
  __loadModelButton.disabled         = true;
  __loadMotionButton.disabled        = true;
  __modelSelect.disabled             = false;
  __motionSelect.disabled            = false;
  __audioSelect.disabled             = false;
  __videoGenerationCheckbox.disabled = true;
  __physicsSelect.disabled           = false;
  __ikSelect.disabled                = false;
  __edgeSelect.disabled              = false;
  __morphSelect.disabled             = false;
  __stageSelect.disabled             = false;
  __sphereMapSelect.disabled         = false;
  __shadowMappingSelect.disabled     = false;
  __runTypeSelect.disabled           = false;
  __effectSelect.disabled            = false;
  __skinningSelect.disabled          = true;
  __lightingSelect.disabled          = false;
  __lightColorRange.disabled         = false;
  __motionSelectedState();
  __videoGenerationCheckboxState();
  __audioSelectedState();

  __audioSelect.disabled             = true;
};


var __danceReadyState = function() {
  __loadModelButton.disabled         = true;
  __loadMotionButton.disabled        = true;
  __modelSelect.disabled             = false;
  __motionSelect.disabled            = false;
  __videoGenerationCheckbox.disabled = true;
  __physicsSelect.disabled           = false;
  __ikSelect.disabled                = false;
  __edgeSelect.disabled              = false;
  __morphSelect.disabled             = false;
  __stageSelect.disabled             = false;
  __sphereMapSelect.disabled         = false;
  __shadowMappingSelect.disabled     = false;
  __runTypeSelect.disabled           = false;
  __effectSelect.disabled            = false;
  __skinningSelect.disabled          = true;
  __lightingSelect.disabled          = false;
  __lightColorRange.disabled         = false;
  __motionSelectedState();
  __videoGenerationCheckboxState();
  __audioSelectedState();

  __audioSelect.disabled             = true;
};


// TODO: remove magic numbers
// TODO: rename
var __videoGenerationCheckboxState = function() {
  if(__videoGenerationCheckbox.checked) {
    __runTypeSelect.options[0].selected = true;
    __runTypeSelect.options[1].selected = false;
    __runTypeSelect.options[2].selected = false;
    __runTypeSelect.disabled = true;
    __audioSelect.options[0].selected = true;
    __audioSelect.options[1].selected = false;
    __audioSelect.disabled = true;
  } else {
    __runTypeSelect.disabled = false;
    __audioSelect.disabled = false;
  }

  __setRunType(__pmdView);
  __setAudioType(__pmdView);
};


// TODO: remove magic numbers
// TODO: rename
var __audioSelectedState = function() {
  if(__audioSelect.options[1].selected) {
    __runTypeSelect.options[0].selected = false;
//    __runTypeSelect.options[1].selected = false;
//    __runTypeSelect.options[2].selected = true;
    __runTypeSelect.options[1].selected = true;
    __runTypeSelect.disabled = true;
  } else {
    if(! __videoGenerationCheckbox.checked)
      __runTypeSelect.disabled = false;
  }

  __setRunType(__pmdView);
};


// TODO: remove magic numbers
// TODO: rename
var __motionSelectedState = function() {
  var index = parseInt(__motionSelect.value);
  var m = __motions[index];
  if(m.music !== undefined && m.music !== null) {
    __audioSelect.disabled = false;
  } else {
    __audioSelect.options[0].selected = true;
    __audioSelect.options[1].selected = false;
    __audioSelect.disabled = true;
  }

  __setAudioType(__pmdView);
};


window.onload = function() {
  __loadModelButton = document.getElementById('loadModelButton');
  __loadMotionButton = document.getElementById('loadMotionButton');
  __modelSelect = document.getElementById('modelSelect');
  __motionSelect = document.getElementById('motionSelect');
  __audioSelect = document.getElementById('audioSelect');
  __videoGenerationCheckbox = document.getElementById('videoGenerationCheckbox');
  __physicsCheckbox = document.getElementById('physicsCheckbox');
  __physicsSelect = document.getElementById('physicsSelect');
  __ikSelect = document.getElementById('ikSelect');
  __morphSelect = document.getElementById('morphSelect');
  __stageSelect = document.getElementById('stageSelect');
  __sphereMapSelect = document.getElementById('sphereMapSelect');
  __shadowMappingSelect = document.getElementById('shadowMappingSelect');
  __effectSelect = document.getElementById('effectSelect');
  __runTypeSelect = document.getElementById('runTypeSelect');
  __edgeSelect = document.getElementById('edgeSelect');
  __skinningSelect = document.getElementById('skinningSelect');
  __lightingSelect = document.getElementById('lightingSelect');
  __lightColorRange = document.getElementById('lightColorRange');
  __lightColorSpan = document.getElementById('lightColorSpan');

  __canvas = document.getElementById('mainCanvas');
  __canvas.onblur =  __mouseUpHandler;
  __canvas.onmousedown = __mouseDownHandler;
  __canvas.onmouseup = __mouseUpHandler;
  __canvas.onmousemove = __mouseMoveHandler;
  __canvas.oncontextmenu = __contextMenuHandler;
  __canvas.addEventListener('mousewheel', __wheelHandler, false);
  // 1.Layer を作成(WF)
  __layer = new Layer(__canvas);
  // 2.Layer インスタンスからPMDView インスタンスを作成(WF)
  var pmdView = new PMDView(__layer);
  __pmdView = pmdView;  // for console debug

  __updateLightColorSpan();

  // DOM の各要素を config 通りに初期化
  __initSelect(__modelSelect, __models);
  __initSelect(__motionSelect, __motions);
  __initSelect(__audioSelect, __audios);
  __initSelect(__physicsSelect, __physicses);
  __initSelect(__ikSelect, __iks);
  __initSelect(__morphSelect, __morphs);
  __initSelect(__stageSelect, __stages);
  __initSelect(__sphereMapSelect, __sphereMaps);
  __initSelect(__shadowMappingSelect, __shadowMappings);
  __initSelect(__runTypeSelect, __runTypes);
  __initSelect(__effectSelect, __effects);
  __initSelect(__edgeSelect, __edges);
  __initSelect(__skinningSelect, __skinnings);
  __initSelect(__lightingSelect, __lightings);

  // 3. PMDView インスタンスに各設定を保存する(WF)
  __setPhysicsType(pmdView);
  __setIKType(pmdView);
  __setMorphType(pmdView);
  __setStageType(pmdView);
  __setSphereMapType(pmdView);
  __setRunType(pmdView);
  __setEffectFlag(pmdView);
  __setEdgeType(pmdView);
  __setSkinningType(pmdView);
  __setLightingType(pmdView);
  __setLightColor(pmdView);
  __setAudioType(pmdView);

  __putStatus('select model and click load model button.');
  __initState();
};


var __initSelect = function(s, options) {
  for(var i = 0; i < options.length; i++) {
    var o = document.createElement('option');
    o.selected = (options[i].selected) ? true : false;
    o.value = i;
    o.innerText = options[i].name;
    s.appendChild(o);
  }
};

// 4. モデルロードボタンが押下された時(WF)
var __loadModelButtonClicked = function() {
  // DOM の able/disable 設定
  __loadingFileState();

  var index = parseInt(__modelSelect.value);
  __selectedModel = __models[index];

  var modelURL = __selectedModel.url;

  var request = new XMLHttpRequest();
  request.responseType = 'arraybuffer';
  request.onload = function() {
	// 5. PMD ファイルの parse(WF)
    __startPMDFileParse(request.response);
  };
  request.onerror = function(error) {
    var str = '';
    for(var key in error) {
      str += key + '=' + error[key] + '\n';
    }
    __putStatus(str);
    __initState();
  };
  request.open('GET', modelURL, true);
  request.send(null);
  __putStatus('loading PMD file...');
};


// 6. PMD ファイルの parse(WF)
var __startPMDFileParse = function(buffer) {
  __putStatus('parsing PMD file...');
  // Note: async call to update status area now.
  requestAnimationFrame(function(){__analyzePMD(buffer);});
};


// 7. PMD ファイルの parse(WF)
var __analyzePMD = function(buffer) {
  var pfp = new PMDFileParser(buffer);
  __pfp = pfp; // for console debug.

  if(! pfp.valid()) {
    __putStatus('this file seems not a PMD file...');
    __initState();
    return;
  }

  var pmd = pfp.parse();
  __pmd = pmd; // for console debug.

  pmd.setup();

  // 8. PMD ファイルから画像のロード(WF)
  __loadImages(pmd);
};


var __loadImages = function(pmd) {
  var url = __selectedModel.url;
  var imageBaseURL = url.substring(0, url.lastIndexOf('/'));
  // 9. PMD ファイルから画像のロード(WF)
  pmd.loadImages(imageBaseURL, __imagesLoaded);
  __putStatus('loading images...');
};


// 10. PMD ファイルから画像のロード完了(WF)
var __imagesLoaded = function(pmd) {
  var pmdView = __pmdView;

  __putStatus('PMD is ready.');
  __putStatus('select motion and click load motion button.');

  // TODO: temporal
  if(pmdView.getModelNum() < 5-1) {
    __putStatus('Or select model and click load model button.');
  }

  __pmdFileLoadedState();
  __pmdFileLoaded = true;

  // 11. PMDModelView インスタンスの作成(WF)
  var pmdModelView = new PMDModelView(__layer, pmd, pmdView);
  pmdModelView.setup();

  // 12. PMDModelView を pmdView に追加(WF)
  pmdView.addModelView(pmdModelView);
  // 13. PMDModelView の数に応じて各モデルの立ち位置を設定(WF)
  __setModelsBasePosition(pmdView.modelViews);

  if(pmdView.getModelNum() === 1) {
    pmdView.setEye(__selectedModel.eye);
    // 14. update && display each requestAnimationFrame(WF)
    __runStep(pmdView);
  }
};


var __setModelsBasePosition = function(pmdModelViews) {
  switch(pmdModelViews.length) {
    case 1:
      pmdModelViews[0].setBasePosition(0, 0, 0);
      break;
    case 2:
      pmdModelViews[0].setBasePosition(-10, 0, 0);
      pmdModelViews[1].setBasePosition( 10, 0, 0);
      break;
    case 3:
      pmdModelViews[0].setBasePosition(  0, 0,  0);
      pmdModelViews[1].setBasePosition( 10, 0, 10);
      pmdModelViews[2].setBasePosition(-10, 0, 10);
      break;
    case 4:
      pmdModelViews[0].setBasePosition(  5, 0,  0);
      pmdModelViews[1].setBasePosition( -5, 0,  0);
      pmdModelViews[2].setBasePosition( 15, 0, 10);
      pmdModelViews[3].setBasePosition(-15, 0, 10);
      break;
    case 5:
      pmdModelViews[0].setBasePosition(  0, 0,  0);
      pmdModelViews[1].setBasePosition( 10, 0, 10);
      pmdModelViews[2].setBasePosition(-10, 0, 10);
      pmdModelViews[3].setBasePosition( 20, 0, 20);
      pmdModelViews[4].setBasePosition(-20, 0, 20);
      break;
    default:
      break;
  }
};


// 15. motion のロードを押下(WF)
var __loadMotionButtonClicked = function() {
  __loadingFileState();

  var index = parseInt(__motionSelect.value);
  __selectedMotion = __motions[index];

  var motionURLs = __selectedMotion.url;

  __loadVMDFiles(motionURLs, 0, []);
};


// TODO: load in parallel if file# become many.
var __loadVMDFiles = function(urls, index, buffers) {
  var url = urls[index];
  var request = new XMLHttpRequest();
  request.responseType = 'arraybuffer';
  request.onload = function() {
    buffers.push(request.response);
    if(index+1 >= urls.length)
	  // 最後のURLを読み込み終わった
      __startVMDFilesParse(buffers);
    else
      // 再帰的に自分を呼び出し
      __loadVMDFiles(urls, index+1, buffers);
  };
  request.onerror = function(error) {
    var str = '';
    for(var key in error) {
      str += key + '=' + error[key] + '\n';
    }
    __putStatus(str);
    __pmdFileLoadedState();
  };
  request.open('GET', url, true);
  request.send(null);
  __putStatus('loading VMD file ' + (index+1) + ' ...');
};


var __startVMDFilesParse = function(buffers) {
  __putStatus('parsing VMD files...');
  // Note: async call to update status area now.
  requestAnimationFrame(function(){__analyzeVMD(buffers);});
};


var __analyzeVMD = function(buffers) {
  var i;
  var vmds = [];
  var vfps = [];
  for(i = 0; i < buffers.length; i++) {
    vfps[i] = new VMDFileParser(buffers[i]);

    if(! vfps[i].valid()) {
      __putStatus('file ' + (i+1) + ' seems not a VMD file...');
      __pmdFileLoadedState();
      return;
    }

    vmds[i] = vfps[i].parse();
  }

  var vmd = vmds[0];
  var vfp = vfps[0];
  __vfp = vfps[0]; // for console debug.
  __vmd = vmds[0]; // for console debug.

  for(i = 1; i < buffers.length; i++) {
	// 複数モーションある場合は一番最初のモーションにマージしていく
    vmd.merge(vmds[i]);
  }

  // TODO: has accessed __pmdView
  // 16. PMDView インスタンスに VMD インスタンスをセット(WF)
  __pmdView.setVMD(vmd);
  __pmdView.setEye(__selectedMotion.eye);

  __vmdFileLoaded = true;

  if(__selectedMotion.music) {
    __loadMusicFile();
  } else {
    __startDance();
  }
};


var __loadMusicFile = function() {
  __loadingFileState();

  var url = __selectedMotion.music.url;
  var audio = new Audio(url);
  audio.addEventListener('canplaythrough', function() {
    __startDance();
  });
  __pmdView.setAudio(audio, __selectedMotion.music.offset);
  __putStatus('loading Audio files...');
};


var __startDance = function() {
  __putStatus('ready.');
  __putStatus('starts dance.');

  // 17. dance を開始(WF)
  __pmdView.startDance();

  if(__videoGenerationCheckbox.checked) {
    __videoEncoder = new Whammy.Video(60);

    var s = document.getElementById('videoSpan');
    var b = document.createElement('button');
    b.innerText = 'output video';
    b.onclick = function() {__generateVideo();};
    s.appendChild(b);
  }

  __vmdFileLoadedState();
};


var __physicsSelectChanged = function() {
  __setPhysicsType(__pmdView);  // TODO: has accessed __pmdView
};


var __ikSelectChanged = function() {
  __setIKType(__pmdView);  // TODO: has accessed __pmdView
};


var __morphSelectChanged = function() {
  __setMorphType(__pmdView);  // TODO: has accessed __pmdView
};


var __stageSelectChanged = function() {
  __setStageType(__pmdView);  // TODO: has accessed __pmdView
};


var __sphereMapSelectChanged = function() {
  __setSphereMapType(__pmdView);  // TODO: has accessed __pmdView
};


var __shadowMappingSelectChanged = function() {
  __setShadowMappingType(__pmdView);  // TODO: has accessed __pmdView
};


var __runTypeSelectChanged = function() {
  __setRunType(__pmdView);  // TODO: has accessed __pmdView
};


var __effectSelectChanged = function() {
  __setEffectFlag(__pmdView);  // TODO: has accessed __pmdView
};


var __edgeSelectChanged = function() {
  __setEdgeType(__pmdView);  // TODO: has accessed __pmdView
};


var __skinningSelectChanged = function() {
  __setSkinningType(__pmdView);  // TODO: has accessed __pmdView
};


var __lightingSelectChanged = function() {
  __setLightingType(__pmdView);  // TODO: has accessed __pmdView
};


var __lightColorRangeChanged = function() {
  __updateLightColorSpan();
  __setLightColor(__pmdView);  // TODO: has accessed __pmdView
};


var __audioSelectChanged = function() {
  __audioSelectedState();
  __setAudioType(__pmdView);  // TODO: has accessed __pmdView
};


var __motionSelectChanged = function() {
  __motionSelectedState();
  __audioSelectChanged();
};


var __updateLightColorSpan = function() {
  __lightColorSpan.innerText = __lightColorRange.value;
};


var __setPhysicsType = function(pmdView) {
  var index = parseInt(__physicsSelect.value);
  pmdView.setPhysicsType(__physicses[index].value);
};


var __setIKType = function(pmdView) {
  var index = parseInt(__ikSelect.value);
  pmdView.setIKType(__iks[index].value);
};


var __setMorphType = function(pmdView) {
  var index = parseInt(__morphSelect.value);
  pmdView.setMorphType(__morphs[index].value);
};


var __setStageType = function(pmdView) {
  var index = parseInt(__stageSelect.value);
  pmdView.setStageType(__stages[index].value);
};


var __setSphereMapType = function(pmdView) {
  var index = parseInt(__sphereMapSelect.value);
  pmdView.setSphereMapType(__sphereMaps[index].value);
};


var __setShadowMappingType = function(pmdView) {
  var index = parseInt(__shadowMappingSelect.value);
  pmdView.setShadowMappingType(__shadowMappings[index].value);
};


var __setRunType = function(pmdView) {
  var index = parseInt(__runTypeSelect.value);
  pmdView.setRunType(__runTypes[index].value);
};


var __setEffectFlag = function(pmdView) {
  var index = parseInt(__effectSelect.value);
  pmdView.setEffectFlag(__effects[index].value);
};


var __setEdgeType = function(pmdView) {
  var index = parseInt(__edgeSelect.value);
  pmdView.setEdgeType(__edges[index].value);
};


var __setSkinningType = function(pmdView) {
  var index = parseInt(__skinningSelect.value);
  pmdView.setSkinningType(__skinnings[index].value);
};


var __setLightingType = function(pmdView) {
  var index = parseInt(__lightingSelect.value);
  pmdView.setLightingType(__lightings[index].value);
};


var __setLightColor = function(pmdView) {
  var color = parseFloat(__lightColorRange.value);
  pmdView.setLightColor(color);
};


var __setAudioType = function(pmdView) {
  var index = parseInt(__audioSelect.value);
  pmdView.setAudioType(__audios[index].value);
};


// TODO: temporal
var __videoGenerationCheckboxChanged = function() {
  __videoGenerationCheckboxState();
};


var __generateVideo = function() {
  if(__videoEncoder === null)
    return;

  var s = document.getElementById('videoSpan');
  s.firstChild.disabled = true;
  while(s.firstChild.nextSibling)
    s.removeChild(s.firstChild.nextSibling);

  __putStatus('compiling video file...');
  // Note: async call to update status area now.
  requestAnimationFrame(function(){__startVideoCompile();});
};


var __startVideoCompile = function() {
  var output = __videoEncoder.compile();

  __putStatus('creating object URL...');
  // Note: async call to update status area now.
  requestAnimationFrame(function(){__startVideoGeneration(output);});
};


var __startVideoGeneration = function(output) {
  var url = URL.createObjectURL(output);

  var s = document.getElementById('videoSpan');
  s.firstChild.disabled = false;

  var a = document.createElement('a');
  a.innerText = 'video';
  a.href = url;
  a.target = '_blank';
  a.style.marginLeft = '10px';  // TODO: temporal

  s.appendChild(a);
  __putStatus('video was generated.');
};


var __runStep = function(pmdView) {
  pmdView.update();
  pmdView.draw();

  // TODO: temporal
  if(__videoEncoder !== null) {
    __videoEncoder.add(pmdView.layer.canvas);
  }

  requestAnimationFrame(function() {__runStep(pmdView);});
  __calculateFps();
  __count++;
};


var __calculateFps = function() {
  if((__count % __fps_span) !== 0)
    return;

  var newTime = Date.now();
  if(__oldTime !== undefined) {
    var fps = parseInt(1000*__fps_span / (newTime - __oldTime));
    document.getElementById('fpsSpan').innerText = fps + 'fps';
  }
  __oldTime = newTime;
};


var __wheelHandler = function(e) {
  if(! __pmdFileLoaded)
    return;

  var d = ((e.detail || e.wheelDelta) > 0) ? 1 : -1;
  __pmdView.moveCameraForward(d);
  e.preventDefault();
};


var __mouseDownHandler = function(e) {
  if(! __pmdFileLoaded)
    return;

  __isDragging = true;

  __previousMousePosition.x = e.clientX;
  __previousMousePosition.y = e.clientY;
};


var __mouseUpHandler = function(e) {
  if(! __pmdFileLoaded)
    return;

  __isDragging = false;
};


var __contextMenuHandler = function(e) {
  if(! __pmdFileLoaded)
    return;

  __pmdView.resetCameraMove();
  e.preventDefault();
};


var __mouseMoveHandler = function(e) {
  if(! __pmdFileLoaded)
    return;

  if(! __isDragging)
    return;

  var dx = (__previousMousePosition.x - e.clientX) / __canvas.width;
  var dy = (__previousMousePosition.y - e.clientY) / __canvas.height;

  if(e.shiftKey) {
    __pmdView.moveCameraTranslation(dx, dy);
  } else {
    __pmdView.moveCameraQuaternionByXY(dx, dy);
  }

  __previousMousePosition.x = e.clientX;
  __previousMousePosition.y = e.clientY;
};


window.__loadModelButtonClicked = __loadModelButtonClicked;
window.__loadMotionButtonClicked = __loadMotionButtonClicked;
window.__motionSelectChanged = __motionSelectChanged;
window.__audioSelectChanged = __audioSelectChanged;
window.__videoGenerationCheckboxChanged = __videoGenerationCheckboxChanged;
window.__physicsSelectChanged = __physicsSelectChanged;
window.__loadMotionButtonClicked = __loadMotionButtonClicked;
window.__ikSelectChanged = __ikSelectChanged;
window.__morphSelectChanged = __morphSelectChanged;
window.__stageSelectChanged = __stageSelectChanged;
window.__sphereMapSelectChanged = __sphereMapSelectChanged;
window.__shadowMappingSelectChanged = __shadowMappingSelectChanged;
window.__edgeSelectChanged = __edgeSelectChanged;
window.__skinningSelectChanged = __skinningSelectChanged;
window.__runTypeSelectChanged = __runTypeSelectChanged;
window.__effectSelectChanged = __effectSelectChanged;
window.__lightingSelectChanged = __lightingSelectChanged;
window.__lightColorRangeChanged = __lightColorRangeChanged;

},{"./Pmd/PMDFileParser":15,"./Pmd/PMDModelView":17,"./Pmd/PMDView":20,"./Vmd/VMDFileParser":31,"./WebGL/Layer":43}]},{},[50]);

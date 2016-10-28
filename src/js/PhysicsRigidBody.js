'use strict';
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

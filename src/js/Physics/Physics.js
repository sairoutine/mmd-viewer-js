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

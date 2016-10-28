'use strict';
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
};
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

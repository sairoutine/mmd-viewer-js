'use strict';
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
  // センター, 左足首, 右足首, 左目, 右目
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

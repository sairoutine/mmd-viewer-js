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
};


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

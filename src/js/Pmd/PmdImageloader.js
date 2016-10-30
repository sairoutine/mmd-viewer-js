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
    var fileName = this.pmd.materials[i].convertedFileName();
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

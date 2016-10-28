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

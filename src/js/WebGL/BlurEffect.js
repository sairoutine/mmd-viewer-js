'use strict';

function BlurEffect(layer) {
  this.parent = PostEffect;
  this.parent.call(this, layer, 1);
};
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

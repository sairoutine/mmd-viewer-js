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

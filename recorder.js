var Recorder = function( config ){

  var that = this;

  if ( !Recorder.isRecordingSupported() ) {
    throw "Recording is not supported in this browser";
  }

  config = config || {};
  config.bufferLength = config.bufferLength || 4096;
  config.enableMonitoring = config.enableMonitoring || false;
  config.numberOfChannels = config.numberOfChannels || 2;
  config.workerPath = config.workerPath || 'recorderWorker.js';
  this.config = config;

  this.audioContext = new Recorder.AudioContext();
  this.scriptProcessorNode = this.audioContext.createScriptProcessor( config.bufferLength, config.numberOfChannels, config.numberOfChannels );
  this.scriptProcessorNode.onaudioprocess = function( e ){ that.addToBuffer( e.inputBuffer ); };
  this.scriptProcessorNode.connect( this.audioContext.destination );

  this.worker = new Worker( config.workerPath );
  this.worker.postMessage({
    command: 'init',
    config: {
      sampleRate: this.audioContext.sampleRate,
      numberOfChannels: config.numberOfChannels
    }
  });

  this.initCallbackQueue = [];
  this.pauseRecording();
  this.initStream();
};

Recorder.AudioContext = window.AudioContext || window.webkitAudioContext;
Recorder.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
Recorder.isRecordingSupported = function(){
  return Recorder.AudioContext && Recorder.getUserMedia;
};

Recorder.prototype.addToBuffer = function( inputBuffer ){

  var buffer;
  if (!this.isPaused) {

    buffer = [];
    for (var i = 0; i < inputBuffer.numberOfChannels; i++) {
      buffer.push( inputBuffer.getChannelData(i) );
    }

    this.worker.postMessage({
      command: 'addToBuffer',
      buffer: buffer
    });
  }
};

Recorder.prototype.clear = function(){
  this.worker.postMessage({ command: 'clear' });
};

Recorder.prototype.disableMonitoring = function(){
  this.config.enableMonitoring = false;
  if (this.isInitialized) {
    this.sourceNode.disconnect( this.audioContext.destination );
  }
};

Recorder.prototype.enableMonitoring = function(){
  this.config.enableMonitoring = true;
  this.initStream( function(){
    this.sourceNode.connect( this.audioContext.destination );
  });
};

Recorder.prototype.getWavBlob = function( cb, mimeType ){

  var that = this;
  var getWavBlobHandler = function( e ){ that.workerCallbackHandler( e, cb, getWavBlobHandler ); };

  this.worker.addEventListener( "message", getWavBlobHandler );
  this.worker.postMessage({
    command: 'getWavBlob',
    mimeType: mimeType || 'audio/wav'
  });
};

Recorder.prototype.getBuffer = function( cb ) {

  var that = this;
  var getBufferHandler = function( e ){ that.workerCallbackHandler( e, cb, getBufferHandler ); };

  this.worker.addEventListener( "message", getBufferHandler );
  this.worker.postMessage({ command: 'getBuffer' });
};

Recorder.prototype.initStream = function( success ){

  var that;
  var audioOptions = {
    mandatory: {
      googEchoCancellation: false,
      googAutoGainControl: false,
      googNoiseSuppression: false,
      googHighpassFilter: false
    },
    optional: []
  };

  success = success || function(){};
  
  if ( this.isInitialized ) {
    success.call( this );
  }

  else {
    this.initCallbackQueue.push( success );

    if ( !this.isInitializing ) {
      this.isInitializing = true;
      that = this;
      Recorder.getUserMedia(
        { audio: audioOptions },
        function( stream ){ that.onStreamInit( stream ); }, 
        function( e ){ throw e; }
      );
    }
  }
};

Recorder.prototype.isRecording = function(){
  return !this.isPaused;
};

Recorder.prototype.onStreamInit = function( stream ){
  this.stream = stream;
  this.sourceNode = this.audioContext.createMediaStreamSource( stream );
  this.sourceNode.connect( this.scriptProcessorNode );

  this.isInitializing = false;
  this.isInitialized = true;

  if ( this.config.enableMonitoring ) {
    this.sourceNode.connect( this.audioContext.destination );
  }

  while ( this.initCallbackQueue.length ) {
    this.initCallbackQueue.shift()();
  }
};

Recorder.prototype.pauseRecording = function(){
  this.isPaused = true;
};

Recorder.prototype.startRecording = function(){
  this.initStream( function(){ this.isPaused = false; } );
};

Recorder.prototype.stopRecording = function(){
  this.pauseRecording();
  if ( this.isInitialized ) {
    this.stream.stop();
    this.sourceNode.disconnect( this.audioContext.destination );
    this.sourceNode.disconnect( this.scriptProcessorNode );
    this.isInitialized = false;
  }
};

Recorder.prototype.workerCallbackHandler = function( e, cb, handlerRef ){
  if ( !e.hasBeenCaptured ) {
    e.hasBeenCaptured = true;
    this.worker.removeEventListener( "message", handlerRef );
    cb( e.data );
  }
};

# Recorder.js

## A plugin for recording/exporting the output of Web Audio API nodes

### Syntax
#### Constructor
    var rec = new Recorder([config])

Creates a recorder instance.

- **config** - An optional configuration object (see **config** section below)

---------
#### Config

- **enableMonitoring** - (*optional*) If you want the hear the recorder input live. Defaults to false
- **workerPath** - (*optional*) Path to recorder.js worker script. Defaults to 'recorderWorker.js'
- **bufferLen** - (*optional*) The length of the buffer that the internal JavaScriptNode uses to capture the audio. Can be tweaked if experiencing performance issues. Defaults to 4096.
- **numberOfChannels** - (*optional*) The number of channels to record. 1 = mono, 2 = stereo. Defaults to 2

---------
#### Instance Methods

    rec.startRecording()

**startRecording** will begin capturing audio.

    rec.pauseRecording()

**pauseRecording** will keep the stream and monitoring alive, but will not be recording the buffers. Subsequent calls to **startRecording** will add to the current recording.

    rec.stopRecording()

**stopRecording** will cease capturing audio and disable the monitoring and mic input stream. Subsequent calls to **startRecording** will require authorization to access the input stream again before adding to the current recording.

    rec.clear()

This will clear the data buffers of any recorded data.

    rec.enableMonitoring()
    rec.disableMonitoring()

This will enable and disable the live monitoring of your mic input. Headphones are recommended if enabling monitoring to avoid feedback noise.

    rec.getWavBlob( callback[, mimeType])

This will generate a Blob object containing the recording in WAV format. The callback will be called with the Blob as its sole argument.

In addition, you may specify the mime type of Blob to be returned (defaults to "audio/wav").

    rec.getBuffer( callback )

This will pass the recorded stereo buffer (as an array of Float32Arrays for the separate channels) to the callback. It can be played back by creating a new source buffer and setting these buffers as the separate channel data:

	function getBufferCallback( buffers ) {
		var newSource = audioContext.createBufferSource();
		var newBuffer = audioContext.createBuffer( 2, buffers[0].length, audioContext.sampleRate );
		newBuffer.getChannelData(0).set(buffers[0]);
		newBuffer.getChannelData(1).set(buffers[1]);
		newSource.buffer = newBuffer;

		newSource.connect( audioContext.destination );
		newSource.start(0);
	}

This sample code will play back the stereo buffer.

---------
#### Static Methods

    Recorder.isRecordingSupported()

Will return a boolean value indicating if the browser supports recording.

## License (MIT)

Copyright © 2013 Matt Diamond

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/*
# Copyright 2015 IBM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
*/

// *********************************************
// This is the setup code. The Audio recording code is to be
// used in conjunction with code from another page. This code only 
// deals with recording and submitting audio. 
// *********************************************

$(document).ready(function() {
	audioButtonStuff();
	dataCacheStuff();
	audioCheckStuff();	
});

function audioButtonStuff() {	
	var stopButton = $('#id_stopButton');
	var recordButton = $('#id_recordButton');
	
	(function() { 
		recordButton.click(
			function(){
				recordButton.hide();
				stopButton.show();
				requestAudioRecording();
			});
		stopButton.click(
			function(){
				stopButton.hide();
				processAudioOnlyStream();
				localStream = stopButton.data("mediaStream");
				if (localStream) {
					// localStream.stop() was throwing a deprecated, will be removed in Nov 2015 
					// so aded the track.stop(), but that didn't seem to work well with firefox, so
					// for now keeping both in.
					localStream.stop();
					var numTracks = localStream.getTracks().length
					for (i in localStream.getTracks()) {
						var track = localStream.getTracks()[i];  
						track.stop();
					}
				}
			});
	})();	
}	

function resetAudioButtons() {
	$('#id_stopButton').hide();
	$('#id_recordButton').hide();
}

// ******************************************************
// This flushes the channel buffers, which are held as data
// in a datastore field on the page.
// ******************************************************

function dataCacheStuff() {
	var leftchannel = [];
	var rightchannel = [];
	leftchannel.length = 0;
	rightchannel.length = 0;
		
	$('#id_datastore').data("leftchannel", leftchannel);
	$('#id_datastore').data("rightchannel", rightchannel);
	$('#id_datastore').data("recording", false);
	$('#id_datastore').data("recordlength", 0);
}

// ******************************************************
// Audio support checks
// ******************************************************

function audioCheckStuff() {
	var supported = false;
	if (isUserMediaSupported()) {
		supported = true;
	} 
	$('#id_datastore').data("audiosupported", supported);	
}

function isUserMediaSupported() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

function getUserMediaFunction() {
	return ( navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia);
}

// **********************************************
// The record button has been pressed, so first there
// is a user prompt to allow recording to happen
// **********************************************

function requestAudioRecording() {
	navigator.getUserMedia = getUserMediaFunction();
	navigator.getUserMedia(
		{audio: true}, 
		startAudioRecording, 
		notAllowed
	);
}

function notAllowed(e) {
	var etxt = "Media Persmission Denied - " + e.name ;					
	
	setStatusMessage('e', etxt);	
	resetAudioButtons();
}

// **********************************************
// Recording is being permitted.
// **********************************************

function startAudioRecording(localMediaStream) {
	dataCacheStuff();
	
	$('#id_stopButton').data("mediaStream", localMediaStream);
	audioContext = window.AudioContext || window.webkitAudioContext;
	
	context = new audioContext();
	// retrieve the current sample rate to be used for WAV packaging
	sampleRate = context.sampleRate;
	//console.log("Sample Rate is ", sampleRate);

	// creates a gain node
	volume = context.createGain();

	// creates an audio node from the microphone incoming stream
	audioInput = context.createMediaStreamSource(localMediaStream);
	
	// connect the stream to the gain node
	audioInput.connect(volume);
	
	/* 	From the spec: This value controls how frequently the audioprocess event is 
		dispatched and how many sample-frames need to be processed each call. 
		Lower values for buffer size will result in a lower (better) latency. 
		Higher values will be necessary to avoid audio breakup and glitches */
	var bufferSize = 2048;
	//Stick to 2 input and 2 output channel
	var recorder;
	if (!context.createScriptProcessor){
		recorder = context.createJavaScriptNode(bufferSize, 2, 2);
	} 
	else {
		recorder = context.createScriptProcessor(bufferSize, 2, 2);
	}
	if (recorder) {
			recorder.onaudioprocess 
				= function(e){
					var recording = $('#id_datastore').data("recording");
					if (recording) {
						var left = e.inputBuffer.getChannelData (0);
						var right = e.inputBuffer.getChannelData (1);
						//we clone the samples
						var leftchannel = $('#id_datastore').data("leftchannel");
						var rightchannel = $('#id_datastore').data("rightchannel");
						if (leftchannel && rightchannel) {
							leftchannel.push (new Float32Array (left));
							rightchannel.push (new Float32Array (left));
							recordingLength = bufferSize + $('#id_datastore').data("recordlength");
							$('#id_datastore').data("recordlength", recordingLength)						
						}
					}
				};
			// we connect the recorder
			volume.connect(recorder);
			recorder.connect(context.destination); 
			$('#id_datastore').data("recording", true);
	}	
}

// **********************************************
// Stop Recording button has been pressed. No Cancels allowed
// **********************************************

function processAudioOnlyStream() { 
	if ($('#id_datastore').data("recording")) {
		$('#id_datastore').data("recording", false);
		
		var leftchannel = $('#id_datastore').data("leftchannel");
		var rightchannel = $('#id_datastore').data("rightchannel");
		var	recordingLength = $('#id_datastore').data("recordlength");

		var leftBuffer = createAudioBuffer( leftchannel, recordingLength );
		var rightBuffer = createAudioBuffer( rightchannel, recordingLength );

		var interleaved = interleave( leftBuffer, rightBuffer );

        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);
		
        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);
		
        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++){
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }
        
        // our final binary blob
        var blob = new Blob ( [ view ], { type : 'audio/wav' } );
		
		sendToServer(blob);
		// As a sanity check put this back in to check what is being created.
		//saveAudioFile(blob);
	}
}				

function createAudioBuffer( channelBuffer, recordingLength ) {
	var result = new Float32Array(recordingLength);
	var offset = 0;
	var lng = channelBuffer.length;
	for (var i = 0; i < lng; i++) {
		var buffer = channelBuffer[i];
		result.set(buffer, offset);
		offset += buffer.length;
	}
	return result;	
}

function interleave(leftChannel, rightChannel){
  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);

  var inputIndex = 0;

  for (var index = 0; index < length; ){
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeUTFBytes(view, offset, string){ 
  var lng = string.length;
  for (var i = 0; i < lng; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ********************************************
// Will be sending the audio to be processed. 
// Send to a holding function on the parent page which should know how to handle
// ********************************************

function sendToServer(audioBlob) {
	handleAudioAsInput(audioBlob);
}

function saveAudioFile(blob)
{
	var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);		
}

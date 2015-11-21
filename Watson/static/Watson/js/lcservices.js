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
// This is the initial page setup code, where a list of options is displayed and the
// user is invited to make a selection and request analysis
// *********************************************

$(document).ready(function() {
	// Build the option listeners, then start the process of fetching the classifiers through the proxy api
	hideStuff();	
	setStatusMessage('w', "Select Classifier for Analysis");
	buildListeners();
	fetchClassifiers();
});

function hideStuff() {
	$('#id_classifications').hide();
    $('#id_classifiers').hide();	
    $(id_refreshButton).hide();
	$(id_twitButton).hide();
	$(id_recordButton).hide();
	$(id_stopButton).hide();	
	$('#id_newclassform').hide();
}

function buildListeners() {
	$(id_twitClassifier).attr('readonly', true);
	$(id_twitID).on('input', function(){checkTwitterFields()});
	$(id_classInputFile).change(function(){checkChosenFile()});
}

// ****************************************************
// This section has the functions that handle the fetch
// of the classifier list
// ****************************************************

function fetchClassifiers() {
	setStatusMessage('i', "Fetching Classifiers");
		$.ajax({
		type: 'GET',
		url: '/watson/lclist',
		success: listOK,
		error: listNotOK
	});
	setStatusMessage('i', "Waiting for a response from the server");
}

function listNotOK() {
	// There was a problem in the request. Would like to merge the NotOK functions into one, but this way
	// we can have an appropriate message displayed rather than a generic one
	setStatusMessage('d', "Fetch of classifiers failed");	
}

function listOK(response) {
	// The requested tweets, classification and alchemy data analysis has now been received.
	// Check for errors
	setStatusMessage('i', "Call was good - processing the Results");	
	var results = response['results'];	
	
	if (results) {
	  var errMessage = results['error'];
	  if (errMessage) {
		setStatusMessage('d', errMessage);	
	  }	
	  else {
		  if ("classifiers" in results && "classifiers" in results["classifiers"]) {
			  $('#id_classifiers').hide();
		      $('#id_cstable > tbody').empty();
			  cs = results["classifiers"]["classifiers"];
			  var inTraining = false;
			  for (c in cs) {
				  e = cs[c];
				  cname = "'" + e["name"] + "'";
				  curl = "'" + e["url"] + "'";;
				  cstatus = e["status"]["status"];
                  var buttonStart = '';
				  var buttonEnd = '';
				  if ("Training" != cstatus) {
					buttonStart = '<button class="rowselector" onclick="javascript:onClassifierSelected(' + cname + ',' + curl +')">'; 
					buttonEnd = '</button>';
				  } else {
					inTraining = true;
  				  }
				  var testerRow = '<tr class="normal-tablerow"><td>' 
										+ buttonStart 
										+ e["name"] 
										+ buttonEnd
										+ '</td>'
										+ '<td>' + cstatus + '</td>' 
										+ '<td>' + e["url"] + '</td>' 
										+ '<td>' 
										+ '<span class="dropbutton">'
										+ '<button class="rowselector" onclick="javascript:onDropClassifier(' + cname + ',' + curl +')">' 
										+ 'Drop</button></span></td>'
										+ '</td></tr>';
		          $('#id_cstable > tbody:last-child').append(testerRow);
                  $('#id_cstable > tbody:last-child button')[0].click();
			  }
			  //$('#id_classifiers').show();
			  if (inTraining) {
              //  $(id_refreshButton).show();	
                $(".dropbutton").hide();				
			  } else {
				// $(".dropbutton").show();  
			  }	  
		  }
	  }	  
    }	
}

function onRefresh() {
  // When the refresh button is displayed then hitting it will restart the refresh of the classifiers	
  $(id_refreshButton).hide();
  $('#id_cstable > tbody').empty();
  fetchClassifiers();		  
}


// ****************************************************
// This section has the functions that handle the 
// new classifier request. 
// The action is staged : 
//		1. on selection the form dialog is displayed
// 		2. there is a check to verify that the chose file has the json extension.
//		3. when the send is clicked the dialog is removed.
// the actual creation is done through python directly to the server by the form.
// ****************************************************
function onNewClassOption() {
  $('#id_newclassform').slideDown();
  $('#id_newclassoption').hide();
  $('#id_sendbutton').prop('disabled', true);
}

function checkChosenFile() {
	var val = $(id_classInputFile).val();	
	var thefile = $(id_classInputFile).prop('files')[0].name;
	
	switch(val.substring(val.lastIndexOf('.') + 1).toLowerCase()){
        case 'json': 
			setStatusMessage('i', "Click on Send to start training of classifier");	
			$('#id_sendbutton').prop('disabled', false);            
			break;
        default:
			setStatusMessage('d', "Only JSON files are expected by this application");	
			$('#id_sendbutton').prop('disabled', true);
            $(id_classInputFile).val('');
            break;
    }
}

function onNewClass() {
  $('#id_newclassform').slideUp();
  $('#id_newclassoption').show();
 
  var val = $(id_classInputFile).val();
}

// ****************************************************
// This section has the functions that handle the 
// classifier drop request. The classifier to drop is
// identified by its url
// ****************************************************

function onDropClassifier(name, classurl){
	setStatusMessage('i', "Starting Process to remove Classifier " + name);
	$.ajax({
		type: 'POST',
		url: '/watson/lcdrop',
		data: {"data": JSON.stringify({"url": classurl})},
		dataType: 'json',		
		success: dropOK,
		error: dropNotOK
	});
	setStatusMessage('i', "Waiting for a response from the server");
}

function dropNotOK() {
	// There was a problem in the request 
	setStatusMessage('d', "Drop of Classifier failed");	
}

function dropOK(response) {
	setStatusMessage('i', "Call was good - processing the Results");
    $('#id_errormessagefromserver').text('');	
	var results = response['results'];	

	if (results) {
	  var errMessage = results['error'];
	  if (errMessage) {
		setStatusMessage('d', errMessage);	
	  }	
	  else {
		fetchClassifiers();	
      }
    }
}

// ****************************************************
// This section has the functions that handle the 
// process of classification of  tweets  
// ****************************************************

function onClassifierSelected(name, url){
    $(id_twitClassifier).val(name);
    $(id_twitClassifier).data('urlClassifier', url);
	checkTwitterFields();
}	

function checkTwitterFields(){
    // Classifier needs to be set
    // If Twitter ID is set then allow Twitter Selection
    // If Twitter ID not set then allow Audio input	
	var twitClass = $(id_twitClassifier).val();
	var twitID = $(id_twitID).val();

	if (twitClass && (0 < twitClass.length))
	{
		if (twitID && (0 < twitID.length))
		{
			$(id_twitButton).show();
			$(id_recordButton).hide();
			setStatusMessage('i', "You can analyse tweets against the classifier");
		}
		else
		{
			$(id_twitButton).hide();
			
			if ( $('#id_datastore').data("audiosupported") )
			{
				$(id_recordButton).show();
				setStatusMessage('i', "You can record audio and send for analysis against the classifier");
			}
			else {
				$(id_recordButton).hide();
				setStatusMessage('w', "Audio is not supported, please enter a twitter id");
			}
		}
	}
	else
	{
		$(id_twitButton).hide();
		$(id_recordButton).hide();
		setStatusMessage('w', "Both Classifier needs to be selected");
	}

}


function onTwitClick(proxyapi){	
	// Can only be clicked if enabled, and only enabled if both fields are set.
	// Proxy API is where this request will go, part of the data is the classifier url
	// that will be used by the proxy, to prevent cross site contamination. 
	$(id_twitButton).hide();
	setStatusMessage('i', "Building data to send to server");

	var url = $(id_twitClassifier).data('urlClassifier');
	var twitID = $(id_twitID).val();
	var twitClassData = {"classifierurl" : url, "twitterid" : twitID};

	setStatusMessage('i', "Sending request to the server");	
	
	$.ajax({
		type: 'POST',
		url: proxyapi,
		data: {"data": JSON.stringify(twitClassData)},
		dataType: 'json',		
		success: twitOK,
		error: twitNotOK
	});

	setStatusMessage('i', "Waiting for a response from the server");		
}

function twitNotOK() {
	// There was a problem in the request 
	setStatusMessage('d', "Classification of tweets request failed");
	$(id_twitButton).show();	
}

function twitOK(response) {
	// The requested tweets, classification and alchemy data analysis has now been received.
	// Check for errors
	setStatusMessage('i', "Call was good - processing the Results");	
	var results = response['results'];	
	
	if (results) {
	  var errMessage = results['error'];
	  if (errMessage) {
		setStatusMessage('d', errMessage);	
	  }	
	  else {
		  var classifications = results['classification'];
		  
		  $('#id_classtable > tbody').empty();
		  for (c in classifications) {
            appendResponseRow(classifications[c]);
			
		  } 
		  $('#id_response').text("Tweet Classification complete");			  
	      $('#id_classifications').show();		  
		  addHoverAnimations($('.twitclassline'));
      }
    }	
	$(id_twitButton).show();	
}

function appendResponseRow(e) {
	if (e.hasOwnProperty("top_class")) {
		var testerRowX = '<tr class="twitclassline"><td>' + e["top_class"] 
							+ '</td><td>' + e["confidence"].toFixed(2) 
							+ '</td><td>' + e["message"]
							+ '</td></tr>';

	}
	else {
		var testerRowX = '<tr class="twitclassline"><td>' +  ''
							+ '</td><td>' + e["confidence"].toFixed(2) 
							+ '</td><td>' + e["message"]
							+ '</td></tr>';
	}

								
	$('#id_classtable > tbody:last-child').append(testerRowX);	
	$('#id_line').append($('<li>').text(e["message"]));
}

function addHoverAnimations(fields) {
	fields.hover(
			function(){$(this).animate({fontSize: '+=15px'}, 200)}, 
			function(){$(this).animate({fontSize: '-=15px'}, 200)}
		);
}

// ***************************************
// Run classification against an audio file
// This will be called by the audio services as
// a callback when the audio is ready.
// ***************************************

function handleAudioAsInput(audioBlob) {
	var url = $(id_twitClassifier).data('urlClassifier');	
	var isWithNLC = $("#id_withNLC").is(":checked")	
	var fd = new FormData();
	fd.append('classifierurl', url);	
	fd.append('fname', 'classifieraudio.wav');
	fd.append('data', audioBlob);
	if (isWithNLC) {
		$.ajax({
			type: 'POST',
			url: '/watson/staudio_with_nlc',
			data: fd,
			processData: false,
			contentType: false,
			success: audioSentOK,
			error: audioSentNotOK
		});
	}else{
		$.ajax({
			type: 'POST',
			url: '/watson/staudio',
			data: fd,
			processData: false,
			contentType: false,
			success: audioSentOK,
			error: audioSentNotOK
		});
	}

	setStatusMessage('i', "Audio sent to server, waiting for a response");	
}

function audioSentNotOK() {
	setStatusMessage('d', "Transmission of Audio Failed");
	$('#id_recordButton').show();
}

function audioSentOK(response) {
	setStatusMessage('i', "Call was good - processing the Results");
	
	var results = response['results'];	
	if (results) {
		var errMessage = results['error'];
		if (errMessage) {
			setStatusMessage('d', errMessage);	
		}	
		else {
			var e;
			if (results.hasOwnProperty('classification')) {
				e = results['classification'];
			} else if (results.hasOwnProperty('transcript')){
				e = {
					message: results['transcript'],
					confidence: results['confidence']
				}
			}
			$('#id_classtable > tbody').empty();

            appendResponseRow(e);			
										
			$('#id_response').text("Audio classification complete");
			setStatusMessage('i', "Audio classification completed");		  
			$('#id_classifications').show();		  
			addHoverAnimations($('.twitclassline'));
      }
    }		
	$('#id_recordButton').show();
}

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
							+ '</td><td>' + e["confidence"] 
							+ '</td><td>' + e["message"]
							+ '</td></tr>';
	}

								
	$('#id_classtable > tbody:last-child').append(testerRowX);	
	//$('#id_line').append($('<li>').addClass('question').text(e["question"]));
	//$('#id_line').append($('<li>').addClass('answer').text(e["message"]));
	$('#id_bootply_line').append('<li class="right clearfix"><span class="chat-img pull-right"><img src="http://placehold.it/50/FA6F57/fff&amp;text=ME" alt="User Avatar" class="img-circle"></span><div class="chat-body clearfix"><div class="header"><small class="text-muted"><span class="glyphicon glyphicon-time"></span></small><strong class="pull-right primary-font">Tourist</strong></div><p>'+ e['question'] +'</p></div></li>');
	$('#id_bootply_line').append('<li class="left clearfix"><span class="chat-img pull-left"><img src="http://placehold.it/50/55C1E7/fff&amp;text=WATSON" alt="User Avatar" class="img-circle"></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">Watson</strong> <small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span></small></div><p>'+ e['message'] +'</p></div></li>');
	updateScroll();
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
	var isWithNLC = $("#id_withNLC").is(":checked");
    var textscript = $("#textscript").val();
	var fd = new FormData();
	fd.append('classifierurl', url);	
	fd.append('fname', 'classifieraudio.wav');
	fd.append('data', audioBlob);
    fd.append('textscript', textscript);
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
        fd.append('client_id', client_id);
        fd.append('conversation_id', conversation_id);
        fd.append('dialog_id', dialog_id);
        fd.append('category', category);
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
	var isDialogueFinished = false;
	var rnr_query = '';
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
			} else if (results.hasOwnProperty('conversationData')){
				e = {
					message: results['conversationData']['response'],
					confidence: "client_id:" + results['conversationData']['client_id'] + ", " + "conversation_id:" + results['conversationData']['conversation_id'] + ", " + "dialog_id:" + results['conversationData']['dialog_id'],
                    client_id: results['conversationData']['client_id'],
                    conversation_id: results['conversationData']['conversation_id'],
                    dialog_id: results['conversationData']['dialog_id'],
                    response: results['conversationData']['response'],
                    question: results['question']

                    }
				conversationResults = results['conversationData']
				if (conversationResults.hasOwnProperty('isFinished') && conversationResults['isFinished']=='YES'){
					isDialogueFinished = true;
					rnr_query = results['conversationData']['response']
				}
                category = results['category'],
                client_id = results['conversationData']['client_id'],
                conversation_id = results['conversationData']['conversation_id'],
                dialog_id = results['conversationData']['dialog_id'],
                response = results['conversationData']['response']
                $("#id_withNLC").prop('checked', false)
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
	var obj = document.createElement("audio"); 
    obj.setAttribute("src", "/static/tts.wav");
    $.get();
    obj.play();
    if(isDialogueFinished){
    	//alert("Dialogue is finished!!!");
    	handleRnrInput(rnr_query);
    	sleep(1000);
    	handleRnrSearchInput(rnr_query);
    }
}

function handleRnrInput(rnr_query) {
	var fd = new FormData();
	fd.append('rnr_user_id', 'f46398e8-51c3-43e5-9494-bce1a9a2f2d0');	
	fd.append('rnr_passwd', 'RNHJsMuwZ3ah');rnr_query
	fd.append('rnr_query', rnr_query);
	$.ajax({
		type: 'POST',
		url: '/watson/rnr',
		data: fd,
		processData: false,
		contentType: false,
		success: rnrSentOK,
		error: rnrSentNotOK
	});

	setStatusMessage('i', "Retrieve and Rank Params sent to server, waiting for a response");	
}

function rnrSentNotOK() {
	setStatusMessage('d', "Transmission of Retrieve and Rank Params Failed");
	$('#id_recordButton').show();
}

function rnrSentOK(response) {
	setStatusMessage('i', "Retrieve and Rank Params Call was good - processing the Results");
	var isDialogueFinished = false;
	var responseHeader = response['responseHeader'];
	if (responseHeader) {
		var status = responseHeader['status'];
		if (status != 0) {
			setStatusMessage('d', status);	
		}	
		else {
			var e = "";
			var results = response['response'];
			var iter_count = 0;
			if (results.hasOwnProperty('docs')) {
				docs = results['docs'];
				e += "<div class='panel panel-default'> <div class='panel-heading'>Retrieve and Rank Results</div> <table class='table table-striped table-labels'>";
				e += "<thead><tr> <th>#</th> <th>Title</th> <th>Score</th> <th>Domain</th> <th>Detail</th> </tr> </thead> <tbody>";
				iter_count = docs.length;
				if (docs.length > 3){
					iter_count = 3;
				}
				for (var i = 0; i < iter_count; i++) { 
					e += "<tr>";
					e = e + "<td>" + (i+1) +"</td>";
					e = e + "<td>" + docs[i]['title'] +"</td>";
					e = e + "<td>" + docs[i]['score'] +"</td>";
					e = e + "<td>" + docs[i]['domain'] +"</td>";
					e = e + "<td><a href='#' data-toggle='tooltip' title='"+escapeSingleQuote(docs[i]['body'])+"'>" + "<button type='button' class='btn btn-default' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button>"+"</a></td>";
					e += "</tr>";
				}
				e += "</tbody> </table> </div>";
				$('#id_bootply_line').append('<li class="left clearfix"><span class="chat-img pull-left"><img src="http://placehold.it/50/55C1E7/fff&amp;text=WATSON" alt="User Avatar" class="img-circle"></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">Watson</strong> <small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span></small></div>'+ e +'</div></li>');
			}
										
			$('#id_response').text("Retrieve and Rank complete");
			setStatusMessage('i', "Retrieve and Rank completed");		  
			$('#id_classifications').show();		  
			addHoverAnimations($('.twitclassline'));
      }
    }		
	$('#id_recordButton').show();
	updateScroll();
}

function handleRnrSearchInput(rnr_query) {
	var fd = new FormData();
	fd.append('rnr_user_id', 'f46398e8-51c3-43e5-9494-bce1a9a2f2d0');	
	fd.append('rnr_passwd', 'RNHJsMuwZ3ah');rnr_query
	fd.append('rnr_query', rnr_query);
	$.ajax({
		type: 'POST',
		url: '/watson/rnrsearch',
		data: fd,
		processData: false,
		contentType: false,
		success: rnrSearchSentOK,
		error: rnrSearchSentNotOK
	});

	setStatusMessage('i', "Retrieve and Rank Search Params sent to server, waiting for a response");	
}

function rnrSearchSentNotOK() {
	setStatusMessage('d', "Transmission of Retrieve and Rank Search Params Failed");
	$('#id_recordButton').show();
}

function rnrSearchSentOK(response) {
	setStatusMessage('i', "Retrieve and Rank SeearchParams Call was good - processing the Results");
	var isDialogueFinished = false;
	var responseHeader = response['responseHeader'];
	if (responseHeader) {
		var status = responseHeader['status'];
		if (status != 0) {
			setStatusMessage('d', status);	
		}	
		else {
			var e = "";
			var results = response['response'];
			var iter_count = 0;
			if (results.hasOwnProperty('docs')) {
				docs = results['docs'];
				e += "<div class='panel panel-default'> <div class='panel-heading'>Search Engine Results</div> <table class='table table-striped table-labels'>";
				e += "<thead><tr> <th>#</th> <th>Title</th> <th>Score</th> <th>Domain</th> <th>Detail</th> </tr> </thead> <tbody>";
				iter_count = docs.length;
				if (docs.length > 3){
					iter_count = 3;
				}
				for (var i = 0; i < iter_count; i++) { 
					e += "<tr>";
					e = e + "<td>" + (i+1) +"</td>";
					e = e + "<td>" + docs[i]['title'] +"</td>";
					e = e + "<td>" + docs[i]['score'] +"</td>";
					e = e + "<td>" + docs[i]['domain'] +"</td>";
					e = e + "<td><a href='#' data-toggle='tooltip' title='"+escapeSingleQuote(docs[i]['body'])+"'>" + "<button type='button' class='btn btn-default' aria-label='Left Align'><span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span></button>"+"</a></td>";
					e += "</tr>";
				}
				e += "</tbody> </table> </div>";
				$('#id_bootply_line').append('<li class="left clearfix"><span class="chat-img pull-left"><img src="http://placehold.it/50/55C1E7/fff&amp;text=WATSON" alt="User Avatar" class="img-circle"></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">Watson</strong> <small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span></small></div>'+ e +'</div></li>');
			}
										
			$('#id_response').text("Retrieve and Rank complete");
			setStatusMessage('i', "Retrieve and Rank completed");		  
			$('#id_classifications').show();		  
			addHoverAnimations($('.twitclassline'));
      }
    }		
	$('#id_recordButton').show();
	updateScroll();
}

function updateScroll(){
    var element = document.getElementById("chat_body");
    element.scrollTop = element.scrollHeight;
}

/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
function escapeRegexp(s) {
    return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};

function escapeSingleQuote(s) {
    //return String(s).replace(/'/g, "\\'");
	return String(s).replace(/'/g, "");
};

/**
 * Delay for a number of milliseconds
 */
function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
};
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
	// Don't need to do much until the Analyse button is clicked
	// as no data is downloaded nor is the widget created until then.
	// Build the option listeners 
	buildListeners();
});


function buildListeners() {
	// Disable the Analyse button which should only be shown if at least one objective is selected
	$(id_analyse_button).hide();
	setStatusMessage('w', "Please Select at least one objective");
	
	var checkButtons = 	{	'#id_openness_is_objective' : 'o',
							'#id_conscientiousness_is_objective' : 'c',
							'#id_extraversion_is_objective' : 'e',
							'#id_agreeableness_is_objective' : 'a',
							'#id_emotionalrange_is_objective' : 'e'
						};

	for (b in checkButtons) {
	    $(b).change(function() {
			checkForObjectives(checkButtons);
		});
    }	
}


function checkForObjectives(checkButtons) {
	// Check to make sure at least one objective button is checked.
	var ok = false;

	for (b in checkButtons) {
	    if (trueOrFalse($(b))) {
			ok = true;
		}
    }			
	if (ok) {
		setStatusMessage('i', "Click on Analyse to start the process");
		$(id_analyse_button).show();
	} else {
		setStatusMessage('w', "Please Select at least one objective");
		$(id_analyse_button).hide();
	}
}

function trueOrFalse(checkField) {
  return ($(checkField).is(":checked")); 
} 

// *********************************************
// The onAnalyseClick is when the Tradeoff Analysis Widget is created, 
// but first the data that it is needed is fetched from the server.
// *********************************************

function onAnalyseClick(url){
	// The Analyse button has been clicked, store the url so it can be retrieved later
	// Then invoke the Tradeoff Analytics Widget
	$('#id_datastore').data('problemurl', url);	
    $('#id_req_params').hide();	
	
	setStatusMessage('i', "Building the widget");
	
	// if there already is a widget then no need to recreate
	if 	($('#id_datastore').data('tawidget')) {
		onWidgetReady();
	} else {
		taWidgetStuff();	
	}	
}

function taWidgetStuff(){
	// Creating the widget first time in
	setStatusMessage('i', "Creating the tradeoff analytics interface");	
	
	var taClient = new TradeoffAnalytics( {	
											dilemmaServiceUrl: '/watson/taapi', 
											customCssUrl: 'https://ta-cdn.mybluemix.net/v1/modmt/styles/watson.css',
	                                        //iframe: false,											
											profile: 'basic' 
										  }, 'taWidgetContainer'); 
	
	// Store the widget handle so can retrieve later
	$('#id_datastore').data('tawidget', taClient);	
	setStatusMessage('i', "Starting the tradeoff analytics interface");

	taClient.subscribe('afterError', onError);
    taClient.subscribe('doneClicked', onResultSelection);

    var topics = [ 'started', 'problemChanged', 'destroyed', 'doneClicked', 'optionClicked', 'X_finalDecisionChanged',
        'X_favoritesChanged', 'X_selectionChanged', 'X_filterChanged'];
    topics.forEach(function(t){
      taClient.subscribe(t, function (e){
        console.log(JSON.stringify(e));
      });
    });	

	taClient.start(onWidgetReady);	
}

function onResultSelection(event) {
	console.log('Result Selected');
}

function onError(error) {
	// If an error has been detected, then hide the widget, and show the error.
	errorMsg = "Error in Processing";	
	$('#id_responseWidget').hide();	

	if (error) {	
		if (error.responseText) {
			errorMsg = error.responseText;
		} else if (error.errorMessage) {
			errorMsg = error.errorMessage;
		} else {
			try {
				errorMsg = JSON.stringify(error, null, 4);
			}
			catch (e) { // a complex object - can't be converted to json, take it's toString representation
				errorMsg = error.toString();
			}
		}
	}	
	setStatusMessage('d', errorMsg);	
}

function onWidgetReady() {
	// The widget is now ready, so we can fetch the problem for the widget.
	$('#id_req_params').show();	
	$('#id_responseWidget').show();	
	setStatusMessage('d', "Trade-off Analytics Interface is ready - Fetching Problem");
    fetchProblem();	
	
	//taClient.resize(width /* Number */, height /* Number */);
}

function fetchProblem(){	
	// On hindsight it would have been better just to pass to the widget the column data and let the server proxy add
	// in the options, but this code fetches the options from the server, merges in the column data from the client and 
	// sends it to the widget.
	// The url to send this fetch options / problems to should have been stored.
    var url = $('#id_datastore').data('problemurl');		
	setStatusMessage('i', "Requesting problem from the server");
	
    var columnData = buildTARequest(); 
	
	$.ajax({
		type: 'POST',
		url: url,
		data: {"columnData": JSON.stringify(columnData)},
		dataType: 'json',		
		success: taOK,
		error: taNotOK
	});

	setStatusMessage('i', "Waiting for a response from the server");	
}

function buildTARequest() {
  // Only Column data is being built here, Data options will be built on server as part of the request.	
  data = {}

  col_o = {"key": "Openness",
            "full_name" : "BIG5 - Openness",
            "type" : "NUMERIC" ,
            "is_objective" : trueOrFalse('#id_openness_is_objective') ,
            "goal" : $('#id_openness_goal').val()
           };
		   
  col_c = {"key": "Conscientiousness",
            "full_name" : "BIG5 - Conscientiousness",
            "type" : "NUMERIC",
            "is_objective" : trueOrFalse("#id_conscientiousness_is_objective"),
            "goal" : $('#id_conscientiousness_goal').val() 
           };
		   
  col_e = {"key": "Extraversion",
            "full_name" : "BIG5 - Extraversion",
            "type" : "NUMERIC",
            "is_objective" : trueOrFalse("#id_extraversion_is_objective"),
            "goal" : $("#id_extraversion_goal").val()
           };
		   
  col_a = {"key": "Agreeableness",
            "full_name" : "BIG5 - Agreeableness",
            "type" : "NUMERIC",
            "is_objective" : trueOrFalse("#id_agreeableness_is_objective"),
            "goal" : $("#id_agreeableness_goal").val()
           };
		   
  col_r = {"key": "Emotional range",
            "full_name" : "BIG5 - Emotional range",
            "type" : "NUMERIC",
            "is_objective" : trueOrFalse("#id_emotionalrange_is_objective"),
            "goal" : $("#id_emotionalrange_goal").val()
           };
  
  columns = [col_o, col_c, col_e, col_a, col_r]
  data["columns"] = columns   
 
  return data	
}


function taOK(response) {
	// The options data has now been received.
	// Check for errors, if there are none then pass the results to the widget.

	setStatusMessage('i', "Call was good - processing the Results");	
	var results = response['results'];	
	
	if (results) {
	  var errMessage = results['error'];
	  if (errMessage) {
		setStatusMessage('d', errMessage);	
	  }	
	  else {
	  	taClient = $('#id_datastore').data('tawidget');
			
		// Don't really want to do this until we get the response in onResultsReady, but then size of widget is
		// not set properly then, so for now...
		//$('#id_responseWidget').show().width($(window).width());
        taClient.resize();	
		taClient.show(results, onResultsReady);     

       //taClient.resize(width /* Number */, height /* Number */);
		
      }
    }	
}

function taNotOK() {
	// There was a problem in the ajax request 
	setStatusMessage('d', "Tradeoff Analytics request for options failed");	
}	

function onResultsReady() {
	// The response has been received, so the widget is ready to show.
	setStatusMessage('s', "Results from Tradeoff Analytics are ready to show");	

	//$('#id_responseWidget').show().width($(window).width());
	//$('#id_responseWidget').show();
    taClient.resize();	   
	   
	jumpTo('#taWidgetContainer');
}


function jumpTo(h, animate) {
	// Code taken verbatim from the sample to scroll the widget into view when 
	// the results are ready to show.
  if (animate === undefined || animate) {
    $('html, body').animate({
      scrollTop: $(h).offset().top
    }, 500);
  }
  else {
      $(h)[0].scrollIntoView();
    }
}

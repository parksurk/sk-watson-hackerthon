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
// These are a set of utility functions used across the site.
// *********************************************

$(document).ready(function() {
	javascriptCheck();
	modifyPageStyles();
	checkForErrors();
});

function javascriptCheck() {
	// if javascript is enabled on the browser then can remove the warning message
	$('#no-script').remove();
}

function modifyPageStyles() {
	// Make the form controls look a little better than that output by django
	$("table label").addClass('table-labels');
	$("table select").addClass('table-options');
	$("table tbody td").addClass('padded-cell');
	$("#id_credtable th").addClass('credtable-headers');
}

function checkForErrors() {
  var etxt = $('#id_errormessagefromserver').text();
  // not hiding the field as the status message gets overridden by other messages, and the 
  // reason for the error doesn't get seen
  //$('#id_errormessagefromserver').hide();
  setStatusMessage('d', etxt)
}


function setStatusMessage(type, message) {
	// Determine styling for the status message, removing any styles that it doesn't now need
	var options = {'w': 'label-warning', 'i' : 'label-info', 's' : 'label-success', 'd' : 'label-danger'};
	var e = $('#id_response');
	
	e.text(message);		
	e.addClass(options[type]);		
	delete options[type];

	for (o in options) {
		if (e.hasClass(options[o])) {
			e.removeClass(options[o]);
		}
	}	
}
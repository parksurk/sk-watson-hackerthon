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

$(document).ready(function() {
	hideStuff();
	listenStuff();
	ajaxStuff();
});


function hideStuff(){
	$('#id_traits').hide();
}

function listenStuff(){
  $('#id_twittersearch').change(
	function() {
		if ($(this).is(":checked")) {
			$('#id_datarow').slideUp();
			$('#id_personlabel').text('Twitter Handle:');
		}
		else {
			$('#id_datarow').slideDown();
			$('#id_personlabel').text('Personality:');		
		}
	});
}

function ajaxStuff(){
}

function perform_pi(url){	
	var personality = $('#id_personality').val();
	var data = $('#id_data').val();
	var twitSearch = $('#id_twittersearch').is(":checked");

	$.ajax({
		type: 'POST',
		url: url,
		data: {"performTwitterScan": twitSearch,
			   "personality": personality,
		       "data": data},
		dataType: 'json',
		
		success: piOK,
		error: piNotOK
	});
		
    setStatusMessage('i', "Results will go here");
}

function piOK(response) {
	piresponse = JSON.parse('{"data":"the data"}');
	
    setStatusMessage('i', "Call was good - processing the Results");
	
	var results = response['results'];	
	if (results) {
		var errMessage = results['error'];	
		if (errMessage) {
			setStatusMessage('d', errMessage);
		}	
		else {
			var traits = response['traits'];
			if (traits) {
				$('#id_traitstable > tbody').empty();
				for (trait in traits)
				{
					var newRow = '<tr><td>' + trait + '</td><td>' + traits[trait] + '</td></tr>';
					$('#id_traitstable > tbody:last-child').append(newRow);
				}
				setStatusMessage('s', "Personality profile has completed");
				$('#id_traits').show();
			}
		}		
	} 
	else {
		setStatusMessage('d', "No response received from the service");
	}
}

function piNotOK() {
	setStatusMessage('d', "Call was not so good");
}
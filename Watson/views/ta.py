# -*- coding: latin-1 -*-
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

import json
import base64

from django import forms
from django.shortcuts import render
from django.http import HttpResponse

from django.views.decorators.csrf import csrf_exempt

from Watson.models import Big5Traits

from Watson.watsonutils.wdc import WDCService
from Watson.watsonutils.pinsights import Pidata

class Form_ta(forms.Form):
  GOAL_CHOICES = (('MAX', 'MAX'),('MIN', 'MIN'),)
  openness_is_objective = forms.BooleanField(label = "Openness is Objective", required=False)
  openness_goal = forms.ChoiceField(choices=GOAL_CHOICES, label = "Openness goal", required=False)
  
  conscientiousness_is_objective = forms.BooleanField(label = "Conscientiousness is Objective", required=False)
  conscientiousness_goal = forms.ChoiceField(choices=GOAL_CHOICES,label = "Conscientiousness goal", required=False)

  extraversion_is_objective = forms.BooleanField(label = "Extraversion is Objective", required=False)
  extraversion_goal = forms.ChoiceField(choices=GOAL_CHOICES, label = "Extraversion goal", required=False)
  
  agreeableness_is_objective = forms.BooleanField(label = "Agreeableness is Objective", required=False)
  agreeableness_goal = forms.ChoiceField(choices=GOAL_CHOICES, label = "Agreeableness goal", required=False)

  emotionalrange_is_objective = forms.BooleanField(label = "Emotional range is Objective", required=False)
  emotionalrange_goal = forms.ChoiceField(choices=GOAL_CHOICES, label = "Emotional range goal", required=False)
	
def taindex(request):  
  """
     This is the initial (or refresh) page request, not much to do other than send the form 
  """
  wdc = WDCService('TA')
  service_creds = wdc.getCreds()
  
  form = Form_ta()    
  service_creds['form'] = form 
  return render(request, 'Watson/taindex.html', service_creds)
  
@csrf_exempt 
def taproblemreq(request):
  """
     This is the problem request, the column data (via the form) would have been set, and now need to 
	 add in the options.
     NB. The core data is being received as a single string, which needs to be converted via json into a python dictionary
  """
  
  results = {}
  theData = {"error":"No Response as input not deemed valid"}
  
  if request.POST:  
    form = Form_ta(request.POST)

    if form.is_valid():
		  
      if "columnData" in request.POST:
        stringdata = request.POST["columnData"]
        theData = json.loads(stringdata) 
		
        theData["subject"] = "Personality Traits"  		
        theData["options"] = getPIData()	  
        results["results"] = theData
		
  return HttpResponse(json.dumps(results), content_type="application/json") 
  
def getPIData():
  """
     Fetch the Personality Insights data from the database, and build the options. 
	 Values have to be numeric so they can be handled, but had problems with decimals and floats
	 so using integers instead.
  """
  res = []
  personalities = Big5Traits.objects.all()
  for entry in personalities:
    print("Working on entry ", entry)
    option = {"key": entry.id,
	          "name": entry.personality,
	          "values": { "Openness": int(100 * entry.Openness),                   # str(entry.Openness),
	                      "Conscientiousness": int(100 * entry.Conscientiousness), # str(entry.Conscientiousness),
	                      "Extraversion": int(100 * entry.Extraversion),           # str(entry.Extraversion),
	                      "Agreeableness": int(100 * entry.Agreeableness),         #str(entry.Agreeableness),
	                      "Emotional range": int(100 * entry.Emotional_range)      # str(entry.Emotional_range)
	                    }}
    res.append(option)	
  return res

@csrf_exempt 
def taapi(request):
  """
	Acting as a proxy between the Tradeoff Analytics widget and service.
  """
  theData= {}
  theResponse = {"Error":"Request could not be submitted"}
  
  theRequest = json.loads(request.body.decode("utf-8"))
  
  #with open('dumpedrequestjson.txt', 'w') as outfile:
  #  json.dump(theRequest, outfile)
  
  if theRequest:
    wdc = WDCService('TA')
    theResponse = wdc.performOperation(theRequest) 

  if 'error' in theResponse:
    print('Error Detected', theResponse['error'])

  return HttpResponse(json.dumps(theResponse), content_type="application/json") 
  
  

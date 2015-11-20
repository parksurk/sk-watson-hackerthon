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
from Watson.watsonutils.twitservice import TwitterService

class Form_pi(forms.Form):
  personality = forms.CharField()
  data = forms.CharField(required=False)
  performTwitterScan = forms.BooleanField(required=False)
	
def piindex(request):  
  wdc = WDCService('PI')
  service_creds = wdc.getCreds()
  
  form = Form_pi()    
  service_creds['form'] = form 
  return render(request, 'Watson/piindex.html', service_creds)

  
@csrf_exempt 
def pireq(request):
  theData= {}
  
  if request.POST:  
    form = Form_pi(request.POST)
    results = {}
    invalidData = {"error":"No Response as input not deemed valid, personality must be provided"}	
    results["results"] = invalidData
      
    if form.is_valid():
      # Either text has to be provided or looking for Twitter Data.
      personality = form.cleaned_data["personality"]
      data = form.cleaned_data["data"]
      performTwitterScan = form.cleaned_data["performTwitterScan"]
	  
      if not performTwitterScan and 0 == len(data):
        invalidData = {"error":"Must either specify a Twitter Scan or provide data to process"}	
        results["results"] = invalidData       
      else:        	    	  
        theData["personality"] = personality
        theData["data"] = data
        theData["twitterScan"] = performTwitterScan
        results = processPIRequest(request, theData)

  return HttpResponse(json.dumps(results), content_type="application/json") 


def processPIRequest(request, theData):
  results = {}
  data = {}
  errorFound = False
  wdc = WDCService('PI')
  service_creds = wdc.getCreds()
  
  personality = theData["personality"]  
  performTwitterScan = theData["twitterScan"] 

  if performTwitterScan and personality and 0 < len(personality):
    # Data needs to come from twitter
    pulledData = pullTwitterTimeline(personality)
    if "error" in pulledData:
      errorFound = True	
    elif "data" in pulledData:
      data = pulledData["data"]
  else:    
    data = theData["data"].encode('utf8', 'replace')
 
  if not errorFound:  
    results = wdc.performOperation(data)  
    service_creds['results'] = results
    pi = Pidata(results)
	
    keys = pi.big5keys()  
    traits = {}
    for trait in keys:  
      traits[trait] = pi.getTraitValue(trait, False)  

    service_creds["traits"] = traits    
    savePersonality(personality, pi)	  
    results = service_creds	
  else:
    results["results"] = data
 
  return results
  
def pullTwitterTimeline(twitHandle):
  data = {"error" : "Error retrieving Twitter timeline"}	
  tw = TwitterService()
  
  twitTimeLine = tw.getTimeLineFor(twitHandle) 
  if "error" in twitTimeLine:
    data = {"error" : twitTimeLine["error"]}	
  if "tweets" in twitTimeLine:
    data = processTweets(twitTimeLine)
	
  return data
  
def processTweets(timeline):
  tweets = timeline["tweets"]
  tweetData = ""	
  for t in tweets:
    tweetData += t
  data = tweetData.encode('utf8', 'replace')	
  if not data or 0 == len(data):
    data = {"error" : "Error whilst parsing Twitter timeline"}  
  return {"data": data}
  
def savePersonality(personality, pidata): 
  # If there is no big 5 data then no need to save
  if "No value" in pidata.getOpennessValue():
    return
  else:	
    new_traits = Big5Traits(personality=personality,
	                        Openness=pidata.getOpennessValue(),
							Conscientiousness=pidata.getConscientiousnessValue(),
							Extraversion=pidata.getExtraversionValue(),
							Agreeableness=pidata.getAgreeablenessValue(),
							Emotional_range=pidata.getEmotionalrangeValue())
    new_traits.save()
  
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

import os
import json
import requests
import base64

from django import forms
from django.shortcuts import render
from django.shortcuts import redirect
from django.http import HttpResponse

from django.views.decorators.csrf import csrf_exempt

from Watson.watsonutils.wdc import WDCService
from Watson.watsonutils.twitservice import TwitterService

class UploadClassifierForm(forms.Form):
  classInputFile = forms.FileField()
	
def lcindex(request):   
  # These are the views for the Natural Language Classifier portion of the application. 
  # It makes use of both the NLC and a Twitter service, and all calls to the services
  # are done from the client via AJAX calls to REST APIs  
  wdc = WDCService('LC')
  service_creds = wdc.getCreds()  
  nlcService = wdc.nlcService() 
  return render(request, 'Watson/lcindex.html', service_creds)

@csrf_exempt   
def lclist(request):  
  # This is a request for a list of the classifiers available. We expect no input
  # so all the classifiers found are returned.
  results = {}
  theData = {"error":"No Response as list request has failed"} 
 
  wdc = WDCService('LC')
  nlcService = wdc.nlcService()
  if nlcService is not None:
    nlcResults = nlcService.listClassifiers()  
    theData = {"classifiers": nlcResults} 		
 
  results["results"] = theData	
  return HttpResponse(json.dumps(results), content_type="application/json")   
  
def nlcnew(request):
  # This is a call that is not done through REST. Though it should also change to REST.
  # This is the original new classifier request, but has been superseded by nlcnewx method.
  # Will be removed in a future iteration, but is here for reference.
  #
  # The request is for a new classifier. Currently the file chosen is hardcoded and sits in the 
  # static directory. This should be modified to allow a file from the client to be submitted.
  # The return is a redirect back to the classifier list, which forces it to refresh.
  wdc = WDCService('LC')
  data = ""
  module_dir = os.path.dirname(__file__)  
  file_path = os.path.join(module_dir, '../static/', 'nlcsample.json')	

  with open(file_path) as f:
    data = json.loads(f.read())

  nlcService = wdc.nlcService()
  if nlcService is not None:
    nlcResults = nlcService.createClassifier(data)  

  return redirect('watson:nlclassifier')

def nlcnewx(request):
  # This is a call that is not done through REST. 
  # The request is for a new classifier. The file is sent through a form 
  # The return is a redirect back to the classifier list, which forces it to refresh.
  wdc = WDCService('LC')
  service_creds = wdc.getCreds()   

  if request.POST:  
    form = UploadClassifierForm(request.FILES)	
    
    if request.FILES and 'classInputFile' in request.FILES:
      f = request.FILES['classInputFile']	  
	  
      module_dir = os.path.dirname(__file__)  
      file_path = os.path.join(module_dir, '../static/', 'xx.json')		  
      with open(file_path, 'wb+') as destination:
        for chunk in f.chunks():
          destination.write(chunk)	
		  
      destination.close()	  

      with open(file_path) as fj:
        data = json.loads(fj.read())

      wdc = WDCService('LC')
      service_creds = wdc.getCreds() 
      nlcService = wdc.nlcService()
      if nlcService is not None:
        nlcResults = nlcService.createClassifier(data)
        if nlcResults and 'error' in nlcResults:
            service_creds['error'] = nlcResults['description']		
            return render(request, 'Watson/lcindex.html', service_creds)
  
  return redirect('watson:nlclassifier')  
  

@csrf_exempt   
def drop(request):
  # Has we are only allowed 2 classifiers, we added in an option of dropping them to free up
  # resources and to allow us to modify the training.
  # In the input we are expecting a link to the classifier, which will be used to drop it.
  results = {}
  theData = {"error":"No Response as drop request has failed"} 

  if request.POST and "data" in request.POST:
    d = request.POST["data"]
    theRequestData = json.loads(d)
    if theRequestData:
      if "url" in theRequestData:     
        wdc = WDCService('LC')
        nlcService = wdc.nlcService()
        if nlcService is not None:
          classURL = theRequestData["url"]
          nlcResult = nlcService.dropClassifier(classURL)		  
          if "error" in nlcResult:
            theData = {"error": nlcResult["error"]}  		  
          else:			
            theData = {"ok": classURL}  		  
  results["results"] = theData	
  return HttpResponse(json.dumps(results), content_type="application/json")   
  
@csrf_exempt   
def twitsearch(request):
  # This request runs a classification test against a twitter id
  # 20 of the id's last tweets are classified. 
  results = {}
  theData = {"error":"No Response as request has failed"} 
  theRequestData = None  
  
  if request.POST and "data" in request.POST:
    d = request.POST["data"]
    theRequestData = json.loads(d)
   
  if theRequestData:
    if "twitterid" in theRequestData and "classifierurl" in theRequestData:     
      classURL = theRequestData["classifierurl"]
      twitID = theRequestData["twitterid"] 	  
      tw = TwitterService()
  
      twitTimeLine = tw.getTimeLineFor(twitID) 
      theData = {"data": "Will go here"}
      if "error" in twitTimeLine:
        theData = {"error" : twitTimeLine["error"]}	
      if "tweets" in twitTimeLine:
        theData = classifyTweets(classURL, twitTimeLine);

  results["results"] = theData		
  return HttpResponse(json.dumps(results), content_type="application/json") 
  
def classifyTweets(classURL, twitTimeLine):
  # This is an internal helper method that runs a classification on each tweet.
  tweetDataArray = []
  theData = {}
	
  wdc = WDCService('LC')
  nlcService = wdc.nlcService()
  if nlcService is not None:
    tweets = twitTimeLine["tweets"]
    for t in tweets:
      tweetData = {}	
      tweetData["message"] = t
      nlcResult = nlcService.getNLClassification({"text":t,}, classURL)
      if "error" in nlcResult:
        theData = {"error": nlcResult["error"]} 
        break			  
      if "top_class" in nlcResult:
        tweetData["top_class"] = nlcResult["top_class"]
        if "classes" in nlcResult:
          classes = nlcResult["classes"]
          for c in classes:
            if tweetData["top_class"] == c["class_name"]:
              tweetData["confidence"] = c["confidence"]
        tweetDataArray.append(tweetData)
  else:
    theData = {"error": "Natural Language Classifier service not found"} 	
  if "error" not in theData:
    theData = {"classification" : tweetDataArray}	
  return theData	
	
	
class UploadAudioForm(forms.Form):
  file = forms.FileField()  
	
@csrf_exempt  
def staudio(request):
  # This request receives an Audio BLOB file which is passed to the
  # Speech to text service. The response is then forwarded to the 
  # classifier service.
  results = {}
  theData = {"error": "Error detected in REST API"} 	  
  module_dir = os.path.dirname(__file__)  
  if request.POST and request.FILES:  
    
    form = UploadAudioForm(request.POST, request.FILES)    
    # Don't bother checking the form, as it is always invalid
    #if form.is_valid():	
    #  print("Valid Form")  
    #else:
    #   print("Invalid Form")
	
    filename = ""
    classURL = ""
	
    if "fname" in request.POST:
      filename = request.POST["fname"]

    if "classifierurl" in request.POST:
      classURL = request.POST["classifierurl"]
	
    # Saving the file and reading it again, as this ensures that all the data has
    # been received. This gives a better result from the service.	
    f = request.FILES['data']	
    if f:
       file_path = os.path.join(module_dir, '../static/', filename)	
       with open(file_path, 'wb+') as destination:
         for chunk in f.chunks():
           destination.write(chunk)			  
       destination.close()	  	   
	 
    # Remember to switch	 
    yy_file_path = os.path.join(module_dir, '../static/', filename)	
    #yy_file_path = os.path.join(module_dir, '../static/', 'yy.wav')	
    with open(yy_file_path, 'rb') as fj:
      audiodata = fj.read()   
      if audiodata:
        wdc = WDCService('ST')
        service_creds = wdc.getCreds()
        stService = wdc.stService()
        if stService is None:
          theData = {"error": "No Speech to Text service found"} 	  
        else:
          theData = stService.processAudio(audiodata)
          if "results" in theData:
            if list is type(theData["results"]):
              res = theData["results"][0]
              if "alternatives" in res:
                alt = res["alternatives"][0]
                if "transcript" in alt:
                  question = alt["transcript"]
                  # theData = classifyTranscript(classURL, alt["transcript"])
                  data = {"txt": alt["transcript"],
                    "conversation_id": request.POST["conversation_id"],
                    "client_id": request.POST["client_id"],
                    "dialog_id": request.POST["dialog_id"],
                  } 
                  res = sendDialogAPI(request.POST["category"], {'data': json.dumps(data)}) 
                  theData = res['results']  
                  theData['category'] = request.POST["category"]
                  theData['question'] = question
      fj.close()	   
  results["results"] = theData		
  return HttpResponse(json.dumps(results), content_type="application/json") 
  
@csrf_exempt  
def staudio_with_nlc(request):
  # This request receives an Audio BLOB file which is passed to the
  # Speech to text service. The response is then forwarded to the 
  # classifier service.
  results = {}
  theData = {"error": "Error detected in REST API"} 	  
  module_dir = os.path.dirname(__file__)  
  if request.POST and request.FILES:  
    
    form = UploadAudioForm(request.POST, request.FILES)    
    # Don't bother checking the form, as it is always invalid
    #if form.is_valid():	
    #  print("Valid Form")  
    #else:
    #   print("Invalid Form")
	
    filename = ""
    classURL = ""
	
    if "fname" in request.POST:
      filename = request.POST["fname"]

    if "classifierurl" in request.POST:
      classURL = request.POST["classifierurl"]
	
    # Saving the file and reading it again, as this ensures that all the data has
    # been received. This gives a better result from the service.	
    f = request.FILES['data']	
    if f:
       file_path = os.path.join(module_dir, '../static/', filename)	
       with open(file_path, 'wb+') as destination:
         for chunk in f.chunks():
           destination.write(chunk)			  
       destination.close()	  	   
	 
    # Remember to switch	 
    yy_file_path = os.path.join(module_dir, '../static/', filename)	
    #yy_file_path = os.path.join(module_dir, '../static/', 'yy.wav')	
    with open(yy_file_path, 'rb') as fj:
      audiodata = fj.read()   
      if audiodata:
        wdc = WDCService('ST')
        service_creds = wdc.getCreds()
        stService = wdc.stService()
        if stService is None:
          theData = {"error": "No Speech to Text service found"} 	  
        else:
          theData = stService.processAudio(audiodata)
          if "results" in theData:
            if list is type(theData["results"]):
              res = theData["results"][0]
              if "alternatives" in res:
                alt = res["alternatives"][0]
                if "transcript" in alt:
                  question = alt["transcript"]
                  theData = classifyTranscript(classURL, alt["transcript"])
                  data = {"txt": alt["transcript"],
                    "conversation_id":"",
                    "client_id":""
                  }
                  if not 'classification' in theData:
                    raise Exception('Classificatio failed: {}'.format(theData))
                  category = theData["classification"]["top_class"]
                  res = sendDialogAPI(category, {'data': json.dumps(data)}) 
                  theData = res['results']
                  theData['category'] = category
                  theData['question'] = question
                  
      fj.close()	   
  results["results"] = theData		
  return HttpResponse(json.dumps(results), content_type="application/json") 

def sendDialogAPI(classfier, message):
    if classfier == "Accomodations":
        url = "http://jseo-proj-watson.bluemix.net/wl/lang"
    elif classfier == "restaurants":
        url = "http://sc-proj-watson007.mybluemix.net/wl/converse"
    print 'requesting to {} for "{}"'.format(url, message)
    response = requests.post( url ,
                         data = message,
                         )
    try:
      result = json.loads(response.text)
      return result
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)

def classifyTranscript(classURL, transcript):	
  # Runs classification against a transcript
  # The classifier url must be passed in, as it contains the classifier id.
  classifiedData = {}
  classifiedData["message"] = transcript
  theData = {}
	
  wdc = WDCService('LC')
  nlcService = wdc.nlcService()
  if nlcService is not None:
    nlcResult = nlcService.getNLClassification({"text":transcript,}, classURL)
    if "error" in nlcResult:
      theData = {"error": nlcResult["error"]} 
    else:
      if "top_class" in nlcResult:
        classifiedData["top_class"] = nlcResult["top_class"]
        if "classes" in nlcResult:
          classes = nlcResult["classes"]
          for c in classes:
            if classifiedData["top_class"] == c["class_name"]:
              classifiedData["confidence"] = c["confidence"]
  else:
    theData = {"error": "Natural Language Classifier service not found"} 	
  if "error" not in theData:
    theData = {"classification" : classifiedData}	
  return theData	

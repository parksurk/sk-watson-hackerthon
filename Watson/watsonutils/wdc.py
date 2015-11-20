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

import requests
import json
from cognitive.utils.vcap import get_vcap_settings
from .piservice import PersonalityInsightsService
from .taservice import TradeoffAnalyticsService
from .lcservice import NaturalLanguageClassifierService
from .stservice import SpeechToTextService
	
class WDCService(object):
  """
    REST service/app. Front end to the WDC Services
  """

  def __init__(self, wanted_service):
    super(WDCService, self).__init__()  
    self.serviceType = wanted_service.upper()	
    if "PI" == self.serviceType :
      self.service = PersonalityInsightsService("env")  
    elif "TA" == self.serviceType :
      self.service = TradeoffAnalyticsService("env")    	  
    elif "LC" == self.serviceType :
      self.service = NaturalLanguageClassifierService("env")  
    elif "ST" == self.serviceType :
      self.service = SpeechToTextService("env")  		  
	  
  def getCreds(self):
    """ 
      Not exposing the password as that is self contained in the service for use of the service itself
      the creds returned here are for display purposes. 
    """
    try:    
      sCreds = { "url": self.service.getURL(), "username": self.service.getUser()}
    except AttributeError:
      sCreds = { "url": "Not Found", "username": "Not Found"}	
    return sCreds  	
	
  def performOperation(self, text):	
    if "PI" == self.serviceType :
      return self.service.getProfile(text)  
    elif "TA" == self.serviceType :
      return self.service.getTAnalytics(text)  
    elif "LC" == self.serviceType :
      return self.service.getNLClassification(text)  

  def nlcService(self):
    if "LC" == self.serviceType :
      return self.service  
    else :  
      return None 

  def stService(self):
    if "ST" == self.serviceType :
      return self.service  
    else :  
      return None  	 	  
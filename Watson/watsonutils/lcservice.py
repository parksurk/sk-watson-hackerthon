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
from .baseservice import BaseWDCService

class NaturalLanguageClassifierService(BaseWDCService):
  def __init__(self, env):
    super(NaturalLanguageClassifierService, self).__init__(env)  
	
    lc_creds = get_vcap_settings('natural_language_classifier')
    if lc_creds:
      self.url = str(lc_creds['url'])  
      self.user = str(lc_creds['username'])
      self.password = str(lc_creds['password']) 
    else:
      picreds = self.getCreds("LC")
      self.url = picreds["url"]
      self.user = picreds["user"]
      self.password = picreds["password"]
    print('NLC Service has been initialised')

  def dropClassifier(self, classurl):
    if self.url is None:
      raise Exception("No NLC service is bound to this app")
    
    response = requests.delete( classurl, auth=(self.user, self.password) )
    try:
      statusData = json.loads(response.text)
      return statusData
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)	  

	
  def getNLClassification(self, text, classurl):
    """Requests NLC by doing a POST to /v1/.... with text"""

    if self.url is None:
      raise Exception("No NLC service is bound to this app")

    modclassurl = classurl + "/classify"	  
    response = requests.post( modclassurl,
  	                        auth=(self.user, self.password),
                            headers = {"content-type": "application/json"},
                            data=json.dumps(text)  
	                        )
    try:
      statusData = json.loads(response.text)
      return statusData
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)	  
	  
    return {"error": "Classification doing nothing yet"}

  def createClassifier(self, data):
    response = requests.post(self.url + "/v1/classifiers",
                             auth=(self.user, self.password),
                             headers = {"content-type": "application/json"},
                             data=json.dumps(data)  
	                        )
	
    try:
      return json.loads(response.text)
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)

	  
  def listClassifiers(self):
    response = requests.get(self.url + "/v1/classifiers",
                             auth=(self.user, self.password),
                             headers = {"content-type": "application/json"}
	                        )
	
    try:
      classifiersData = json.loads(response.text)

      if 'classifiers' in classifiersData:	  
        classifiers = classifiersData['classifiers']
        if 0 < len(classifiers):
          for item in classifiers:
            status = self.getClassifierStatus(item['url'])
            item["status"] = status		   
      elif 'error' in classifiersData:
        error = classifiersData['error']
	  
      return classifiersData
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)

  def getClassifierStatus(self, url):
    response = requests.get(url,
                            auth=(self.user, self.password),
                            headers = {"content-type": "application/json"}
	                        )
    try:
      statusData = json.loads(response.text)
      return statusData
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)


 	  
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

class PersonalityInsightsService(BaseWDCService):
  def __init__(self, env):
    super(PersonalityInsightsService, self).__init__(env)  
	
    pi_creds = get_vcap_settings('personality_insights')
    if pi_creds:
      self.url = str(pi_creds['url'])  
      self.user = str(pi_creds['username'])
      self.password = str(pi_creds['password']) 
    else:
      picreds = self.getCreds("PI")
      self.url = picreds["url"]
      self.user = picreds["user"]
      self.password = picreds["password"]
	
  def getProfile(self, text):
    """Returns the profile by doing a POST to /v2/profile with text"""

    if self.url is None:
      raise Exception("No Personality Insights service is bound to this app")
 
    print("Invoking Service")	 
    response = requests.post(self.url + "/v2/profile",
                          auth=(self.user, self.password),
                          headers = {"content-type": "text/plain"},
                          data=text
                          )
    print("Service has been called return response")     

    try:
      return json.loads(response.text)
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)
	

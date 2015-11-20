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

class SpeechToTextService(BaseWDCService):
  def __init__(self, env):
    super(SpeechToTextService, self).__init__(env)  
	
    st_creds = get_vcap_settings('speech_to_text')
    if st_creds:
      self.url = str(st_creds['url'])  
      self.user = str(st_creds['username'])
      self.password = str(st_creds['password']) 
    else:
      stcreds = self.getCreds("ST")
      self.url = stcreds["url"]
      self.user = stcreds["user"]
      self.password = stcreds["password"]	
	
  def processAudio(self, audiodata):
    if self.url is None:
      raise Exception("No ST service is bound to this app")
	  
    response = requests.post( self.url + "/v1/recognize",
                             auth=(self.user, self.password),
                             headers = {"content-type": "audio/wav"},
                             data = audiodata,
                             params= {"continuous": "true"} )		  
    try:
      return json.loads(response.text)
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)	
	
	
	

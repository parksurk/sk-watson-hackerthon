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

import logging
import requests
import json
from cognitive.utils.vcap import get_vcap_settings
from .creds import CredentialStore

logger = logging.getLogger(__name__)

class BaseWDCService(object):
  def __init__(self, env):
    super(BaseWDCService, self).__init__()  

    self.url = "<url>"
    self.username = "<username>"
    self.password = "<password>"	
	
    self.credStore = CredentialStore()
	
    print("Setting up Base Object for Service")
   
  def getURL(self):
    return self.url

  def getUser(self):
    return self.user

  def getCreds(self, service):
    return self.credStore.getCreds(service) 
	

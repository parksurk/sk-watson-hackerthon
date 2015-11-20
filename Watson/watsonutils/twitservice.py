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

#import base64, urllib3, json
import base64, json
import requests

# Really wanted to use the poolmanager, but was unable to get it to work
#manager = urllib3.PoolManager()
from .baseservice import BaseWDCService
	
class TwitterService(BaseWDCService):
  """
    REST service/app. Front end to the Twitter Services
  """
  
  def __init__(self):
    super(TwitterService, self).__init__("env") 
    self.accessToken = None	
	      
    picreds = self.getCreds("TW")
    self.consumerKey = picreds["consumerKey"]
    self.consumerSecret = picreds["consumerSecret"]
	
    keySecret = "%s:%s" % (self.consumerKey,self.consumerSecret)
    self.encodedKeySecret = base64.b64encode(keySecret.encode('ascii'))
	
    self.oauth_url = 'https://api.twitter.com/oauth2/token'	
    self.http_headers = {'Authorization': "Basic %s" % self.encodedKeySecret, 
	                     'Content-Type': 'application/x-www-form-urlencoded'} 
    self.request_body = "grant_type=client_credentials" 

  def getAppToken(self):	
    response = requests.post(self.oauth_url,
                          auth=(self.consumerKey, self.consumerSecret),
                          headers = {"content-type": "application/json",
                                     "grant_type" : "client_credentials"},
                          params = self.request_body
                          )						  
						  
    try:
      retData = json.loads(response.text)
      self.accessToken = retData['access_token']
      return retData	  
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)
   	
	
  def getTimeLineFor(self, tagid):
    self.getAppToken()   	
    url = "https://api.twitter.com/1.1/statuses/user_timeline.json?count=20&include_rts=false&screen_name=%s" % tagid

    response = requests.get(url,
                          headers = {'Authorization': 'Bearer %s' % self.accessToken,
                                     "content-type": "application/json"}
                          )						  
    if response.text:
      try:
        tweets = []
        retData = json.loads(response.text)
        if "errors" in retData:
          errors = retData["errors"]
          e = errors[0]
          return {"error": "Twitter Error - " + e['message']}
        for e in retData:
          retweet = e["retweeted"]
          if not retweet:
            txt = e["text"]
            tweets.append(txt)			
        return {"tweets": tweets}	  
      except Exception as ex:
        template = "An exception of type {0} occured "	
        message = template.format(type(ex).__name__)
        return {"error": "Error Parsing the response from Twitter"}
    return {"error":"Unable to process twitter request"}	
	
import requests
import json
from cognitive.utils.vcap import get_vcap_settings
from .baseservice import BaseWDCService

class TradeoffAnalyticsService(BaseWDCService):
  def __init__(self, env):
    super(TradeoffAnalyticsService, self).__init__(env)  
	
    ta_creds = get_vcap_settings('tradeoff_analytics')
    if ta_creds:
      self.url = str(ta_creds['url'])  
      self.user = str(ta_creds['username'])
      self.password = str(ta_creds['password']) 
    else:
      picreds = self.getCreds("TA")
      self.url = picreds["url"]
      self.user = picreds["user"]
      self.password = picreds["password"]
	
  def getTAnalytics(self, text):
    """Requests Tradeof Analytics by doing a POST to /v1/.... with text"""

    if self.url is None:
      raise Exception("No Trande of Analytics service is bound to this app")
 
    reqAsJson = json.dumps(text)
    response = requests.post(self.url + "/v1/dilemmas",
                          auth=(self.user, self.password),
                          headers = {"content-type": "application/json"},
                          data=json.dumps(text)  ,
						  params= {"generate_visualization": "true"}
                          )
    try:
      return json.loads(response.text)
    except:
      raise Exception("Error processing the request, HTTP: %d" % response.status_code)
   	
	

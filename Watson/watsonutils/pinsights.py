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

class Pidata(object):
  def __init__(self, insights):
    self.insights = insights
    self.big5 = {}
    self.processed = False	
  
  def floored_percentage(self, val, digits=2):
    """ Number comes in a 0.45678912 and will be converted 
	    1st to 0.4568 
		then to 45.68 
		finally to a string """
    val = round(val, 2 + digits)  
    val *= 100 
    return '%.2f' % val	

  def processData(self): 
    if self.insights:
      if "tree" in self.insights:	
        coredata = self.insights["tree"]["children"][0]
        big5data = coredata['children'][0]['children']		
        for xx in big5data:
          self.big5[xx["name"]] = self.floored_percentage(xx["percentage"])
    self.processed = True	

  def getData(self, trait, withsymbol):
    response =  "No value found for %s " % trait  
    if trait and trait in self.big5:
      response = self.big5[trait]	
      if withsymbol:
        response += '%'	
    return response	  
	
  def getTraitValue(self, trait, withsymbol=True):
    summaryTxt = "No value found for %s " % trait
    if self.insights:
      if not self.processed:
        self.processData() 	  
      summaryTxt = self.getData(trait,withsymbol)	  
    return summaryTxt 

  def getOpennessValue(self):
    return self.getTraitValue("Openness", False)  

  def getConscientiousnessValue(self):
    return self.getTraitValue("Conscientiousness", False)  

  def getExtraversionValue(self):
    return self.getTraitValue("Extraversion", False)  

  def getAgreeablenessValue(self):
    return self.getTraitValue("Agreeableness", False)  

  def getEmotionalrangeValue(self):
    return self.getTraitValue("Emotional range", False)  	
	
  def big5keys(self):
    return ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Emotional range']	  
	

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

# sk-watson-hackerthon

This is a sample python application created by IBM Betaworks to 
show how a sample set of the Watson APIs can be used.

To run locally 
python manage.py runserver --settings=cognitive.settings.local

To run on bluemix
python manage.py runserver --settings=cognitive.settings.bluemix

On bluemix for the initial database set-up modify the manfiest to 
  command: bash ./runinitial.sh
you will need to modify runinitial.sh to your own db admin credentials  
for subsequent pushes revert to 
  command: bash ./run.sh

On bluemix the application needs the following services (edit the manifest.yml file to match the 
instance names for your environment

1. postgresql
2. personality insights
3. tradeoff analytics
4. natural language classifier
5. speech to text 

If running outside of bluemix then the application needs access to service credentials. 
Put Service credentials into a file credentials.json in the Watson\static\ directory, in the form:
{
    "PI": 
	    {
	       "url":"https://gateway.watsonplatform.net/personality-insights/api",
	       "user":"<user - from bluemix services for personality insights>",
		   "password":"<password - from bluemix services for personality insights>"
	    },
    "TA": 
	    {
	       "url":"https://gateway.watsonplatform.net/tradeoff-analytics/api",
	       "user":"<user - from bluemix services for tradeoff analytics>",
		   "password":"<password - from bluemix services for tradeoff analytics>"
	    },
    "LC": 		
		{
            "url": "https://gateway.watsonplatform.net/natural-language-classifier-beta/api",
            "user": "<user - from bluemix services for natural language classifier>",
            "password": "<password - from bluemix services for natural language classifier>"
        },
    "ST": 		
		{
            "url": "https://stream.watsonplatform.net/speech-to-text/api",
            "user": "<user - from bluemix services for speech to text>",
            "password": "<password - from bluemix services for speech to text>"
        },
    "TW": 		
		{
            "consumerKey": "<from twitter>",
            "consumerSecret": "<from twitter>"
        }		
}
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

from django.conf.urls import patterns, include, url
from .views import pi
from .views import ta
from .views import lc
from .views.IndexView import BFIndexView
from .views.DetailView import BFDetailView

urlpatterns = patterns('',
    url(r'^$', BFIndexView.as_view(), name='personalities'),
    url(r'^(?P<pk>\d+)/$', BFDetailView.as_view(), name='detail'),
	
    url(r'^pi$', pi.piindex, name='pinsights'),	
    url(r'^pireq$', pi.pireq, name='piapi'),

    url(r'^ta$', ta.taindex, name='tanalytics'),	
    url(r'^tareq$', ta.taproblemreq, name='taproblemapi'),	
    url(r'^taapi$', ta.taapi, name='taapi'),

    url(r'^lc$', lc.lcindex, name='nlclassifier'),	
    url(r'^lclist$', lc.lclist, name='nllist'),	
    url(r'^nlccreate$', lc.nlcnew, name='newclassifier'),	
    url(r'^nlccreatex$', lc.nlcnewx, name='newclassifierx'),	 
	url(r'^lctwitsearch$', lc.twitsearch, name='nltwitsearch'),
	url(r'^lcdrop', lc.drop, name='nldrop'),
	
    url(r'^staudio$', lc.staudio, name='audiosample'),		
)
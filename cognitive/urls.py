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
from django.contrib import admin
from Watson import views

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'cognitive.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    
    url(r'^$', 'Watson.views.rootindex.page', name='rootindex'),	
    url(r'^watson/', include('Watson.urls', namespace="watson")),
    url(r'^admin/', include(admin.site.urls)),
)

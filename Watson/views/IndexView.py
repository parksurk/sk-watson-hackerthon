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

from django.views import generic
from Watson.models import Big5Traits

class BFIndexView(generic.ListView):
  template_name = 'Watson/index.html'
  model = Big5Traits
  context_object_name = 'plist'
  
  def get_queryset(self):
    """Sort the traits by the personality field"""
    return Big5Traits.objects.all().order_by("personality") 
    # If you want to add paging then you would fetch only the first xx (10)
    # return Big5Traits.objects.all().order_by("personality")[:10] 

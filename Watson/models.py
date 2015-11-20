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

from django.db import models

# Create your models here.
class Big5Traits(models.Model):
  personality = models.CharField(max_length=200)
  Openness = models.DecimalField(max_digits=5, decimal_places=2)
  Conscientiousness = models.DecimalField(max_digits=5, decimal_places=2)
  Extraversion = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
  Agreeableness = models.DecimalField(max_digits=5, decimal_places=2)
  Emotional_range = models.DecimalField(max_digits=5, decimal_places=2)

  def __str__(self):
    return self.personality

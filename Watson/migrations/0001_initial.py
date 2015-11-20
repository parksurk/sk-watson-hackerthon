# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Big5Traits',
            fields=[
                ('id', models.AutoField(primary_key=True, auto_created=True, serialize=False, verbose_name='ID')),
                ('personality', models.CharField(max_length=200)),
                ('Openness', models.DecimalField(decimal_places=2, max_digits=5)),
                ('Conscientiousness', models.DecimalField(decimal_places=2, max_digits=5)),
                ('Extraversion', models.DecimalField(default=0.0, decimal_places=2, max_digits=5)),
                ('Agreeableness', models.DecimalField(decimal_places=2, max_digits=5)),
                ('Emotional_range', models.DecimalField(decimal_places=2, max_digits=5)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]

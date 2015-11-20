#!/bin/bash
if [ -z "$VCAP_APP_PORT" ];
then SERVER_PORT=80;
else SERVER_PORT="$VCAP_APP_PORT";
fi
echo port is $SERVER_PORT
python manage.py makemigrations --settings=cognitive.settings.bluemix
python manage.py migrate --settings=cognitive.settings.bluemix
echo "from django.contrib.auth.models import User; User.objects.create_superuser(username='admin',password='admin',email='parksurk@gmail.com')" | python manage.py shell --settings=cognitive.settings.bluemix

echo [$0] Starting Django Server...
python manage.py runserver 0.0.0.0:$SERVER_PORT --noreload --settings=cognitive.settings.bluemix

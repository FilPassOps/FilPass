#!/bin/bash
echo setting up environment
EB_ENV=`/opt/elasticbeanstalk/bin/get-config container -k environment_name`
ENV_FILE=".env"
cp ${EB_ENV}.env $ENV_FILE
aws secretsmanager get-secret-value --secret-id $EB_ENV --region us-east-2 | jq -r '.SecretString' | jq -r 'to_entries | .[] | "\(.key)=\"\(.value)\""' >> $ENV_FILE
echo ENV SETUP DONE
#!/bin/bash

# Compile the stylesheet
carto -q /openstreetmap-carto/project.mml > /openstreetmap-carto/mapnik.xml

# Change threads in renderd.conf
sed -i -E "s/num_threads=[0-9]+/num_threads=${THREADS:-4}/g" /etc/renderd.conf

# Start the renderd service
service apache2 restart
renderd -f -c /etc/renderd.conf &
child=$!
wait "$child"
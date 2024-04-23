#!/bin/bash

echo "Waiting for db to initialize..."
message=$(nc -lp 1234 -q 0)
echo "Received message: $message"

echo "Starting apache2 and renderd"
service apache2 restart
G_MESSAGES_DEBUG=info renderd > /var/log/renderd.log 2>&1 &
tail -F /var/log/renderd.log /var/log/apache2/access.log /var/log/apache2/error.log &
pid=${!}

# render_list_geo.pl -t "memcached://tile-cache:11211" -x -77.55 -X -71.06 -y 40.31 -Y 44.2 -z 10 -Z 20 -n 4

wait $pid
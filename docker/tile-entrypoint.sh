#!/bin/bash

echo "Starting apache2 and renderd"
service apache2 restart
G_MESSAGES_DEBUG=all renderd -f &
# tail -F /var/log/renderd.log /var/log/apache2/access.log /var/log/apache2/error.log &
pid=${!}

# render_list_geo.pl -t "memcached://tile-cache:11211" -x -77.55 -X -71.06 -y 40.31 -Y 44.2 -z 0 -Z 13 -n 4

wait $pid
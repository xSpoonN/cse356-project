#!/bin/bash

set -e

DB_HOST=$1
TILE_HOST=$2

java -jar ./fdt.jar -ss 1M -P 10 -r -c $DB_HOST ../../backup/ -d /

ssh -i cse356 root@$DB_HOST 'docker container run --name db -p 5432:5432 -v osm-data:/var/lib/postgresql/14/main -v /backup:/backup --tmpfs /dev/shm:size=2048000000 -d ktao87/cse356:db'

java -jar ./fdt.jar -ss 1M -P 10 -c $TILE_HOST ../../tile-server-cache.tar.gz -d /var/cache/tiles/

ssh -i cse356 root@$TILE_HOST 'tar -xvf /var/cache/tiles/tile-server-cache.tar.gz -C /var/cache/tiles && mv /var/cache/tiles/data/default /var/cache/tiles/default && rmdir /var/cache/tiles/data && touch -d "1 Jan" /var/cache/tiles/default/planet-import-complete'

# Try to connect to the database
while ! docker container run --rm -e PGPASSWORD=mysecretpassword postgres:14-bullseye psql -h $DB_HOST -U postgres -d gis -c "SELECT 1" > /dev/null; do
  sleep 60
done

ssh -i cse356 root@$DB_HOST 'docker container rm -f db'

echo "EVERYTHING IS READY. CREATE MORE SERVERS AND CONTINUE TO DEPLOY THE SERVICE by running -- ansible-playbook -i ./inventory.ini ./deploy.yml!"
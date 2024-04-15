#!/bin/bash

OSM_FILE=/var/lib/postgresql/14/main/new-york.osm.pbf

startService() {
    tail -Fv /var/log/postgresql/postgresql-14-main.log &
    tailpid=${!}

    trap "kill $tailpid && service postgresql stop" SIGINT SIGTERM
    wait
}

#####################################POSTGRES#####################################
if [ ! -f /var/lib/postgresql/14/data/PG_VERSION ]; then
    chown postgres /var/lib/postgresql/14/main
    sudo -u postgres /usr/lib/postgresql/14/bin/initdb -D /var/lib/postgresql/14/main
fi 

sudo service postgresql start

# Create user
sudo -E -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'mysecretpassword'"
sudo -E -u postgres createuser -SDR www-data

# Create database
sudo -E -u postgres psql -c "CREATE DATABASE gis ENCODING 'UTF8'"

# Create extensions
sudo -E -u postgres psql -d gis -c "CREATE EXTENSION postgis"
sudo -E -u postgres psql -d gis -c "CREATE EXTENSION hstore"
sudo -E -u postgres psql -d gis -c 'CREATE EXTENSION pgrouting;'

if [ ! -f /var/lib/postgresql/14/main/entrypoint-complete ]; then
    # Check if gis dump file exists
    if [ -f /data/backup/osm-db.gzip ]; then
        echo 'gis Dump file found.'
        # Restore dump file
        gunzip -c /data/backup/osm-db.gzip | sudo -u postgres pg_restore -d gis

        touch /var/lib/postgresql/14/main/tileserver-import-complete
        touch /var/lib/postgresql/14/main/routing-import-complete
    fi

    # Check if nominatim dump file exists
    if [ -f /data/backup/nominatim-db.gzip ]; then
        echo 'Nominatim Dump file found.'
        # Restore dump file
        gunzip -c /data/backup/nominatim-db.gzip | sudo -u postgres pg_restore -d nominatim

        touch /var/lib/postgresql/14/main/nominatim-import-complete
    fi

    wget -nv https://grading.cse356.compas.cs.stonybrook.edu/data/new-york.osm.pbf -O $OSM_FILE

    #####################################TILE-SERVER#####################################

    if [ ! -f /var/lib/postgresql/14/main/tileserver-import-complete ]; then
        echo 'Tile server data not imported yet. Try importing...'

        chown -R postgres:postgres /openstreetmap-carto
        chmod -R u+rwX /Nominatim-4.4.0
        # Install external data
        cd /openstreetmap-carto && sudo -E -u postgres python3 scripts/get-external-data.py -d gis

        # Import data
        sudo -E -u postgres osm2pgsql -d gis --create --slim -G --hstore --tag-transform-script /openstreetmap-carto/openstreetmap-carto.lua -C 2500 --number-processes 4 -S /openstreetmap-carto/openstreetmap-carto.style $OSM_FILE

        # Create indexes
        sudo -E -u postgres psql -d gis -f /openstreetmap-carto/indexes.sql

        touch /var/lib/postgresql/14/main/tileserver-import-complete
        echo "Finish importing tile-server data."
    fi

    #####################################SEARCH-SERVER#####################################
    if [ ! -f /var/lib/postgresql/14/main/nominatim-import-complete ]; then
        echo 'Nominatim data not imported yet. Try importing...'

        export NOMINATIM_DATABASE_DSN="pgsql:host=127.0.0.1;port=5432;dbname=nominatim;user=postgres;password=mysecretpassword"

        chown -R postgres:postgres /Nominatim-4.4.0
        chmod -R u+rwX /Nominatim-4.4.0
        cd /Nominatim-4.4.0 && NOMINATIM_TOKENIZER=icu sudo -E -u postgres nominatim import --osm-file $OSM_FILE --threads 4
        nominatim index --threads 4
        nominatim admin --check-database
        nominatim admin --warm

        export NOMINATIM_QUERY_TIMEOUT=10
        export NOMINATIM_REQUEST_TIMEOUT=60

        touch /var/lib/postgresql/14/main/nominatim-import-complete
        echo "Finish importing search-server data."
    fi

    #####################################ROUTING-SERVER#####################################

    # Check if data is imported
    if [ ! -f /var/lib/postgresql/14/main/routing-import-complete ]; then
        echo 'Routing data not imported yet. Try importing...'

        # osm2po command to convert and generate SQL file
        java -Xms2G -Xmx2G -jar /osm2po/osm2po-core-5.5.11-signed.jar cmd=c prefix=us_northeast workDir=/var/lib/postgresql/14/main/osm2po $OSM_FILE
        
        # Importing generated SQL files into the PostgreSQL database
        sudo -E -u postgres psql -d gis -f /var/lib/postgresql/14/main/osm2po/us_northeast_2po_4pgr.sql
        
        if [ $? -ne 0 ]; then
            echo 'Failed to import data.'
            rm -r /var/lib/postgresql/14/main/osm2po
            exit 1
        fi
        
        # Marking import as complete
        touch /var/lib/postgresql/14/main/routing-import-complete
        
        # Cleanup
        rm -r /var/lib/postgresql/14/main/osm2po

        touch /var/lib/postgresql/14/main/routing-import-complete
        echo "Finish importing routing data."
    fi
fi

rm -r /data/backup
rm $OSM_FILE
touch /var/lib/postgresql/14/main/entrypoint-complete
startService
#!/bin/bash

OSM_FILE=/var/lib/postgresql/14/main/new-york.osm.pbf

initializeDatabase() {
    if [ ! -f /var/lib/postgresql/14/main/entrypoint-complete ]; then
        rm -rf /var/lib/postgresql/14/main/*
        locale-gen en_US.UTF-8
        chown postgres /var/lib/postgresql/14/main
        sudo -u postgres /usr/lib/postgresql/14/bin/initdb -E 'UTF-8' --lc-collate='en_US.UTF-8' --lc-ctype='en_US.UTF-8' -D /var/lib/postgresql/14/main
    fi 

    sudo service postgresql start

    # turn off JIT for memory leak in renderd
    echo "ALTER SYSTEM SET jit=off; SELECT pg_reload_conf();" | sudo -u postgres psql

    # Create user
    sudo -E -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'mysecretpassword'"
    sudo -E -u postgres createuser -SDR www-data

    # Create database
    sudo -E -u postgres psql -c "CREATE DATABASE gis ENCODING 'UTF8'"

    # Create extensions
    sudo -E -u postgres psql -d gis -c "CREATE EXTENSION postgis"
    sudo -E -u postgres psql -d gis -c "CREATE EXTENSION hstore"
    sudo -E -u postgres psql -d gis -c 'CREATE EXTENSION pgrouting;'
}

restoreBackups() {
    echo 'Dump file found. Restoring db...'
    # Restore GIS dump file
    gzip -dc /backup/gis.gz | sudo -u postgres pg_restore -d gis &
    pid_gis=$!  # Capture PID of the GIS background process

    # Restore Nominatim dump file
    export NOMINATIM_DATABASE_DSN="pgsql:host=127.0.0.1;port=5432;dbname=nominatim;user=postgres;password=mysecretpassword"
    sudo -E -u postgres psql -c "CREATE DATABASE nominatim ENCODING 'UTF8'"
    gzip -dc /backup/nominatim.gz | sudo -u postgres pg_restore -d nominatim &
    pid_nominatim=$!  # Capture PID of the Nominatim background process

    # Wait for all background processes and check their exit statuses
    fail=0
    wait $pid_gis || fail=1
    wait $pid_nominatim || fail=1

    if [ $fail -ne 0 ]; then
        echo "An error occurred while restoring one or more databases."
        exit 1
    fi

    touch /var/lib/postgresql/14/main/tileserver-import-complete
    touch /var/lib/postgresql/14/main/routing-import-complete
    touch /var/lib/postgresql/14/main/nominatim-import-complete
    touch /var/lib/postgresql/14/main/entrypoint-complete
    echo 'Successfully restored all dbs...'
}

importData() {
    wget -nv https://grading.cse356.compas.cs.stonybrook.edu/data/new-york.osm.pbf -O $OSM_FILE

    importTileServerData
    importSearchServerData
    importRoutingData

    # Check if all import-complete files exist
    if [[ -f /var/lib/postgresql/14/main/tile-import-complete && \
          -f /var/lib/postgresql/14/main/routing-import-complete && \
          -f /var/lib/postgresql/14/main/search-import-complete ]]; then
        touch /var/lib/postgresql/14/main/entrypoint-complete
        echo "All data imported successfully, entrypoint-complete touched."
    else
        echo "Error: Not all data was imported successfully."
    fi
}

importTileServerData() {
    if [ ! -f /var/lib/postgresql/14/main/tileserver-import-complete ]; then
        echo 'Tile server data not imported yet. Try importing...'
        chown -R postgres:postgres /openstreetmap-carto
        chmod -R u+rwX /openstreetmap-carto
        cd /openstreetmap-carto && sudo -E -u postgres python3 scripts/get-external-data.py -d gis
        sudo -E -u postgres osm2pgsql -d gis --create --slim -G --hstore --tag-transform-script /openstreetmap-carto/openstreetmap-carto.lua -C 2500 --number-processes 4 -S /openstreetmap-carto/openstreetmap-carto.style $OSM_FILE
        sudo -E -u postgres psql -d gis -f /openstreetmap-carto/indexes.sql

        if [ $? -ne 0 ]; then
            echo 'Failed to import tile data.'
            exit 1
        fi

        touch /var/lib/postgresql/14/main/tileserver-import-complete
        echo "Finish importing tile-server data."
    fi
}

importSearchServerData() {
    if [ ! -f /var/lib/postgresql/14/main/nominatim-import-complete ]; then
        echo 'Nominatim data not imported yet. Try importing...'
        export NOMINATIM_DATABASE_DSN="pgsql:host=127.0.0.1;port=5432;dbname=nominatim;user=postgres;password=mysecretpassword"
        chown -R postgres:postgres /Nominatim-4.4.0
        chmod -R u+rwX /Nominatim-4.4.0
        cd /Nominatim-4.4.0 && NOMINATIM_TOKENIZER=icu sudo -E -u postgres nominatim import --osm-file $OSM_FILE --threads 4
        
        if [ $? -ne 0 ]; then
            echo 'Failed to import search data.'
            exit 1
        fi

        nominatim index --threads 4
        nominatim admin --check-database
        nominatim admin --warm
        touch /var/lib/postgresql/14/main/nominatim-import-complete
        echo "Finish importing search-server data."
    fi
}

importRoutingData() {
    if [ ! -f /var/lib/postgresql/14/main/routing-import-complete ]; then
        echo 'Routing data not imported yet. Try importing...'
        java -Xms2G -Xmx2G -jar /osm2po/osm2po-core-5.5.11-signed.jar cmd=c prefix=us_northeast workDir=/var/lib/postgresql/14/main/osm2po $OSM_FILE
        sudo -E -u postgres psql -d gis -f /var/lib/postgresql/14/main/osm2po/us_northeast_2po_4pgr.sql
        
        if [ $? -ne 0 ]; then
            echo 'Failed to import data.'
            rm -r /var/lib/postgresql/14/main/osm2po
            exit 1
        fi

        touch /var/lib/postgresql/14/main/routing-import-complete
        rm -r /var/lib/postgresql/14/main/osm2po
        echo "Finish importing routing data."
    fi
}

startService() {
    nominatim admin --check-database
    nominatim admin --warm
    export NOMINATIM_QUERY_TIMEOUT=10
    export NOMINATIM_REQUEST_TIMEOUT=60

    tail -Fv /var/log/postgresql/postgresql-14-main.log &
    tailpid=${!}

    trap "kill $tailpid && service postgresql stop" SIGINT SIGTERM
    wait
}

cleanUp() {
    rm -r /data/backup
    rm $OSM_FILE
}

initializeDatabase
if [ ! -f /var/lib/postgresql/14/main/entrypoint-complete ]; then
    if [ ! -f /backup/backup-complete ]; then
        importData
    else
        restoreBackups
    fi
fi
cleanUp
startService
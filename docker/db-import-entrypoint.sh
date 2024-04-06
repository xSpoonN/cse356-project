#!/bin/bash

# Check if data is imported
if [ ! -f /data/import-complete ]; then
    echo 'Data not imported yet. Try importing...'

    # Checking if the OSM PBF file is already downloaded
    if [ -f /data/us-northeast.osm.pbf ]; then
        echo 'Data already downloaded.'
    else
        echo 'Data not downloaded yet. Downloading data...'
        wget https://grading.cse356.compas.cs.stonybrook.edu/data/us-northeast.osm.pbf -O /data/us-northeast.osm.pbf
    fi
    
    # Create pgrouting extension
    PGPASSWORD=mysecretpassword psql -h pgrouting -d routing -U postgres -c 'CREATE EXTENSION postgis;'
    PGPASSWORD=mysecretpassword psql -h pgrouting -d routing -U postgres -c 'CREATE EXTENSION pgrouting;'

    # osm2po command to convert and generate SQL file
    java -Xms2G -Xmx2G -jar /osm2po/osm2po-core-5.5.11-signed.jar cmd=c prefix=us_northeast workDir=/data/osm2po /data/us-northeast.osm.pbf
    
    # Importing generated SQL files into the PostgreSQL database
    PGPASSWORD=mysecretpassword psql -h pgrouting -d routing -U postgres -f /data/osm2po/us_northeast_2po_4pgr.sql
    
    if [ $? -ne 0 ]; then
        echo 'Failed to import data.'
        rm -r /data/osm2po
        exit 1
    fi
    
    # Marking import as complete
    touch /data/import-complete
    
    # Cleanup
    rm -r /data/osm2po

    echo 'Import complete.'
else
    echo 'Data already imported.'
fi

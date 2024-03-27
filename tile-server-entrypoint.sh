#!/bin/bash

# Path to the file
FILE="/data/database/planet-import-complete"

# Check if the file exists
if [ -f "$FILE" ]; then
    echo "The volume is already initialized. Skipping the import."
else
    echo "The volume is not initialized. Importing the planet file."
    /run.sh import
fi

/run.sh run
## TODO

- [x] CI/CD
- [x] Create a script to store `.osm.pbf` file to Postgres (use `osm2pg`)
- [x] Setup logger (fluentd) 

## Development

1. install `new-york.osm.pbf` file from `https://grading.cse356.compas.cs.stonybrook.edu/data/new-york.osm.pbf` and place into script/osm2pgsql
2. `cd` into script/osm2pgsql and run `docker compose up` (this will generate PostGIS data into data/ folder - will take some time)
3. run `docker compose up` in the root directory

## Setting up new VM
1. copy IP address of the new VM
2. `cd` into script/provisioning
3. change `ansible_host` to new IP address
4. run `ansible-playbook -i inventory.ini new-vm-setup.yml` 
## TODO

- [x] CI/CD
- [x] Create a script to store `.osm.pbf` file to Postgres (use `osm2pg`)
- [x] Setup logger (fluentd) 

## Development

1. run `docker volume create osm-data && docker run -v '/absolute/path/to/new-york.osm.pbf:/data/region.osm.pbf' -v osm-data:/data/database overv/openstreetmap-tile-server import` (https://github.com/Overv/openstreetmap-tile-server)
2. run `docker compose up` in the root directory

## Setting up new VM
1. copy IP address of the new VM
2. `cd` into script/provisioning
3. change `ansible_host` to new IP address
4. run `ansible-playbook -i inventory.ini new-vm-setup.yml` 

```
CSE356_project
├─ .github
│  └─ workflows
│     └─ main.yml
├─ .gitignore
├─ .prettierrc
├─ app
│  ├─ api
│  │  └─ search
│  │     └─ route.js
│  ├─ components
│  │  └─ Map.jsx
│  ├─ globals.css
│  ├─ layout.js
│  ├─ lib
│  │  └─ db.js
│  └─ page.js
├─ docker-compose.prod.yml
├─ docker-compose.yml
├─ Dockerfile.dev
├─ Dockerfile.prod
├─ fluent.conf
├─ fluentd.Dockerfile
├─ jsconfig.json
├─ new-york.osm.pbf
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  └─ tmp.txt
├─ README.md
├─ script
│  └─ provisioning
│     ├─ cse356
│     ├─ github
│     ├─ github.pub
│     ├─ inventory.ini
│     └─ new-vm-setup.yml
└─ tailwind.config.js
```
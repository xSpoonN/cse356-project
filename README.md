## Development
run `docker compose up` in the root directory

## Setting up new VM
1. Create 1 machine with 1 core 1gb memory and 2 machines with 2 core 4gb memory
2. Write 1gb memory machine's ip address to manager and 4gb memory machine's ip address as workers in `inventory.ini`
4. `cd` into script/provisioning
5. run `ansible-playbook -i inventory.ini deploy.yml`
6. ssh into mananger node and change the endpoint specified in `Map.jsx`
7. Run `docker compose -f /root/project/docker-compose.prod.yml build`
8. Run `docker compose -f /root/project/docker-compose.prod.yml push`
9. Run `docker stack deploy -c /root/project/docker-compose.prod.yml milestone_1 --detach=true`

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
│  ├─ convert
│  │  └─ route.js
│  ├─ globals.css
│  ├─ layout.js
│  ├─ lib
│  │  └─ db.js
│  ├─ page.js
│  └─ tiles
│     └─ [layer]
│        └─ [v]
│           └─ [h]
│              └─ route.js
├─ docker-compose.prod.yml
├─ docker-compose.yml
├─ Dockerfile.dev
├─ Dockerfile.prod
├─ fluent.conf
├─ fluentd.Dockerfile
├─ jsconfig.json
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  └─ tmp.txt
├─ README.md
├─ script
│  ├─ osm2pgsql
│  └─ provisioning
│     ├─ cse356
│     ├─ github
│     ├─ github.pub
│     ├─ inventory.ini
│     └─ new-vm-setup.yml
└─ tailwind.config.js
```
## Development
run `docker compose up` in the root directory

## Notes
Make sure docker container has 4 CPUs and 8GB of RAM at least. Otherwise, installing would fail due to OOM.

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
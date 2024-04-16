## Development
run `docker compose up` in the root directory

### Kubernetes
0) Install kubectl
1) Create Kubernetes cluster on UpCloud if one doesn't exist already.
2) In the cluster, go to Kubeconfig > Manual > Download kubeconfig
3) Set the env ```export KUBECONFIG=clustername_kubeconfig.yaml```
4) Verify that it works using ```kubectl config view``` and ```kubectl version```
5) Run ```create-configMaps.sh``` script to create configmaps for nginx and fluentd
6) Build local images using ```docker compose build``` in root directory
7) ```kubectl apply -f ./``` in the directory containing the kubernetes configuration files.

## Notes
Make sure docker container has 4 CPUs and 8GB of RAM at least. Otherwise, installing would fail due to OOM.

```
CSE356_project
├─ .gitignore
├─ .prettierrc
├─ backend
│  ├─ .gitignore
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ routing.js
│  │  ├─ search.js
│  │  ├─ tile.js
│  │  └─ user.js
│  └─ server.js
├─ development-us-nyc1_kubeconfig.yaml
├─ docker
│  ├─ apache.conf
│  ├─ backend.dev.Dockerfile
│  ├─ backend.prod.Dockerfile
│  ├─ db-entrypoint.sh
│  ├─ db.Dockerfile
│  ├─ fluent.conf
│  ├─ fluentd.Dockerfile
│  ├─ frontend.dev.Dockerfile
│  ├─ frontend.prod.Dockerfile
│  ├─ nginx.conf
│  ├─ osm2po.config
│  ├─ postgres-tuning.conf
│  ├─ search.Dockerfile
│  ├─ tile-entrypoint.sh
│  └─ tile.Dockerfile
├─ docker-compose.prod.yml
├─ docker-compose.yml
├─ frontend
│  ├─ .env.development
│  ├─ .env.production
│  ├─ .gitignore
│  ├─ jsconfig.json
│  ├─ next.config.mjs
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ .placeholder
│  │  └─ icon-red.png
│  ├─ src
│  │  └─ app
│  │     ├─ components
│  │     │  ├─ Map.jsx
│  │     │  └─ Sidebar.jsx
│  │     ├─ globals.css
│  │     ├─ layout.js
│  │     └─ page.js
│  └─ tailwind.config.js
├─ k8s
│  ├─ backend-deployment.yaml
│  ├─ build-all-local-images.ps1
│  ├─ build-all-local-images.sh
│  ├─ db-import-pod.yaml
│  ├─ fluentd-deployment.yaml
│  ├─ fluentd-service.yaml
│  ├─ frontend-deployment.yaml
│  ├─ glances-deployment.yaml
│  ├─ glances-service.yaml
│  ├─ mongo-deployment.yaml
│  ├─ nginx-deployment.yaml
│  ├─ nginx-service.yaml
│  ├─ nominatim-deployment.yaml
│  ├─ nominatim-service.yaml
│  ├─ pgrouting-deployment.yaml
│  ├─ pgrouting-service.yaml
│  ├─ portainer-deployment.yaml
│  ├─ portainer-service.yaml
│  ├─ tile-server-deployment.yaml
│  └─ tile-server-service.yaml
├─ k8snew
│  ├─ backend-claim0-persistentvolumeclaim.yaml
│  ├─ backend-claim1-persistentvolumeclaim.yaml
│  ├─ backend-deployment.yaml
│  ├─ build-all-local-images.sh
│  ├─ db-deployment.yaml
│  ├─ db-service.yaml
│  ├─ fluentd-claim0-persistentvolumeclaim.yaml
│  ├─ fluentd-claim1-persistentvolumeclaim.yaml
│  ├─ fluentd-deployment.yaml
│  ├─ fluentd-service.yaml
│  ├─ frontend-claim0-persistentvolumeclaim.yaml
│  ├─ frontend-deployment.yaml
│  ├─ mongo-config-persistentvolumeclaim.yaml
│  ├─ mongo-data-persistentvolumeclaim.yaml
│  ├─ mongo-deployment.yaml
│  ├─ nginx-deployment.yaml
│  ├─ nginx-service.yaml
│  ├─ osm-data-persistentvolumeclaim.yaml
│  ├─ portainer-claim1-persistentvolumeclaim.yaml
│  ├─ portainer-data-persistentvolumeclaim.yaml
│  ├─ portainer-deployment.yaml
│  ├─ portainer-service.yaml
│  ├─ search-deployment.yaml
│  ├─ search-service.yaml
│  ├─ tile-server-deployment.yaml
│  └─ tile-server-service.yaml
├─ k8snew2
│  ├─ backend-deployment.yaml
│  ├─ create-configMaps.sh
│  ├─ db-deployment.yaml
│  ├─ db-service.yaml
│  ├─ fluentd-deployment.yaml
│  ├─ fluentd-service.yaml
│  ├─ frontend-deployment.yaml
│  ├─ mongo-config-persistentvolumeclaim.yaml
│  ├─ mongo-data-persistentvolumeclaim.yaml
│  ├─ mongo-deployment.yaml
│  ├─ nginx-deployment.yaml
│  ├─ nginx-service.yaml
│  ├─ osm-data-persistentvolumeclaim.yaml
│  ├─ portainer-data-persistentvolumeclaim.yaml
│  ├─ portainer-deployment.yaml
│  ├─ portainer-service.yaml
│  ├─ search-deployment.yaml
│  ├─ search-service.yaml
│  ├─ tile-server-deployment.yaml
│  └─ tile-server-service.yaml
├─ package-lock.json
├─ package.json
├─ README.md
├─ script
│  ├─ osm2pgsql
│  └─ provisioning
│     ├─ ansible.cfg
│     ├─ cse356
│     ├─ deploy.yml
│     ├─ github
│     ├─ github.pub
│     ├─ inventory.ini
│     ├─ update.yml
│     ├─ user_key
│     └─ user_key.pub
└─ search
   ├─ main.py
   └─ requirements.txt

```
## Development
Run `docker compose up` in the root directory

### Kubernetes
0) Install kubectl
1) Create Kubernetes cluster on UpCloud if one doesn't exist already.
2) In the cluster, go to Kubeconfig > Manual > Download kubeconfig
3) Set the env ```export KUBECONFIG=clustername_kubeconfig.yaml```
4) Verify that it works using ```kubectl config view``` and ```kubectl version```
> If nginx or fluentd configurations have changed:
> 1) Run ```create-configMaps.sh``` script to create configmaps for nginx and fluentd
>   - You do not have to recreate configmaps if the configuration has not changed.

> If locally built images have changed:
> 1) Build local images using ```docker compose build``` in root directory
> 2) Push images to docker hub with ```./k8s/push-images-to-registry.sh```
>  - You do not have to rebuild for changes to containers using official images.

5) ```kubectl apply -f ./k8s/```

## Notes
Make sure docker container has 4 CPUs and 8GB of RAM at least. Otherwise, installing would fail due to OOM.

## Project Structure

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
│  ├─ renderd.conf
│  ├─ search.Dockerfile
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
│  ├─ backend-service.yaml
│  ├─ create-configMaps.sh
│  ├─ db-claim1-persistentvolumeclaim.yaml
│  ├─ db-deployment.yaml
│  ├─ db-service.yaml
│  ├─ fluentd-deployment.yaml
│  ├─ fluentd-service.yaml
│  ├─ frontend-deployment.yaml
│  ├─ frontend-service.yaml
│  ├─ mongo-config-persistentvolumeclaim.yaml
│  ├─ mongo-data-persistentvolumeclaim.yaml
│  ├─ mongo-deployment.yaml
│  ├─ mongo-service.yaml
│  ├─ nginx-deployment.yaml
│  ├─ nginx-service.yaml
│  ├─ old
│  │  ├─ build-all-local-images.ps1
│  │  └─ build-all-local-images.sh
│  ├─ osm-data-persistentvolumeclaim.yaml
│  ├─ portainer-data-persistentvolumeclaim.yaml
│  ├─ portainer-deployment.yaml
│  ├─ portainer-service.yaml
│  ├─ push-images-to-registry.sh
│  ├─ search-deployment.yaml
│  ├─ search-service.yaml
│  ├─ tile-cache-deployment.yaml
│  ├─ tile-cache-service.yaml
│  ├─ tile-server-deployment.yaml
│  └─ tile-server-service.yaml
├─ package-lock.json
├─ package.json
├─ README.md
├─ script
│  ├─ db
│  │  └─ store_backup.sh
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
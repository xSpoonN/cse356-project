## Development
Run `docker compose up` in the root directory

## Kubernetes
0) Install kubectl
1) Create Kubernetes cluster on UpCloud if one doesn't exist already.
2) In the cluster, go to Kubeconfig > Manual > Download kubeconfig
3) Set the env. Bash: `export KUBECONFIG=clustername_kubeconfig.yaml` or Powershell: `$ENV:KUBECONFIG = "clustername_kubeconfig.yaml`
4) Verify that it works using `kubectl config view` and `kubectl version`

> If locally built images have changed (or have never been built):
> 1) Build local images using `docker compose build` in root directory
> 2) Push images to docker hub with `./k8s/push-images-to-registry.sh`
>  - You do not have to rebuild for changes to containers using official images.

5) `kubectl apply -f ./k8s/`

### Useful Commands
- ```kubectl version``` - Check the connection to Kubernetes
- ```export KUBECONFIG=path/to/config``` - Set up connection. this path is relative, and needs to be set again if you ```cd``` into another directory
- ```kubectl apply -f path/to/configfiles``` - Updates the kubernetes deployment with new configuration files
- ```kubectl get <pods|pvc|services|deployments|...>``` - Lists all resources of a type
- ```kubectl logs <podname> [-f]``` - '-f' shows all logs from every run.
- ```kubectl delete <pod|pvc|service|deployment|...> <name>``` - Deletes a resource. If you delete a pod with the deployment still active, it functions as a restart. If you delete a deployment, it will delete the pod along with it. If you delete a pod without first deleting the pvcs attached to it, it might hang.
- ```kubectl exec --stdin --tty <podname> -- /bin/bash``` - Enters the shell in a running pod.
- ```kubectl describe <pod|pvc|service|deployment|...> <name>``` - Prints out a ton of kubernetes level information about a resource.

## Testing on local
Run `docker container run --rm -p 5665:5665 --net=host -v ./script/testing:/scripts ghcr.io/grafana/xk6-dashboard:0.7.3-alpha.1 run -e NODE_ENV=development "/scripts/load_testing.js"` in root directory.
`docker container run --rm -p 5665:5665 --net=host -v "C:\Users\Spoon\OneDrive\Documents\School\2024-1 Spring\CSE356\CSE356_project\script\testing:/scripts" ghcr.io/grafana/xk6-dashboard:0.7.3-alpha.1 run -e NODE_ENV=production "/scripts/load_testing.js"`


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
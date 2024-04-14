#!/bin/bash

# Build all local images using Docker Compose
docker compose build

if [ "$#" -eq 0]; then
    echo "No arguments provided. Loading all images to Minikube."
    echo "Loading frontend image to Minikube..."
    docker image save -o frontend.tar cse356_project-frontend:latest
    minikube image load frontend.tar
    rm frontend.tar

    echo "Loading backend image to Minikube..."
    docker image save -o backend.tar cse356_project-backend:latest
    minikube image load backend.tar
    rm backend.tar

    echo "Loading db-import image to Minikube..."
    docker image save -o dbimport.tar cse356_project-db-import:latest
    minikube image load dbimport.tar
    rm dbimport.tar

    echo "Loading db image to Minikube..."
    docker image save -o fluentd.tar cse356_project-fluentd:latest
    minikube image load fluentd.tar
    rm fluentd.tar

    echo "Loading tile server image to Minikube..."
    docker image save -o tileserver.tar cse356_project-tile-server:latest
    minikube image load tileserver.tar
    rm tileserver.tar
else
    for image_name in "$@"
    do
        echo "Loading ${image_name} image to Minikube..."
        docker image save -o "${image_name}.tar" "cse356_project-${image_name}:latest"
        minikube image load "${image_name}.tar"
        rm "${image_name}.tar"
    done
fi

current_dir=$(basename "$PWD")
if [ "$current_dir" = "k8s" ]; then
    kubectl apply -f .
else
    kubectl apply -f k8s/
fi
minikube image ls

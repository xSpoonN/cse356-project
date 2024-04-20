#!/bin/bash
docker login
REMOTE_REGISTRY="ktao87/cse356"
IMAGES=("cse356_project-tile-server" "cse356_project-db" "cse356_project-search" "cse356_project-frontend" "cse356_project-backend" "cse356_project-fluentd" "cse356_project-nginx")

# Loop through each image and push it to the remote registry after tagging with the registry address
for image in "${IMAGES[@]}"; do
    echo "Pushing $image to $REMOTE_REGISTRY"
    docker tag "$image" "$REMOTE_REGISTRY:$image"
    docker push "$REMOTE_REGISTRY:$image"
    docker rmi "$REMOTE_REGISTRY:$image"
done
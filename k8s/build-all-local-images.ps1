# Build all local images using Docker Compose
docker compose build

if ($args.Count -eq 0) {
    Write-Output "No arguments provided. Loading all images to Minikube."
    Write-Output "Loading frontend image to Minikube..."
    docker image save -o frontend.tar cse356_project-frontend:latest
    minikube image load frontend.tar
    Remove-Item frontend.tar

    Write-Output "Loading backend image to Minikube..."
    docker image save -o backend.tar cse356_project-backend:latest
    minikube image load backend.tar
    Remove-Item backend.tar

    Write-Output "Loading db-import image to Minikube..."
    docker image save -o dbimport.tar cse356_project-db-import:latest
    minikube image load dbimport.tar
    Remove-Item dbimport.tar

    Write-Output "Loading db image to Minikube..."
    docker image save -o fluentd.tar cse356_project-fluentd:latest
    minikube image load fluentd.tar
    Remove-Item fluentd.tar

    Write-Output "Loading tile server image to Minikube..."
    docker image save -o tileserver.tar cse356_project-tile-server:latest
    minikube image load tileserver.tar
    Remove-Item tileserver.tar
} else {
    foreach ($image_name in $args) {
        Write-Output "Loading ${image_name} image to Minikube..."
        docker image save -o "${image_name}.tar" "cse356_project-${image_name}:latest"
        minikube image load "${image_name}.tar"
        Remove-Item "${image_name}.tar"
    }
}

$current_dir = (Get-Item -Path ".\" -Verbose).Name
if ($current_dir -eq "k8s") {
    kubectl apply -f .
} else {
    kubectl apply -f k8s/
}
minikube image ls

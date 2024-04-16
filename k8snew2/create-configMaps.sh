kubectl create configmap nginx-config --from-file=../docker/nginx.conf
kubectl create configmap fluentd-config --from-file=../docker/fluent.conf

FROM ubuntu:latest

USER root

RUN apt-get update && \
apt-get install -y wget default-jre-headless unzip postgresql-client dos2unix && \
apt-get update && \
apt-get -y upgrade && rm -rf /var/lib/apt/lists/*

# Download osm2po
RUN wget http://osm2po.de/releases/osm2po-5.5.11.zip -O osm2po.zip

# Unzip osm2po
RUN unzip osm2po.zip -d /osm2po && \
    rm osm2po.zip

RUN mkdir -p /data

COPY ./osm2po.config /osm2po/osm2po.config

COPY ./db-import-entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]
RUN dos2unix /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
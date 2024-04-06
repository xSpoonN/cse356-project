FROM overv/openstreetmap-tile-server:latest

COPY ./tile-server-entrypoint.sh /tile-server-entrypoint.sh

RUN apt-get update && apt-get install -y dos2unix
RUN ["chmod", "+x", "/tile-server-entrypoint.sh"]
RUN dos2unix /tile-server-entrypoint.sh

ENTRYPOINT ["/tile-server-entrypoint.sh"]

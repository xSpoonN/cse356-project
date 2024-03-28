FROM overv/openstreetmap-tile-server:latest

COPY ./tile-server-entrypoint.sh /tile-server-entrypoint.sh

RUN ["chmod", "+x", "/tile-server-entrypoint.sh"]

ENTRYPOINT ["/tile-server-entrypoint.sh"]

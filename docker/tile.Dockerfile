FROM ubuntu:22.04

USER root

# Install dependencies
RUN apt update && apt install -y --no-install-recommends \
    screen locate libapache2-mod-tile renderd git tar unzip wget bzip2 apache2 lua5.1 mapnik-utils python3-mapnik python3-psycopg2 python3-yaml gdal-bin npm fonts-noto-cjk fonts-noto-hinted fonts-noto-unhinted fonts-unifont fonts-hanazono net-tools curl
RUN wget https://github.com/mikefarah/yq/releases/download/v4.6.1/yq_linux_amd64 -O /usr/bin/yq && chmod +x /usr/bin/yq

# Install stylesheet
RUN git clone --single-branch --branch v5.4.0 https://github.com/gravitystorm/openstreetmap-carto.git --depth 1 && cd openstreetmap-carto \
&& sed -i 's/, "unifont Medium", "Unifont Upper Medium"//g' style/fonts.mss \
&& sed -i 's/"Noto Sans Tibetan Regular",//g' style/fonts.mss \
&& sed -i 's/"Noto Sans Tibetan Bold",//g' style/fonts.mss \
&& sed -i 's/Noto Sans Syriac Eastern Regular/Noto Sans Syriac Regular/g' style/fonts.mss \
&& rm -rf .git
RUN npm install -g carto

# Get Noto Emoji Regular font, despite it being deprecated by Google
RUN wget https://github.com/googlefonts/noto-emoji/blob/9a5261d871451f9b5183c93483cbd68ed916b1e9/fonts/NotoEmoji-Regular.ttf?raw=true --content-disposition -P /usr/share/fonts/
RUN wget https://github.com/stamen/terrain-classic/blob/master/fonts/unifont-Medium.ttf?raw=true --content-disposition -P /usr/share/fonts/

# Setup volumes
RUN     mkdir -p /run/renderd \ 
        mkdir -p /data/tiles  \
    &&  ln -s /data/tiles  /var/cache/renderd/tiles \
;

# Setup Apache
RUN echo "LoadModule tile_module /usr/lib/apache2/modules/mod_tile.so" >> /etc/apache2/conf-available/mod_tile.conf \
&& echo "LoadModule headers_module /usr/lib/apache2/modules/mod_headers.so" >> /etc/apache2/conf-available/mod_headers.conf \
&& a2enconf mod_tile && a2enconf mod_headers
COPY apache.conf /etc/apache2/sites-available/000-default.conf
RUN ln -sf /dev/stdout /var/log/apache2/access.log \
&& ln -sf /dev/stderr /var/log/apache2/error.log

# Setup renderd
RUN echo '[default] \n\
URI=/tiles/ \n\
TILEDIR=/var/cache/renderd/tiles \n\
XML=/openstreetmap-carto/mapnik.xml \n\
TILESIZE=256 \n\
MAXZOOM=20' >> /etc/renderd.conf \
&& sed -i 's,/usr/share/fonts/truetype,/usr/share/fonts,g' /etc/renderd.conf

# Setup remote db connection
RUN sed -i '/osm2pgsql:/a \    host: "db"' /openstreetmap-carto/project.mml && \
sed -i '/host: "db"/a \    user: "postgres"' /openstreetmap-carto/project.mml && \
sed -i '/user: "postgres"/a \    password: "mysecretpassword"' /openstreetmap-carto/project.mml

# Copy entrpoint script
COPY ./tile-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

const express = require('express');
const http = require('http');
const sharp = require('sharp');

router = express.Router();

router.get('/tiles/:layer/:v/:h', async (req, res) => {
  const { layer, v, h } = req.params;
  if (isNaN(parseInt(v)) || isNaN(parseInt(h))) {
    return res.status(404).json({ status: 'ERROR', message: 'Tile Not Found' });
  }
  const layer2 = layer.startsWith('l') ? layer.substring(1) : layer;

  const options = {
    hostname:
      process.env.BUILD_ENVIRONMENT === 'docker' ? 'tile-server' : 'localhost',
    port: process.env.BUILD_ENVIRONMENT === 'docker' ? 80 : 8080,
    path: `/tile/${layer2}/${v}/${h}`,
    method: 'GET',
  };

  try {
    const tile_res = await getTile(options);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(tile_res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
  }
});

router.post('/convert', async (req, res) => {
  let { lat, long, zoom } = req.body;
  [lat, long, zoom] = [+lat, +long, +zoom];
  console.log(`POST /convert: { lat: ${lat}, long: ${long}, zoom: ${zoom} }`);

  const { x_tile, y_tile } = convertToTile(lat, long, zoom);
  console.log(`res: { x_tile: ${x_tile}, y_tile: ${y_tile} }`);
  return res.status(200).json({ x_tile, y_tile });
});

router.get('/turn/:TL/:BR', async (req, res) => {
  if (!req.session.username)
    return res.status(401).json({ status: 'ERROR', message: 'Unauthorized' });
  const { TL, BR } = req.params;
  const tl = { lat: +TL.split(',')[0], long: +TL.split(',')[1] };
  const br = {
    lat: +BR.split('.png')[0].split(',')[0],
    long: +BR.split('.png')[0].split(',')[1],
  };
  // console.log(`GET /turn: { TL: ${JSON.stringify(tl)}, BR: ${JSON.stringify(br)} }`);
  const zoom = 18;

  const { x_tile: x_tile_tl, y_tile: y_tile_tl } = convertToTile(
    tl.lat,
    tl.long,
    zoom
  );
  const { x_tile: x_tile_br, y_tile: y_tile_br } = convertToTile(
    br.lat,
    br.long,
    zoom
  );
  console.log(
    `Tile Coords: { x_tile_tl: ${x_tile_tl}, y_tile_tl: ${y_tile_tl}, x_tile_br: ${x_tile_br}, y_tile_br: ${y_tile_br} }`
  );
  const images = [];
  // console.log(x_tile_br - x_tile_tl + 1, y_tile_br - y_tile_tl + 1);
  for (let row = 0; row < y_tile_br - y_tile_tl + 1; row++) {
    for (let col = 0; col < x_tile_br - x_tile_tl + 1; col++) {
      const options = {
        hostname:
          process.env.BUILD_ENVIRONMENT === 'docker'
            ? 'tile-server'
            : 'localhost',
        port: process.env.BUILD_ENVIRONMENT === 'docker' ? 80 : 8080,
        path: `/tile/${zoom}/${x_tile_tl + col}/${y_tile_tl + row}.png`,
        method: 'GET',
      };

      try {
        const tile_res = await getTile(options);
        images.push({ buffer: tile_res, x: col * 256, y: row * 256 });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ status: 'ERROR', message: 'Internal Server Error' });
      }
    }
  }
  // console.log(`width: ${width}, height: ${height}`);
  // console.log(images);
  let mergedImage = sharp({
    create: {
      width: (x_tile_br - x_tile_tl + 1) * 256,
      height: (y_tile_br - y_tile_tl + 1) * 256,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });
  await mergedImage.composite(
    images.map(image => ({
      input: image.buffer,
      top: image.y,
      left: image.x,
      blend: 'over',
    }))
  );
  mergedImage = await mergedImage.png().toBuffer();
  const resizedImage = await sharp(mergedImage)
    .flatten()
    .resize(100, 100)
    .toBuffer();
  // console.log(resizedImage);
  res.writeHead(200, { 'Content-Type': 'image/png' });
  return res.end(resizedImage);
});

const convertToTile = (lat, long, zoom) => {
  // Calculate tile indices - https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Implementations
  const x_tile = Math.floor(((long + 180) / 360) * Math.pow(2, zoom));
  const y_tile = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
  return { x_tile, y_tile };
};

const getTile = async options => {
  return new Promise((resolve, reject) => {
    const tile_req = http.request(options, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', err => reject(new Error('Internal Server Error')));
    });
    tile_req.on('error', err => reject(new Error('Internal Server Error')));
    tile_req.end();
  });
};

module.exports = router;

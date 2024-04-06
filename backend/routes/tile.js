const express = require('express');
const http = require('http');

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
    const tile_res = await new Promise((resolve, reject) => {
      const tile_req = http.request(options, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', err => reject(new Error('Internal Server Error')));
      });
      tile_req.on('error', err => reject(new Error('Internal Server Error')));
      tile_req.end();
    });

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
  console.log(`res: { x_tile: ${x_tile}, y_tile: ${y_tile} }`);
  return res.status(200).json({ x_tile, y_tile });
});

router.get('/turn/$TL/$BR.png', async (req, res) => {
  if (!req.session.username)
    return res.status(401).json({ status: 'ERROR', message: 'Unauthorized' });

  const { TL, BR } = req.params;

  return res.status(200).json('HELLO WORLD');
});

module.exports = router;

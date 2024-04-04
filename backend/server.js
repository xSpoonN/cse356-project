// Initialize the server using express
const express = require('express');
const http = require('http');
const app = express();
const port = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.post('/api/search', async (req, res) => {
  function calculateDistance(location, center) {
    return cosineDistanceBetweenPoints(
      parseFloat(center[0]),
      parseFloat(center[1]),
      parseFloat(location.lat),
      parseFloat(location.lon)
    );
  }

  function cosineDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const deltaP = p2 - p1;
    const deltaLon = lon2 - lon1;
    const deltaLambda = (deltaLon * Math.PI) / 180;
    const a =
      Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
      Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
    return d;
  }

  const { bbox, onlyInBox, searchTerm } = req.body;
  const { minLat, minLon, maxLat, maxLon } = bbox;
  const boxCenter = [
    (parseFloat(minLat) + parseFloat(maxLat)) / 2,
    (parseFloat(minLon) + parseFloat(maxLon)) / 2,
  ];
  console.log(
    `POST /search: ${JSON.stringify({ bbox, onlyInBox, searchTerm })}`
  );

  // Build search query
  let query = `http://${process.env.BUILD_ENVIRONMENT === 'docker' ? 'nominatim:8080' : 'localhost:9090'}/search?q=${searchTerm}`;
  if (onlyInBox) {
    query += `&viewbox=${minLon},${minLat},${maxLon},${maxLat}&bounded=1`;
  }

  try {
    let query_res = await (await fetch(query)).json();
    console.log('result: ', query_res);

    if (onlyInBox) {
      query_res = query_res.map(row => {
        return {
          name: row.display_name,
          coordinates: {
            lon: parseFloat(row.lon),
            lat: parseFloat(row.lat),
          },
          bbox: {
            minLat,
            minLon,
            maxLat,
            maxLon,
          },
          distance: calculateDistance(row, boxCenter),
        };
      });
    } else {
      query_res = query_res.map(row => {
        const [minLat, maxLat, minLon, maxLon] = row.boundingbox;
        return {
          name: row.display_name,
          coordinates: {
            lon: parseFloat(row.lon),
            lat: parseFloat(row.lat),
          },
          bbox: {
            minLat: parseFloat(minLat),
            minLon: parseFloat(minLon),
            maxLat: parseFloat(maxLat),
            maxLon: parseFloat(maxLon),
          },
          distance: calculateDistance(row, boxCenter),
        };
      });
    }
    query_res.sort((a, b) => a.distance - b.distance);
    console.log('Returned result: ', query_res);

    query_res = query_res.map(row => {
      delete row.distance;
      return row;
    });

    return res.status(200).json(query_res);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

app.post('/convert', async (req, res) => {
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

app.get('/tile/:layer/:v/:h', async (req, res) => {
  const { layer, v, h } = params;
  if (isNaN(parseInt(v)) || isNaN(parseInt(h))) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const layer2 = layer.substring(0, 1) == 'l' ? layer.substring(1) : layer;
  /* console.log(`Requesting tile ${layer2}/${v}/${h}`); */
  const options = {
    hostname:
      process.env.BUILD_ENVIRONMENT === 'docker' ? 'tile-server' : 'localhost',
    port: process.env.BUILD_ENVIRONMENT === 'docker' ? 80 : 8080,
    path: `/tile/${layer2}/${v}/${h}`,
    method: 'GET',
  };
  const tile_res = await new Promise((resolve, reject) => {
    const tile_req = http.request(options, response => {
      const chunks = [];

      response.on('data', chunk => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve(new Response(body, { headers: response.headers }));
      });

      response.on('error', err => {
        console.error(`problem with request: ${err.message}`);
        reject(new Error('Internal Server Error'));
      });
    });

    tile_req.on('error', err => {
      console.error(`problem with request: ${err.message}`);
      reject(new Error('Internal Server Error'));
    });

    tile_req.end();
  });

  return tile_res;
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

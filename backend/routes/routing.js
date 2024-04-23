const express = require('express');
const PG = require('pg');

async function connect_db() {
  const pool = new PG.Pool({
    user: 'postgres',
    password: 'mysecretpassword',
    host: 'db',
    database: 'gis',
  });
  const client = await pool.connect();

  return client;
}

router = express.Router();

// router.use((req, res, next) => {
//   if (!req.session.username) {
//     console.warn('Received unauthorized request');
//     return res.status(200).json({ status: 'ERROR', message: 'Unauthorized' });
//   }

//   next();
// });

router.post('/route', async (req, res) => {
  console.log('Received /route request');

  const { source, destination } = req.body;
  const { lat: srcLat, lon: srcLon } = source;
  const { lat: dstLat, lon: dstLon } = destination;

  const client = await connect_db();
  const sql = `
  WITH source AS (
    SELECT source AS source_id
    FROM us_northeast_2po_4pgr
    ORDER BY geom_way <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)
    LIMIT 1
  ),
  destination AS (
    SELECT target AS target_id
    FROM us_northeast_2po_4pgr
    ORDER BY geom_way <-> ST_SetSRID(ST_MakePoint($4, $3), 4326)
    LIMIT 1
  ),
  route AS (
    SELECT * FROM pgr_dijkstra(
      'SELECT id, source, target, cost, reverse_cost FROM us_northeast_2po_4pgr',
      (SELECT source_id FROM source),
      (SELECT target_id FROM destination),
      FALSE
    )
  )
  SELECT
    r.seq, r.node, r.edge, r.cost, r.agg_cost, 
    ST_X(ST_StartPoint(w.geom_way)) AS lon,
    ST_Y(ST_StartPoint(w.geom_way)) AS lat
  FROM route r
  JOIN us_northeast_2po_4pgr w ON r.edge = w.id;
  `;
  try {
    console.log('Executing query');
    const query_res = await client.query(sql, [srcLat, srcLon, dstLat, dstLon]);
    const route = query_res.rows.map(row => ({
      description: `Step ${row.seq} (${row.name}): Turn ${row.turn_direction} Move to node ${row.node} via edge ${row.edge}. Distance: ${row.distance}, Cost: ${row.cost}, Aggregate cost: ${row.agg_cost}`,
      coordinates: {
        lat: parseFloat(row.lat),
        lon: parseFloat(row.lon),
      },
    }));
    console.debug('Query Result: ', route);

    client.release();
    return res.status(200).json(route);
  } catch (error) {
    console.error('Error executing query', error);
    client.release();
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/route/full', async (req, res) => {
  const { source, destination } = req.body;
  const { lat: srcLat, lon: srcLon } = source;
  const { lat: dstLat, lon: dstLon } = destination;
  const client = await connect_db();
  const sql = `
  WITH source AS (
    SELECT source AS source_id
    FROM us_northeast_2po_4pgr
    ORDER BY geom_way <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)
    LIMIT 1
  ),
  destination AS (
    SELECT target AS target_id
    FROM us_northeast_2po_4pgr
    ORDER BY geom_way <-> ST_SetSRID(ST_MakePoint($4, $3), 4326)
    LIMIT 1
  ),
  route AS (
    SELECT * FROM pgr_dijkstra(
      'SELECT id, source, target, cost, reverse_cost FROM us_northeast_2po_4pgr',
      (SELECT source_id FROM source),
      (SELECT target_id FROM destination),
      FALSE
    )
  )
  SELECT
    r.seq, r.node, r.edge, r.cost, r.agg_cost, 
    ST_Length(w.geom_way::geography) AS distance,
    ST_AsGeoJSON(w.geom_way) AS geomjson,
    ST_X(ST_StartPoint(w.geom_way)) AS start_lon,
    ST_Y(ST_StartPoint(w.geom_way)) AS start_lat,
	  ST_X(ST_EndPoint(w.geom_way)) AS end_lon,
    ST_Y(ST_EndPoint(w.geom_way)) AS end_lat
  FROM route r
  JOIN us_northeast_2po_4pgr w ON r.edge = w.id;
  `;

  try {
    const query_res = await client.query(sql, [srcLat, srcLon, dstLat, dstLon]);
    const route = query_res.rows.map(row => ({
      description: `Step ${row.seq} (${row.name}): Move to node ${row.node} via edge ${row.edge}. Cost: ${row.cost}, Aggregate cost: ${row.agg_cost}`,
      edge: [
        [row.start_lon, row.start_lat],
        [row.end_lon, row.end_lat],
      ],
      geoJson: JSON.parse(row.geomjson),
      distance: row.distance,
    }));

    client.release();
    return res.status(200).json(route);
  } catch (error) {
    console.error('Error executing query', error);
    client.release();
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

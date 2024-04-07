const express = require('express');
const PG = require('pg');

async function connect_db() {
  const pool = new PG.Pool({
    user: 'postgres',
    password: 'mysecretpassword',
    host: 'pgrouting',
    database: 'routing',
  });
  const client = await pool.connect();

  return client;
}

router = express.Router();

router.use((req, res, next) => {
  if (!req.session.username)
    return res.status(401).json({ status: 'ERROR', message: 'Unauthorized' });

  next();
});

router.post('/route', async (req, res) => {
  const { source, destination } = req.body;
  const { lat: srcLat, lon: srcLon } = source;
  const { lat: dstLat, lon: dstLon } = destination;
  console.log('REQUEST: ', source, destination);

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
  ),
  route_with_geom AS (
      SELECT DISTINCT ON(lon,lat) 
        r.seq, r.node, r.edge, r.cost, r.agg_cost,
        w.geom_way,
        ST_X(ST_StartPoint(w.geom_way)) AS lon,
        ST_Y(ST_StartPoint(w.geom_way)) AS lat,
        w.osm_name AS name
      FROM route r
      JOIN us_northeast_2po_4pgr w ON r.edge = w.id
  ),
  route_with_degrees AS (
    SELECT *,
      CASE 
        WHEN LAG(geom_way) OVER (ORDER BY seq) IS NULL THEN ST_StartPoint(geom_way)
        ELSE LAG(ST_StartPoint(geom_way)) OVER (ORDER BY seq)
      END AS prev_point,
      CASE 
        WHEN LAG(geom_way) OVER (ORDER BY seq) IS NULL THEN ST_EndPoint(geom_way)
        ELSE ST_StartPoint(geom_way)
      END AS curr_point,
      CASE
        WHEN LEAD(geom_way) OVER (ORDER BY seq) IS NULL THEN ST_EndPoint(geom_way)
        ELSE LEAD(ST_StartPoint(geom_way)) OVER (ORDER BY seq)
    END AS next_point
    FROM route_with_geom
  ),
  route_with_turns AS (
    SELECT seq, name, node, edge, cost, agg_cost, lon, lat,
      DEGREES(ST_Angle(prev_point,curr_point,next_point)) as angle
    FROM route_with_degrees
  )
  SELECT * FROM route_with_turns
  WHERE (angle >= 45 AND angle <= 135)
	  OR (angle >= 225 AND angle <= 315);
  `;
  try {
    const query_res = await client.query(sql, [srcLat, srcLon, dstLat, dstLon]);
    console.log('RESULT: ', query_res.rows);
    const route = query_res.rows.map(row => ({
      description: `Step ${row.seq} (${row.name}): Move to node ${row.node} via edge ${row.edge}. Cost: ${row.cost}, Aggregate cost: ${row.agg_cost}`,
      coordinates: {
        lat: row.lat,
        lon: row.lon,
      },
    }));

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
  SELECT DISTINCT ON(lon,lat)
    r.seq, r.node, r.edge, r.cost, r.agg_cost, w.geom_way,
    ST_X(ST_StartPoint(w.geom_way)) AS lon,
    ST_Y(ST_StartPoint(w.geom_way)) AS lat
  FROM route r
  JOIN us_northeast_2po_4pgr w ON r.edge = w.id;
  `;

  try {
    const query_res = await client.query(sql, [srcLat, srcLon, dstLat, dstLon]);
    console.log('RESULT: ', query_res.rows);
    const route = query_res.rows.map(row => ({
      description: `Step ${row.seq} (${row.name}): Move to node ${row.node} via edge ${row.edge}. Cost: ${row.cost}, Aggregate cost: ${row.agg_cost}`,
      coordinates: {
        lat: row.lat,
        lon: row.lon,
      },
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

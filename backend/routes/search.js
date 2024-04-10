const express = require('express');
const PG = require('pg');

async function connect_db() {
  const pool = new PG.Pool({
    user: 'renderer',
    password: 'renderer',
    host: 'tile-server',
    database: 'gis',
  });
  const client = await pool.connect();

  return client;
}

router = express.Router();

router.post('/search', async (req, res) => {
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

  console.log('Received /search request');

  const { bbox, onlyInBox, searchTerm } = req.body;
  const { minLat, minLon, maxLat, maxLon } = bbox;
  const boxCenter = [
    (parseFloat(minLat) + parseFloat(maxLat)) / 2,
    (parseFloat(minLon) + parseFloat(maxLon)) / 2,
  ];

  // Build search query
  let sql = ``;
  if (onlyInBox) {
    sql = `SELECT 
        name, 
        ST_X(ST_Transform(way,4326)) as lon, 
        ST_Y(ST_Transform(way,4326)) as lat
      FROM 
        planet_osm_point 
      WHERE 
        LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) AND ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857) && way
      UNION
      SELECT
        name, 
        ST_X(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857))), 4326)) AS lon,
        ST_Y(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857))), 4326)) AS lat
      FROM 
        planet_osm_line 
      WHERE LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) AND ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857) && way
      UNION
      SELECT 
        name, 
        ST_X(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857))), 4326)) AS lon,
        ST_Y(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857))), 4326)) AS lat
      FROM
        planet_osm_polygon 
      WHERE LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) AND ST_Transform(ST_MakeEnvelope($2, $3, $4, $5, 4326), 3857) && way
      LIMIT 30;`;
  } else {
    sql = `
      SELECT 
        name, 
        ST_X(ST_Transform(way,4326)) as lon, 
        ST_Y(ST_Transform(way,4326)) as lat,
        ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
        ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
        ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
        ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat
      FROM 
        planet_osm_point 
      WHERE
        LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) 
      UNION
      SELECT 
        name, 
        ST_X(ST_Centroid(ST_Transform(way,4326))) as lon, 
        ST_Y(ST_Centroid(ST_Transform(way,4326))) as lat,
        ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
        ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
        ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
        ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat
      FROM 
        planet_osm_line 
      WHERE 
        LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) 
      UNION
      SELECT 
        name, 
        ST_X(ST_Centroid(ST_Transform(way,4326))) as lon, 
        ST_Y(ST_Centroid(ST_Transform(way,4326))) as lat,
        ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
        ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
        ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
        ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat
      FROM 
          planet_osm_polygon
      WHERE LOWER(name) LIKE LOWER(CONCAT('%', $1::text, '%')) 
      LIMIT 30;`;
  }

  try {
    const client = await connect_db();

    console.log('Sending query to search service');
    let query_res = await client.query(
      sql,
      onlyInBox ? [searchTerm, minLon, minLat, maxLon, maxLat] : [searchTerm]
    );

    if (onlyInBox) {
      query_res = query_res.rows.map(row => {
        return {
          name: row.name,
          coordinates: {
            lon: parseFloat(row.lon),
            lat: parseFloat(row.lat),
          },
          bbox: {
            minLat: parseFloat(row.minlat),
            minLon: parseFloat(row.minlon),
            maxLat: parseFloat(row.maxlat),
            maxLon: parseFloat(row.maxlon),
          },
          distance: calculateDistance(row, boxCenter),
        };
      });
    } else {
      query_res = query_res.rows.map(row => {
        return {
          name: row.name,
          coordinates: {
            lon: parseFloat(row.lon),
            lat: parseFloat(row.lat),
          },
          bbox: {
            minLat: parseFloat(row.minlat),
            minLon: parseFloat(row.minlon),
            maxLat: parseFloat(row.maxlat),
            maxLon: parseFloat(row.maxlon),
          },
          distance: calculateDistance(row, boxCenter),
        };
      });
    }

    query_res.sort((a, b) => a.distance - b.distance);

    query_res = query_res.map(row => {
      delete row.distance;
      return row;
    });

    client.release();

    return res.status(200).json(query_res);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

module.exports = router;

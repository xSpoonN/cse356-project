import { NextResponse } from 'next/server';
import { connect_db } from '../../lib/db.js';

export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
  const { minLat, minLon, maxLat, maxLon } = bbox;
  const boxCenter = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
  console.log(
    `POST /search: ${JSON.stringify({ bbox, onlyInBox, searchTerm })}`
  );

  // Build search query
  let sql = ``;
  if (onlyInBox) {
    console.log('Searching only in box');
    sql = `SELECT 
      name, 
      ST_X(ST_Transform(way,4326)) as lon, 
      ST_Y(ST_Transform(way,4326)) as lat,
      ST_Distance(
        ST_Transform(way, 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
    ) AS distance
    FROM 
      planet_osm_point 
    WHERE 
      LOWER(name) LIKE LOWER('%${searchTerm}%') AND ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857) && way
    UNION

    SELECT
      name, 
      ST_X(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)) AS lon,
      ST_Y(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)) AS lat,
      ST_Distance(
        ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
    ) AS distance
    FROM 
      planet_osm_line 
    WHERE LOWER(name) LIKE LOWER('%${searchTerm}%') AND ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857) && way
    UNION

    SELECT 
      name, 
      ST_X(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)) AS lon,
      ST_Y(ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)) AS lat,
      ST_Distance(
        ST_Transform(ST_Centroid(ST_Intersection(way, ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857))), 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
    ) AS distance
    FROM
      planet_osm_polygon 
    WHERE LOWER(name) LIKE LOWER('%${searchTerm}%') AND ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 3857) && way
    ORDER BY distance
    LIMIT 100;`;
  } else {
    console.log('Searching everywhere');
    sql = `
    SELECT 
      name, 
      ST_X(ST_Transform(way,4326)) as lon, 
      ST_Y(ST_Transform(way,4326)) as lat,
      ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
      ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
      ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
      ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat,
      ST_Distance(
        ST_Transform(way, 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
      ) AS distance
    FROM 
      planet_osm_point 
    WHERE
      LOWER(name) LIKE LOWER('%${searchTerm}%') 
    UNION

    SELECT 
      name, 
      ST_X(ST_Centroid(ST_Transform(way,4326))) as lon, 
      ST_Y(ST_Centroid(ST_Transform(way,4326))) as lat,
      ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
      ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
      ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
      ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat,
      ST_Distance(
        ST_Transform(way, 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
      ) AS distance
    FROM 
      planet_osm_line 
    WHERE 
      LOWER(name) LIKE LOWER('%${searchTerm}%') 
    UNION

    SELECT 
      name, 
      ST_X(ST_Centroid(ST_Transform(way,4326))) as lon, 
      ST_Y(ST_Centroid(ST_Transform(way,4326))) as lat,
      ST_XMin(ST_Envelope(ST_Transform(way,4326))) as minlon,
      ST_YMin(ST_Envelope(ST_Transform(way,4326))) as minlat,
      ST_XMax(ST_Envelope(ST_Transform(way,4326))) as maxlon,
      ST_YMax(ST_Envelope(ST_Transform(way,4326))) as maxlat,
      ST_Distance(
        ST_Transform(way, 4326)::geography, 
        ST_SetSRID(ST_MakePoint(${boxCenter[1]}, ${boxCenter[0]}), 4326)::geography
      ) AS distance
    FROM 
        planet_osm_polygon
    WHERE LOWER(name) LIKE LOWER('%${searchTerm}%')
    ORDER BY distance
    LIMIT 100;`;
  }
  //console.log(sql);

  const client = await connect_db();
  try {
    let res = await client.query(sql);

    if (onlyInBox) {
      res = res.rows.map(row => {
        return {
          name: row.name,
          coordinates: {
            lon: row.lon,
            lat: row.lat,
          },
          bbox: {
            minLat,
            minLon,
            maxLat,
            maxLon,
          },
        };
      });
    } else {
      res = res.rows.map(row => {
        return {
          name: row.name,
          coordinates: {
            lon: row.lon,
            lat: row.lat,
          },
          bbox: {
            minLat: row.minlat,
            minLon: row.minlon,
            maxLat: row.maxlat,
            maxLon: row.maxlon,
          },
        };
      });
    }

    client.release();
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    client.release();
    return NextResponse.error(err);
  }
}

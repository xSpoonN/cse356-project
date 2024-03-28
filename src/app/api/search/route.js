import { NextResponse } from 'next/server';
import { connect_db } from '../../lib/db.js';

export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
  //Process searchTerm
  let housenumber,
    street,
    terms = searchTerm.split(' ');

  // If search term is at least separated by space, first assume it is housenumber and street
  if (terms.length > 1) {
    housenumber = terms[0];
    street = terms.slice(1).join(' ');

    // Check if housenumber is a number. If not, it is not a housenumber and the search term was all street
    if (isNaN(housenumber)) {
      housenumber = -1;
      street = searchTerm;
    }
  }
  // If search term is only one word, it cannot be neither housenumber nor street
  else {
    housenumber = -1;
    street = undefined;
  }

  const { minLat, minLon, maxLat, maxLon } = bbox;
  const boxCenter = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
  console.log(
    `POST /search: ${JSON.stringify({ bbox, onlyInBox, searchTerm, housenumber, street })}`
  );

  // Build search query
  let query = `http://${process.env.BUILD_ENVIRONMENT === 'docker' ? 'nominatim:8080' : 'localhost:9090'}/api/search?q=${searchTerm}`;
  if (onlyInBox) {
    console.log('Searching only in box');
    query += `&viewbox=${minLon},${minLat},${maxLon},${maxLat}&bounded=1`;
  }

  const client = await connect_db();
  try {
    let res = await client.query(sql);
    console.log('result: ', res.rows);

    if (onlyInBox) {
      res = res.rows
        .filter(row => row.name)
        .map(row => {
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
      res = res.rows
        .filter(row => row.name)
        .map(row => {
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

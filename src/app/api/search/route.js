import { NextResponse } from 'next/server';

export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
  const { minLat, minLon, maxLat, maxLon } = bbox;
  console.log(
    `POST /search: ${JSON.stringify({ bbox, onlyInBox, searchTerm })}`
  );

  // Build search query
  let query = `http://${process.env.BUILD_ENVIRONMENT === 'docker' ? 'nominatim:8080' : 'localhost:9090'}/search?q=${searchTerm}`;
  if (onlyInBox) {
    console.log('Searching only in box');
    query += `&viewbox=${minLon},${minLat},${maxLon},${maxLat}&bounded=1`;
  }

  try {
    let res = await (await fetch(query)).json();
    console.log('result: ', res);

    if (onlyInBox) {
      res = res.map(row => {
        return {
          name: row.display_name,
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
      res = res.map(row => {
        const [minLat, minLon, maxLat, maxLon] = row.boundingbox;
        return {
          name: row.display_name,
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
    }

    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.error(err);
  }
}

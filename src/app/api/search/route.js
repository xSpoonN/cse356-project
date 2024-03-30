import { NextResponse } from 'next/server';

function calculateDistance(location, center) {
  const lonDiff = parseFloat(location.lon) - center[1];
  const latDiff = parseFloat(location.lat) - center[0];
  return Math.sqrt(lonDiff * lonDiff + latDiff * latDiff);
}
export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
  const { minLat, minLon, maxLat, maxLon } = bbox;
  const boxCenter = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
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
          distance: calculateDistance(row, boxCenter),
        };
      });
    } else {
      res = res.map(row => {
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
    res.sort((a, b) => a.distance - b.distance);
    res = res.map(row => {
      delete row.distance;
      return row;
    });

    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.error(err);
  }
}

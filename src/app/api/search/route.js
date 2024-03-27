import { NextResponse } from 'next/server';

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
export async function POST(request) {
  const { bbox, onlyInBox, searchTerm } = await request.json();
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
    let res = await (await fetch(query)).json();
    console.log('result: ', res);

    if (onlyInBox) {
      res = res.map(row => {
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
    console.log('Returned result: ', res);

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

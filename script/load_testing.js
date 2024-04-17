import http from 'k6/http';
import { sleep } from 'k6';

/**
 * Parameters for the load testing
 * 1) Number of Virtual Users (VUs)
 * 2) Response time
 * 3) Percentage of getting specific location (currently set to 90%)
 */

// Read by K6 during init stage
export const options = {
  stages: [
    { duration: '2m', target: 50 }, // ramp up to 50 users over 2 minutes
    { duration: '3m', target: 50 }, // stay at 50 users for 3 minutes
    { duration: '1m', target: 0 }, // ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests must complete below 250ms
    http_req_failed: ['rate=0'], // none of the requests should fail
  },
};

const boundingBoxes = {
  'Stony Brook': [
    [-73.147, 40.899],
    [-73.105, 40.935],
  ],
  Boston: [
    [-71.191, 42.227],
    [-70.994, 42.4],
  ],
  'New York City': [
    [-74.259, 40.477],
    [-73.7, 40.917],
  ],
  Philadelphia: [
    [-75.28, 39.867],
    [-74.955, 40.137],
  ],
};

/**
 * @returns
 */
function getRandomCoordinate(box) {
  const lon = Math.random() * (box[1][0] - box[0][0]) + box[0][0];
  const lat = Math.random() * (box[1][1] - box[0][1]) + box[0][1];
  return [lon, lat];
}

/**
 * @returns 90% of the time, return the value of the key in the object, otherwise return a value from random keys
 */
function chooseValue(obj, key) {
  if (Math.random() < 0.9) {
    return obj[key];
  }
  const remainingKeys = Object.keys(obj).filter(k => k !== key);
  return obj[Math.floor(Math.random() * remainingKeys.length)];
}

/**
 * 1. Each VU will pick a random location and request tiles near the area
 * 2. Each VU will try login with given credentials
 * 3. Each VU will try to search routes for random locations
 * 4. Each VU will try to request tiles for the routes
 */
export default function () {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'http://mygroup.cse356.compas.cs.stonybrook.edu'
      : 'http://localhost';
  const location = chooseValue(boundingBoxes, 'Stony Brook');
  const source = getRandomCoordinate(boundingBoxes[location]);
  const zoom = Math.floor(Math.random() * 20);

  // Convert lat, lon to tile coordinates
  let payload = JSON.stringify({
    lat: source[1],
    long: source[0],
    zoom,
  });
  const { x_tile, y_tile } = http
    .post(`${baseUrl}/convert`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .json();

  // Get tiles (3x3 grid)
  for (let x_offset = -1; x_offset <= 1; x_offset++) {
    for (let y_offset = -1; y_offset <= 1; y_offset++) {
      const x = x_tile + x_offset;
      const y = y_tile + y_offset;

      http.get(`${baseUrl}/tiles/${zoom}/${x}/${y}.png`);
    }
  }

  // Login
  const credentials = {
    username: 'admin',
    password: 'admin',
  };
  http.post(`${baseUrl}/api/login`, JSON.stringify(credentials), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Search routes
  const destination = getRandomCoordinate(
    boundingBoxes[chooseValue(boundingBoxes, 'Stony Brook')]
  );
  payload = JSON.stringify({
    source: {
      lat: source[1],
      long: source[0],
    },
    destination: {
      lat: destination[1],
      long: destination[0],
    },
  });
  const routes = http
    .post(`${baseUrl}/api/routes`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .json();

  for (const route of routes) {
    const {
      coordinates: { lat, lon },
    } = route;
    const { x_tile, y_tile } = http
      .post(`${baseUrl}/convert`, JSON.stringify({ lat, long: lon, zoom }), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .json();
    http.get(`${baseUrl}/tiles/${zoom}/${x_tile}/${y_tile}.png`);
  }

  sleep(1);
}

import http from 'http';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
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
  const res = await new Promise((resolve, reject) => {
    const req = http.request(options, response => {
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

    req.on('error', err => {
      console.error(`problem with request: ${err.message}`);
      reject(new Error('Internal Server Error'));
    });

    req.end();
  });

  return res;
}

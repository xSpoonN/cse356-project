import http from 'http';

export async function GET(request, { params }) {
  const { layer, v, h } = params;
  if (
    layer.substring(0, 1) !== 'l' ||
    isNaN(parseInt(layer.substring(1))) ||
    isNaN(parseInt(v)) ||
    isNaN(parseInt(h))
  ) {
    return new Response('Not Found', { status: 404 });
  }
  const layer2 = layer.substring(1);
  /* console.log(`Requesting tile ${layer2}/${v}/${h}`); */
  const options = {
    hostname: 'localhost',
    port: 8080,
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

import { NextResponse } from 'next/server';

export async function POST(request) {
  let { lat, long, zoom } = await request.json();
  [lat, long, zoom] = [+lat, +long, +zoom];
  console.log(`POST /convert: { lat: ${lat}, long: ${long}, zoom: ${zoom} }`);

  // Calculate tile indices - https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Implementations
  const x_tile = Math.floor(((long + 180) / 360) * Math.pow(2, zoom));
  const y_tile = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
  console.log(`res: { x_tile: ${x_tile}, y_tile: ${y_tile} }`);
  return NextResponse.json({ x_tile, y_tile });
}

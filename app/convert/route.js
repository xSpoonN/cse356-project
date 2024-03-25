import { NextResponse } from 'next/server';

export async function POST(request) {
  // Untested atm, but should work
  const { lat, long, zoom } = request.body;

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

  return NextResponse.json({ x_tile, y_tile });
}

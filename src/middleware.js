import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function middleware(request) {
  let ip;
  const forwardedFor = headers().get('x-forwarded-for');
  const realIp = headers().get('x-real-ip');
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  } else {
    ip = undefined;
  }
  const url = new URL(request.url);

  console.log(`${ip} ${request.method} ${url.pathname}`);

  const response = NextResponse.next();
  response.headers.set('x-cse356', '65b99ec7c9f3cb0d090f2236');

  return response;
}

import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  response.headers.set('x-cse356', '65b99ec7c9f3cb0d090f2236');

  return response;
}
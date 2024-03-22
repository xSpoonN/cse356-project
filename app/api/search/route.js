import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('HELLO THERE');

  return NextResponse.json({ message: 'Hello, World!' });
}

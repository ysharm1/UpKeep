import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'POST works!' })
}

export async function GET() {
  return NextResponse.json({ message: 'GET works!' })
}

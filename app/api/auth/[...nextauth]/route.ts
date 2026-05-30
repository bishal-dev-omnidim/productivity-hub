// Auth disabled — stub route so the file doesn't 404
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ message: 'Auth not configured' }, { status: 404 })
}

export function POST() {
  return NextResponse.json({ message: 'Auth not configured' }, { status: 404 })
}

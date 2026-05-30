import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function created(data: unknown) {
  return NextResponse.json({ data }, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: { message, details } }, { status })
}

/**
 * Wraps a route handler with consistent error handling so every endpoint
 * returns a predictable JSON shape: { data } on success, { error } on failure.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    if (err instanceof ZodError) {
      return fail('Validation failed', 422, err.issues)
    }
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message === 'Unauthorized' ? 401 : message === 'Not found' ? 404 : 500
    return fail(message, status)
  }
}

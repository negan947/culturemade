import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/utils/rate-limit'
import type { ApiResponse, ApiError } from '@/types/ecommerce'

/**
 * Standard API response wrapper
 */
export function createApiResponse<T = any>(
  data: T,
  success: boolean = true,
  meta?: Record<string, any>
): ApiResponse<T> {
  return {
    success,
    data,
    meta
  }
}

/**
 * Standard API error response
 */
export function createApiError(
  code: string,
  message: string,
  details?: any,
  status: number = 500
): NextResponse {
  const error: ApiError = {
    code,
    message,
    details
  }
  
  const response: ApiResponse = {
    success: false,
    data: null,
    error
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Validation error response
 */
export function createValidationError(
  message: string = 'Validation failed',
  details?: any
): NextResponse {
  return createApiError('VALIDATION_ERROR', message, details, 400)
}

/**
 * Not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse {
  return createApiError('NOT_FOUND', `${resource} not found`, null, 404)
}

/**
 * Unauthorized error response
 */
export function createUnauthorizedError(
  message: string = 'Authentication required'
): NextResponse {
  return createApiError('UNAUTHORIZED', message, null, 401)
}

/**
 * Forbidden error response
 */
export function createForbiddenError(
  message: string = 'Access denied'
): NextResponse {
  return createApiError('FORBIDDEN', message, null, 403)
}

/**
 * Rate limit error response
 */
export function createRateLimitError(): NextResponse {
  return createApiError(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please try again later.',
    null,
    429
  )
}

/**
 * Internal server error response
 */
export function createInternalError(
  message: string = 'An unexpected error occurred'
): NextResponse {
  return createApiError('INTERNAL_ERROR', message, null, 500)
}

/**
 * CORS headers for API responses
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || '*'
      : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  }
}

/**
 * Standard cache headers for different content types
 */
export function getCacheHeaders(type: 'static' | 'dynamic' | 'private' | 'no-cache'): Record<string, string> {
  switch (type) {
    case 'static':
      return {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' // 1 hour, revalidate for 2 hours
      }
    case 'dynamic':
      return {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // 5 minutes, revalidate for 10 minutes
      }
    case 'private':
      return {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120' // 1 minute private cache
      }
    case 'no-cache':
    default:
      return {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
  }
}

/**
 * API middleware wrapper for consistent error handling and response formatting
 */
export function withApiMiddleware<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<ApiResponse<T>>>,
  options: {
    requireAuth?: boolean
    rateLimit?: {
      requests: number
      window: number // in seconds
    }
    cors?: boolean
    cache?: 'static' | 'dynamic' | 'private' | 'no-cache'
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Handle CORS preflight
      if (options.cors && request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: getCorsHeaders()
        })
      }
      
      // Apply rate limiting if configured
      if (options.rateLimit) {
        const identifier = request.ip || 'anonymous'
        const isAllowed = await rateLimit(
          identifier,
          options.rateLimit.requests,
          options.rateLimit.window
        )
        
        if (!isAllowed) {
          return createRateLimitError()
        }
      }
      
      // Execute the handler
      const response = await handler(request, context)
      
      // Add standard headers
      const headers: Record<string, string> = {}
      
      if (options.cors) {
        Object.assign(headers, getCorsHeaders())
      }
      
      if (options.cache) {
        Object.assign(headers, getCacheHeaders(options.cache))
      }
      
      // Apply headers to response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
      
    } catch (error) {
      console.error('API middleware error:', error)
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return createValidationError('Invalid request data', error.message)
      }
      
      // Handle other known errors
      if (error instanceof Error) {
        switch (error.message) {
          case 'UNAUTHORIZED':
            return createUnauthorizedError()
          case 'FORBIDDEN':
            return createForbiddenError()
          case 'NOT_FOUND':
            return createNotFoundError()
          default:
            return createInternalError(
              process.env.NODE_ENV === 'development' ? error.message : undefined
            )
        }
      }
      
      return createInternalError()
    }
  }
}

/**
 * Request body parser with validation
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  schema?: any
): Promise<T> {
  try {
    const body = await request.json()
    
    if (schema) {
      return schema.parse(body)
    }
    
    return body
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in request body')
    }
    throw error
  }
}

/**
 * Query parameter parser with validation
 */
export function parseQueryParams(
  searchParams: URLSearchParams,
  schema?: any
): Record<string, any> {
  const params: Record<string, any> = {}
  
  for (const [key, value] of searchParams.entries()) {
    // Handle array parameters (e.g., categoryIds[]=1&categoryIds[]=2)
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2)
      if (!params[arrayKey]) {
        params[arrayKey] = []
      }
      params[arrayKey].push(value)
    }
    // Handle multiple values for same key
    else if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value)
      } else {
        params[key] = [params[key], value]
      }
    }
    // Handle single values
    else {
      // Try to parse numbers and booleans
      if (value === 'true') {
        params[key] = true
      } else if (value === 'false') {
        params[key] = false
      } else if (value === 'null') {
        params[key] = null
      } else if (value === 'undefined') {
        params[key] = undefined
      } else if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value)
      } else {
        params[key] = value
      }
    }
  }
  
  if (schema) {
    return schema.parse(params)
  }
  
  return params
}

/**
 * Response timing middleware
 */
export function withTiming<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const start = Date.now()
    
    const response = await handler(request, context)
    
    const duration = Date.now() - start
    response.headers.set('X-Response-Time', `${duration}ms`)
    
    return response
  }
}

/**
 * Request logging middleware
 */
export function withLogging<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const start = Date.now()
    const { method, url } = request
    
    console.log(`[API] ${method} ${url} - Started`)
    
    try {
      const response = await handler(request, context)
      const duration = Date.now() - start
      
      console.log(`[API] ${method} ${url} - ${response.status} (${duration}ms)`)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(`[API] ${method} ${url} - Error (${duration}ms):`, error)
      throw error
    }
  }
} 
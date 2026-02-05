// ============================================
// ZID Dashboard - Store Detection API
// API route for detecting store metadata (OG tags, favicon)
// ============================================

import { NextRequest, NextResponse } from 'next/server'

interface DetectionResult {
  store_name: string | null
  store_logo_url: string | null
  favicon_url: string | null
  description: string | null
}

/**
 * POST /api/stores/detect
 * Detect store metadata from URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

    // Fetch the page
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let response: Response
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ZidDashboard/1.0; +https://zid.sa)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ar,en;q=0.9'
        }
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        store_name: null,
        store_logo_url: null,
        favicon_url: null,
        description: null,
        error: 'Failed to fetch URL'
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        store_name: null,
        store_logo_url: null,
        favicon_url: null,
        description: null,
        error: `HTTP ${response.status}`
      })
    }

    const html = await response.text()
    const result = parseMetadata(html, normalizedUrl)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Detection error:', error)
    return NextResponse.json(
      { 
        store_name: null,
        store_logo_url: null,
        favicon_url: null,
        description: null,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * Parse HTML for OG tags and other metadata
 */
function parseMetadata(html: string, baseUrl: string): DetectionResult {
  const result: DetectionResult = {
    store_name: null,
    store_logo_url: null,
    favicon_url: null,
    description: null
  }

  try {
    // Extract OG title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)
    
    if (ogTitleMatch) {
      result.store_name = decodeHtmlEntities(ogTitleMatch[1])
    } else {
      // Fallback to <title> tag
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) {
        result.store_name = decodeHtmlEntities(titleMatch[1].trim())
      }
    }

    // Extract OG image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    
    if (ogImageMatch) {
      result.store_logo_url = resolveUrl(ogImageMatch[1], baseUrl)
    }

    // Extract favicon as fallback
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
    
    if (faviconMatch) {
      result.favicon_url = resolveUrl(faviconMatch[1], baseUrl)
    } else {
      // Default favicon location
      result.favicon_url = resolveUrl('/favicon.ico', baseUrl)
    }

    // If no OG image, use favicon as logo
    if (!result.store_logo_url && result.favicon_url) {
      result.store_logo_url = result.favicon_url
    }

    // Extract description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    
    if (ogDescMatch) {
      result.description = decodeHtmlEntities(ogDescMatch[1])
    }

  } catch (error) {
    console.error('Parse error:', error)
  }

  return result
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    const base = new URL(baseUrl)
    if (url.startsWith('/')) {
      return `${base.origin}${url}`
    }
    return `${base.origin}/${url}`
  } catch {
    return url
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
}

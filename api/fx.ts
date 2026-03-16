// Vercel Serverless Function — fetches exchange rates
// BCB official + dolarboliviahoy.com parallel rate

export const config = { runtime: 'edge' }

interface FxResult {
  bcb_compra: number | null
  bcb_venta: number | null
  paralelo_compra: number | null
  paralelo_venta: number | null
  sources: Record<string, string>
  timestamp: string
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
    })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchBCB(): Promise<{ compra: number | null; venta: number | null }> {
  try {
    const res = await fetchWithTimeout('https://www.bcb.gob.bo/?q=cotizaciones_tc')
    const html = await res.text()
    // Look for the exchange rate values in the page
    const ratePattern = /(\d+[.,]\d{2})\s*(?:Bs|BOB)/gi
    const matches = [...html.matchAll(ratePattern)]
    if (matches.length >= 2) {
      return {
        compra: parseFloat(matches[0][1].replace(',', '.')),
        venta: parseFloat(matches[1][1].replace(',', '.')),
      }
    }
    // Try alternative pattern
    const altPattern = /compra[^>]*>[\s]*([\d.,]+)/i
    const altMatch = html.match(altPattern)
    if (altMatch) {
      return {
        compra: parseFloat(altMatch[1].replace(',', '.')),
        venta: parseFloat(altMatch[1].replace(',', '.')),
      }
    }
    return { compra: null, venta: null }
  } catch {
    return { compra: null, venta: null }
  }
}

async function fetchParalelo(): Promise<{ compra: number | null; venta: number | null }> {
  try {
    const res = await fetchWithTimeout('https://www.dolarboliviahoy.com/')
    const html = await res.text()
    // dolarboliviahoy shows compra/venta prices
    const patterns = [
      /compra[^>]*>[\s]*([\d.,]+)/i,
      /venta[^>]*>[\s]*([\d.,]+)/i,
    ]
    // Try to find JSON data in Next.js page props
    const jsonMatch = html.match(/__NEXT_DATA__[^>]*>([^<]+)</)
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1])
        const props = JSON.stringify(data)
        const priceMatches = [...props.matchAll(/"(?:compra|buy)":\s*([\d.]+)/gi)]
        const ventaMatches = [...props.matchAll(/"(?:venta|sell)":\s*([\d.]+)/gi)]
        if (priceMatches.length > 0 && ventaMatches.length > 0) {
          return {
            compra: parseFloat(priceMatches[0][1]),
            venta: parseFloat(ventaMatches[0][1]),
          }
        }
      } catch { /* ignore JSON parse errors */ }
    }

    // Fallback: try regex on HTML
    const allPrices = [...html.matchAll(/([\d]{1,2}[.,]\d{1,2})/g)]
      .map(m => parseFloat(m[1].replace(',', '.')))
      .filter(n => n > 6 && n < 20) // reasonable BOB/USD range

    if (allPrices.length >= 2) {
      allPrices.sort((a, b) => a - b)
      return {
        compra: allPrices[0],
        venta: allPrices[allPrices.length - 1],
      }
    }

    return { compra: null, venta: null }
  } catch {
    return { compra: null, venta: null }
  }
}

export default async function handler(req: Request): Promise<Response> {
  const [bcb, paralelo] = await Promise.allSettled([fetchBCB(), fetchParalelo()])

  const result: FxResult = {
    bcb_compra: null,
    bcb_venta: null,
    paralelo_compra: null,
    paralelo_venta: null,
    sources: {},
    timestamp: new Date().toISOString(),
  }

  if (bcb.status === 'fulfilled') {
    result.bcb_compra = bcb.value.compra
    result.bcb_venta = bcb.value.venta
    if (bcb.value.compra) result.sources.bcb = 'BCB oficial'
  }

  if (paralelo.status === 'fulfilled') {
    result.paralelo_compra = paralelo.value.compra
    result.paralelo_venta = paralelo.value.venta
    if (paralelo.value.compra) result.sources.paralelo = 'dolarboliviahoy.com'
  }

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=1800, stale-while-revalidate=900',
    },
  })
}

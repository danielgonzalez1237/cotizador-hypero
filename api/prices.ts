// Vercel Serverless Function — fetches international metal spot prices
// Sources: GoldSilver.ai, TradingEconomics (fallback: static defaults)

export const config = { runtime: 'edge' }

interface PriceResult {
  tin: number | null
  tungsten: number | null
  copper: number | null
  antimony: number | null
  silver: number | null
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

// GoldSilver.ai — scrapes price from their metal-prices pages
async function fetchGoldSilver(metal: string): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(`https://goldsilver.ai/metal-prices/${metal}`)
    const html = await res.text()
    // Look for price pattern in the HTML — GoldSilver shows prices prominently
    const patterns = [
      /\$[\s]*([\d,]+\.?\d*)\s*(?:\/\s*(?:t|ton|oz|lb))/i,
      /price[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
      /"price"[:\s]*([\d,]+\.?\d*)/i,
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''))
      }
    }
    return null
  } catch {
    return null
  }
}

// Westmetall — LME cash prices in table format
async function fetchWestmetall(field: string): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.westmetall.com/en/markdaten.php?action=table&field=${field}`
    )
    const html = await res.text()
    // Table has dates and prices, get most recent (first data row)
    const priceMatch = html.match(/<td[^>]*>\s*([\d.,]+)\s*<\/td>/g)
    if (priceMatch && priceMatch.length > 1) {
      const numStr = priceMatch[1].replace(/<[^>]*>/g, '').trim().replace(/,/g, '')
      const val = parseFloat(numStr)
      if (!isNaN(val) && val > 0) return val
    }
    return null
  } catch {
    return null
  }
}

// BusinessAnalytiq — scrapes tungsten APT and antimony prices
async function fetchBusinessAnalytiq(index: string): Promise<number | null> {
  try {
    const res = await fetchWithTimeout(
      `https://businessanalytiq.com/procurementanalytics/index/${index}/`
    )
    const html = await res.text()
    // Look for price values in text or data attributes
    const patterns = [
      /(?:current|latest|price)[^>]*>[\s$]*([\d,]+\.?\d*)/i,
      /\$([\d,]+\.?\d*)\s*(?:\/\s*MTU|per\s*MTU)/i,
      /USD\s*([\d,]+\.?\d*)/i,
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''))
      }
    }
    return null
  } catch {
    return null
  }
}

export default async function handler(req: Request): Promise<Response> {
  const result: PriceResult = {
    tin: null,
    tungsten: null,
    copper: null,
    antimony: null,
    silver: null,
    sources: {},
    timestamp: new Date().toISOString(),
  }

  // Fetch all in parallel
  const [
    tinWest, tinGS,
    copperWest, copperGS,
    silverWest, silverGS,
    tungstenBA,
    antimonyBA,
  ] = await Promise.allSettled([
    fetchWestmetall('LME_Sn_cash'),
    fetchGoldSilver('tin'),
    fetchWestmetall('LME_Cu_cash'),
    fetchGoldSilver('copper'),
    fetchWestmetall('Ag'),
    fetchGoldSilver('silver'),
    fetchBusinessAnalytiq('tungsten-price-index'),
    fetchBusinessAnalytiq('antimony-price-index'),
  ])

  // Tin — USD/ton
  if (tinWest.status === 'fulfilled' && tinWest.value) {
    result.tin = tinWest.value
    result.sources.tin = 'Westmetall LME'
  } else if (tinGS.status === 'fulfilled' && tinGS.value) {
    result.tin = tinGS.value
    result.sources.tin = 'GoldSilver.ai'
  }

  // Copper — from Westmetall comes as USD/ton already
  if (copperWest.status === 'fulfilled' && copperWest.value) {
    result.copper = copperWest.value
    result.sources.copper = 'Westmetall LME'
  } else if (copperGS.status === 'fulfilled' && copperGS.value) {
    result.copper = copperGS.value
    result.sources.copper = 'GoldSilver.ai'
  }

  // Silver — USD/oz
  if (silverWest.status === 'fulfilled' && silverWest.value) {
    result.silver = silverWest.value
    result.sources.silver = 'Westmetall'
  } else if (silverGS.status === 'fulfilled' && silverGS.value) {
    result.silver = silverGS.value
    result.sources.silver = 'GoldSilver.ai'
  }

  // Tungsten — APT USD/MTU
  if (tungstenBA.status === 'fulfilled' && tungstenBA.value) {
    result.tungsten = tungstenBA.value
    result.sources.tungsten = 'BusinessAnalytiq'
  }

  // Antimony — USD/kg or USD/ton
  if (antimonyBA.status === 'fulfilled' && antimonyBA.value) {
    result.antimony = antimonyBA.value
    result.sources.antimony = 'BusinessAnalytiq'
  }

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800',
    },
  })
}

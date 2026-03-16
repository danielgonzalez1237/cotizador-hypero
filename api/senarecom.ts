// Vercel Serverless Function — fetches SENARECOM mineral quotations
// Source: senarecom.gob.bo sidebar

export const config = { runtime: 'edge' }

interface SenarecomMineral {
  mineral: string
  valor: number
  unidad: string
}

interface SenarecomResult {
  periodo: string | null
  cotizaciones: SenarecomMineral[]
  source: string
  timestamp: string
}

async function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
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

export default async function handler(req: Request): Promise<Response> {
  const result: SenarecomResult = {
    periodo: null,
    cotizaciones: [],
    source: 'senarecom.gob.bo',
    timestamp: new Date().toISOString(),
  }

  try {
    const res = await fetchWithTimeout('https://www.senarecom.gob.bo/')
    const html = await res.text()

    // Extract period (e.g., "2da Quincena Marzo 2026")
    const periodoMatch = html.match(
      /(\d+[a-z]*\s*quincena\s+[a-z]+\s+\d{4})/i
    )
    if (periodoMatch) {
      result.periodo = periodoMatch[1]
    }

    // Extract mineral prices from the sidebar table
    // SENARECOM shows: mineral name, value, unit (USD/LF, USD/OT, USD/TM)
    const mineralPatterns = [
      { name: 'zinc', pattern: /zinc[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'estano', pattern: /esta[ñn]o[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'oro', pattern: /oro(?!\s*(?:sulf|yac))[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'plata', pattern: /plata[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'antimonio', pattern: /antimonio[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'wolfram', pattern: /wolfram|tungsteno[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'cobre', pattern: /cobre[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'plomo', pattern: /plomo[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
      { name: 'bismuto', pattern: /bismuto[^<]*<[^>]*>\s*([\d.,]+)\s*<[^>]*>\s*(USD\/\w+)/i },
    ]

    for (const { name, pattern } of mineralPatterns) {
      const match = html.match(pattern)
      if (match) {
        result.cotizaciones.push({
          mineral: name,
          valor: parseFloat(match[1].replace(/,/g, '')),
          unidad: match[2],
        })
      }
    }

    // Alternative: try to find a table with all prices
    if (result.cotizaciones.length === 0) {
      // Look for table rows with mineral data
      const rowPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>([\w\sáéíóúñ]+)<\/td>[\s\S]*?<td[^>]*>([\d.,]+)<\/td>[\s\S]*?<td[^>]*>(USD\/\w+)<\/td>[\s\S]*?<\/tr>/gi
      let rowMatch
      while ((rowMatch = rowPattern.exec(html)) !== null) {
        result.cotizaciones.push({
          mineral: rowMatch[1].trim().toLowerCase(),
          valor: parseFloat(rowMatch[2].replace(/,/g, '')),
          unidad: rowMatch[3],
        })
      }
    }
  } catch (e) {
    // Return empty result on error — frontend will use defaults
  }

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=43200, stale-while-revalidate=21600', // 12h cache (quincenal data)
    },
  })
}

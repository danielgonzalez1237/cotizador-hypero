import type { MineralId } from '../data/minerals'

interface PricesResponse {
  tin: number | null
  tungsten: number | null
  copper: number | null
  antimony: number | null
  silver: number | null
  sources: Record<string, string>
  timestamp: string
}

interface FxResponse {
  bcb_compra: number | null
  bcb_venta: number | null
  paralelo_compra: number | null
  paralelo_venta: number | null
  sources: Record<string, string>
  timestamp: string
}

interface SenarecomMineral {
  mineral: string
  valor: number
  unidad: string
}

interface SenarecomResponse {
  periodo: string | null
  cotizaciones: SenarecomMineral[]
  timestamp: string
}

// Map SENARECOM mineral names to our IDs
const SENARECOM_MAP: Record<string, MineralId> = {
  estano: 'tin',
  wolfram: 'tungsten',
  tungsteno: 'tungsten',
  cobre: 'copper',
  antimonio: 'antimony',
  plata: 'silver',
}

export async function fetchPrices(): Promise<PricesResponse | null> {
  try {
    const res = await fetch('/api/prices')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchFxRates(): Promise<FxResponse | null> {
  try {
    const res = await fetch('/api/fx')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchSenarecom(): Promise<SenarecomResponse | null> {
  try {
    const res = await fetch('/api/senarecom')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export { SENARECOM_MAP }
export type { PricesResponse, FxResponse, SenarecomResponse, SenarecomMineral }

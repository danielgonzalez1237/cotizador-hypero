export type MineralId = 'tin' | 'tungsten' | 'copper' | 'antimony' | 'silver'

export interface MineralInfo {
  id: MineralId
  name: string
  nameEs: string
  symbol: string
  unit: string
  unitLabel: string
  color: string
  defaultPrice: number
  senarecomPrice: number
  senarecomUnit: string
  senarecomPricePerTon: number
  conversionToTon: (price: number) => number
}

// Conversion constants
const LB_PER_TON = 2204.62
const OZ_PER_TON = 32150.7

export const MINERALS: Record<MineralId, MineralInfo> = {
  tin: {
    id: 'tin',
    name: 'Tin',
    nameEs: 'Estano',
    symbol: 'Sn',
    unit: 'USD/ton',
    unitLabel: 'USD/TM',
    color: '#3b82f6',
    defaultPrice: 48500,
    senarecomPrice: 22.86,
    senarecomUnit: 'USD/LF',
    senarecomPricePerTon: 22.86 * LB_PER_TON,
    conversionToTon: (p) => p, // already in USD/ton
  },
  tungsten: {
    id: 'tungsten',
    name: 'Tungsten',
    nameEs: 'Tungsteno/Wolfram',
    symbol: 'W',
    unit: 'USD/MTU',
    unitLabel: 'USD/TM conc. 65%',
    color: '#8b5cf6',
    defaultPrice: 1975, // APT price per MTU
    senarecomPrice: 132979.5,
    senarecomUnit: 'USD/TM',
    senarecomPricePerTon: 132979.5,
    conversionToTon: (aptPerMtu) => aptPerMtu * 65, // 65 MTU per ton of 65% concentrate
  },
  copper: {
    id: 'copper',
    name: 'Copper',
    nameEs: 'Cobre',
    symbol: 'Cu',
    unit: 'USD/lb',
    unitLabel: 'USD/TM',
    color: '#f59e0b',
    defaultPrice: 5.84,
    senarecomPrice: 5.84,
    senarecomUnit: 'USD/LF',
    senarecomPricePerTon: 5.84 * LB_PER_TON,
    conversionToTon: (p) => p * LB_PER_TON,
  },
  antimony: {
    id: 'antimony',
    name: 'Antimony',
    nameEs: 'Antimonio',
    symbol: 'Sb',
    unit: 'USD/ton',
    unitLabel: 'USD/TM',
    color: '#ef4444',
    defaultPrice: 34050,
    senarecomPrice: 24000,
    senarecomUnit: 'USD/TM',
    senarecomPricePerTon: 24000,
    conversionToTon: (p) => p,
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    nameEs: 'Plata',
    symbol: 'Ag',
    unit: 'USD/oz',
    unitLabel: 'USD/OT',
    color: '#6b7280',
    defaultPrice: 85.82,
    senarecomPrice: 85.82,
    senarecomUnit: 'USD/OT',
    senarecomPricePerTon: 85.82 * OZ_PER_TON,
    conversionToTon: (p) => p * OZ_PER_TON,
  },
}

export const MINERAL_LIST = Object.values(MINERALS)

// Generate fake historical data for charts
export function generateHistoricalData(mineral: MineralInfo, days: number) {
  const data = []
  const now = Date.now()
  const basePrice = mineral.id === 'tungsten' ? mineral.conversionToTon(mineral.defaultPrice) : mineral.defaultPrice
  const volatility = basePrice * 0.02

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const noise = (Math.random() - 0.5) * 2 * volatility
    const trend = Math.sin(i / 30) * volatility * 0.5
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round((basePrice + noise + trend) * 100) / 100,
      senarecom: mineral.senarecomPricePerTon,
    })
  }
  return data
}

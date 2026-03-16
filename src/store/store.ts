import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MineralId } from '../data/minerals'

export type FxType = 'bcb_compra' | 'bcb_venta' | 'paralelo_compra' | 'paralelo_venta' | 'custom'

interface FxRates {
  bcb_compra: number
  bcb_venta: number
  paralelo_compra: number
  paralelo_venta: number
  custom: number
}

interface SpotPrices {
  tin: number
  tungsten: number
  copper: number
  antimony: number
  silver: number
}

interface AppState {
  fxRates: FxRates
  selectedFx: FxType
  spotPrices: SpotPrices
  lastUpdated: string
  setFxRate: (type: keyof FxRates, rate: number) => void
  setSelectedFx: (fx: FxType) => void
  setSpotPrice: (mineral: MineralId, price: number) => void
  getFxRate: () => number
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      fxRates: {
        bcb_compra: 6.96,
        bcb_venta: 6.96,
        paralelo_compra: 10.5,
        paralelo_venta: 11.0,
        custom: 6.96,
      },
      selectedFx: 'bcb_compra',
      spotPrices: {
        tin: 48500,
        tungsten: 1975,
        copper: 5.84,
        antimony: 34050,
        silver: 85.82,
      },
      lastUpdated: new Date().toISOString(),
      setFxRate: (type, rate) =>
        set((s) => ({ fxRates: { ...s.fxRates, [type]: rate } })),
      setSelectedFx: (fx) => set({ selectedFx: fx }),
      setSpotPrice: (mineral, price) =>
        set((s) => ({
          spotPrices: { ...s.spotPrices, [mineral]: price },
          lastUpdated: new Date().toISOString(),
        })),
      getFxRate: () => {
        const s = get()
        return s.fxRates[s.selectedFx]
      },
    }),
    { name: 'hypero-cotizador' }
  )
)

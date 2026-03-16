import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MineralId } from '../data/minerals'
import { fetchPrices, fetchFxRates, fetchSenarecom, SENARECOM_MAP } from '../lib/fetcher'

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

interface SenarecomData {
  periodo: string
  estano: number
  wolfram: number
  cobre: number
  antimonio: number
  plata: number
}

interface AppState {
  fxRates: FxRates
  selectedFx: FxType
  spotPrices: SpotPrices
  senarecom: SenarecomData
  lastUpdated: string
  loading: boolean
  dataSources: Record<string, string>
  setFxRate: (type: keyof FxRates, rate: number) => void
  setSelectedFx: (fx: FxType) => void
  setSpotPrice: (mineral: MineralId, price: number) => void
  getFxRate: () => number
  refreshAll: () => Promise<void>
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
      senarecom: {
        periodo: '2da Quincena Marzo 2026',
        estano: 22.86,
        wolfram: 132979.5,
        cobre: 5.84,
        antimonio: 24000,
        plata: 85.82,
      },
      lastUpdated: new Date().toISOString(),
      loading: false,
      dataSources: {},

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

      refreshAll: async () => {
        set({ loading: true })
        const sources: Record<string, string> = {}

        // Fetch all data in parallel
        const [pricesData, fxData, senarecomData] = await Promise.allSettled([
          fetchPrices(),
          fetchFxRates(),
          fetchSenarecom(),
        ])

        // Update spot prices
        if (pricesData.status === 'fulfilled' && pricesData.value) {
          const p = pricesData.value
          const updates: Partial<SpotPrices> = {}
          if (p.tin !== null) updates.tin = p.tin
          if (p.tungsten !== null) updates.tungsten = p.tungsten
          if (p.copper !== null) updates.copper = p.copper
          if (p.antimony !== null) updates.antimony = p.antimony
          if (p.silver !== null) updates.silver = p.silver
          Object.assign(sources, p.sources)

          if (Object.keys(updates).length > 0) {
            set((s) => ({ spotPrices: { ...s.spotPrices, ...updates } }))
          }
        }

        // Update FX rates
        if (fxData.status === 'fulfilled' && fxData.value) {
          const fx = fxData.value
          set((s) => ({
            fxRates: {
              ...s.fxRates,
              ...(fx.bcb_compra !== null ? { bcb_compra: fx.bcb_compra } : {}),
              ...(fx.bcb_venta !== null ? { bcb_venta: fx.bcb_venta } : {}),
              ...(fx.paralelo_compra !== null ? { paralelo_compra: fx.paralelo_compra } : {}),
              ...(fx.paralelo_venta !== null ? { paralelo_venta: fx.paralelo_venta } : {}),
            },
          }))
          Object.assign(sources, fx.sources)
        }

        // Update SENARECOM
        if (senarecomData.status === 'fulfilled' && senarecomData.value) {
          const sen = senarecomData.value
          if (sen.cotizaciones.length > 0) {
            const senUpdate: Partial<SenarecomData> = {}
            if (sen.periodo) senUpdate.periodo = sen.periodo
            for (const cot of sen.cotizaciones) {
              const mineralName = cot.mineral.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              if (mineralName.includes('estano') || mineralName.includes('tin')) senUpdate.estano = cot.valor
              if (mineralName.includes('wolfram') || mineralName.includes('tungsten')) senUpdate.wolfram = cot.valor
              if (mineralName.includes('cobre') || mineralName.includes('copper')) senUpdate.cobre = cot.valor
              if (mineralName.includes('antimonio') || mineralName.includes('antimony')) senUpdate.antimonio = cot.valor
              if (mineralName.includes('plata') || mineralName.includes('silver')) senUpdate.plata = cot.valor
            }
            set((s) => ({ senarecom: { ...s.senarecom, ...senUpdate } }))
            sources.senarecom = 'senarecom.gob.bo'
          }
        }

        set({
          loading: false,
          lastUpdated: new Date().toISOString(),
          dataSources: sources,
        })
      },
    }),
    { name: 'hypero-cotizador' }
  )
)

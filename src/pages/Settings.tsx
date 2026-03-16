import { MINERAL_LIST } from '../data/minerals'
import type { MineralId } from '../data/minerals'
import { useStore } from '../store/store'

export default function Settings() {
  const { spotPrices, setSpotPrice, fxRates, setFxRate } = useStore()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuracion</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="font-semibold text-gray-300 mb-4">Precios Spot (editar manualmente)</h2>
          <div className="space-y-3">
            {MINERAL_LIST.map((m) => (
              <div key={m.id}>
                <label className="block text-sm text-gray-400 mb-1">
                  {m.nameEs} ({m.symbol}) — {m.unit}
                </label>
                <input
                  type="number"
                  value={spotPrices[m.id]}
                  onChange={(e) => setSpotPrice(m.id as MineralId, Number(e.target.value))}
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="font-semibold text-gray-300 mb-4">Tasas de Cambio (BOB por 1 USD)</h2>
          <div className="space-y-3">
            {[
              { key: 'bcb_compra' as const, label: 'BCB Compra' },
              { key: 'bcb_venta' as const, label: 'BCB Venta' },
              { key: 'paralelo_compra' as const, label: 'Dolar Paralelo Compra' },
              { key: 'paralelo_venta' as const, label: 'Dolar Paralelo Venta' },
              { key: 'custom' as const, label: 'Custom' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input
                  type="number"
                  value={fxRates[key]}
                  onChange={(e) => setFxRate(key, Number(e.target.value))}
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

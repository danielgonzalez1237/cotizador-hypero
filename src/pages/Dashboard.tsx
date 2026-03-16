import { MINERAL_LIST } from '../data/minerals'
import type { MineralInfo } from '../data/minerals'
import { useStore } from '../store/store'

function MineralCard({ mineral }: { mineral: MineralInfo }) {
  const { spotPrices, getFxRate } = useStore()
  const spotRaw = spotPrices[mineral.id]
  const spotPerTon = mineral.conversionToTon(spotRaw)
  const senarecomPerTon = mineral.senarecomPricePerTon
  const delta = ((spotPerTon - senarecomPerTon) / senarecomPerTon) * 100
  const fxRate = getFxRate()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mineral.color }} />
          <h3 className="font-semibold text-white">{mineral.nameEs}</h3>
          <span className="text-xs text-gray-500">({mineral.symbol})</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Spot Internacional</span>
          <div className="text-right">
            <div className="text-white font-mono font-semibold">
              ${spotPerTon.toLocaleString('en-US', { maximumFractionDigits: 0 })} /TM
            </div>
            <div className="text-xs text-gray-500">
              {spotRaw.toLocaleString('en-US', { maximumFractionDigits: 2 })} {mineral.unit}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Spot en BOB</span>
          <span className="text-yellow-400 font-mono">
            Bs {(spotPerTon * fxRate).toLocaleString('en-US', { maximumFractionDigits: 0 })} /TM
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">SENARECOM</span>
          <div className="text-right">
            <div className="text-cyan-400 font-mono">
              ${senarecomPerTon.toLocaleString('en-US', { maximumFractionDigits: 0 })} /TM
            </div>
            <div className="text-xs text-gray-500">
              {mineral.senarecomPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} {mineral.senarecomUnit}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-2 flex justify-between">
          <span className="text-gray-400 text-sm">Delta Spot vs SENARECOM</span>
          <span className={`font-mono font-semibold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { lastUpdated } = useStore()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard de Precios</h1>
        <span className="text-xs text-gray-500">
          Actualizado: {new Date(lastUpdated).toLocaleString('es-BO')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MINERAL_LIST.map((m) => (
          <MineralCard key={m.id} mineral={m} />
        ))}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">SENARECOM — 2da Quincena Marzo 2026</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Mineral</th>
                <th className="text-right py-2 px-4">Cotizacion</th>
                <th className="text-right py-2 px-4">Unidad</th>
                <th className="text-right py-2 pl-4">USD/TM</th>
              </tr>
            </thead>
            <tbody>
              {MINERAL_LIST.map((m) => (
                <tr key={m.id} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.nameEs}
                  </td>
                  <td className="text-right py-2 px-4 font-mono text-cyan-400">
                    ${m.senarecomPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right py-2 px-4 text-gray-500">{m.senarecomUnit}</td>
                  <td className="text-right py-2 pl-4 font-mono">
                    ${m.senarecomPricePerTon.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

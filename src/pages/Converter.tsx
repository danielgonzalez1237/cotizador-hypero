import { useState } from 'react'
import { MINERALS, MINERAL_LIST } from '../data/minerals'
import type { MineralId } from '../data/minerals'
import { useStore } from '../store/store'

type Unit = 'ton' | 'kg' | 'lb' | 'oz'

const UNIT_TO_TON: Record<Unit, number> = {
  ton: 1,
  kg: 0.001,
  lb: 1 / 2204.62,
  oz: 1 / 32150.7,
}

const UNIT_LABELS: Record<Unit, string> = {
  ton: 'Toneladas metricas',
  kg: 'Kilogramos',
  lb: 'Libras',
  oz: 'Onzas troy',
}

export default function Converter() {
  const { spotPrices, getFxRate, fxRates } = useStore()
  const [mineral, setMineral] = useState<MineralId>('tin')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState<Unit>('ton')

  const m = MINERALS[mineral]
  const spotRaw = spotPrices[mineral]
  const spotPerTon = m.conversionToTon(spotRaw)
  const tons = quantity * UNIT_TO_TON[unit]
  const valueUsd = spotPerTon * tons
  const fxRate = getFxRate()
  const valueBob = valueUsd * fxRate

  const senarecomPerTon = m.senarecomPricePerTon
  const valueSenarecom = senarecomPerTon * tons

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Conversor de Tasas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="font-semibold mb-4 text-gray-300">Entrada</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mineral</label>
              <select
                value={mineral}
                onChange={(e) => setMineral(e.target.value as MineralId)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {MINERAL_LIST.map((m) => (
                  <option key={m.id} value={m.id}>{m.nameEs} ({m.symbol})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={0}
                step="0.01"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {Object.entries(UNIT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="font-semibold mb-4 text-gray-300">Resultado</h2>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Valor a Precio Spot</div>
              <div className="text-2xl font-bold text-white font-mono">
                ${valueUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
              </div>
              <div className="text-lg text-yellow-400 font-mono mt-1">
                Bs {valueBob.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Tasa: {fxRate.toFixed(2)} Bs/$
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Valor a Precio SENARECOM</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                ${valueSenarecom.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
              </div>
              <div className="text-lg text-yellow-400 font-mono mt-1">
                Bs {(valueSenarecom * fxRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Comparacion de Tasas</div>
              <table className="w-full text-sm mt-2">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-1 text-gray-400">BCB Oficial</td>
                    <td className="py-1 text-right font-mono">Bs {(valueUsd * fxRates.bcb_compra).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-1 text-gray-400">Paralelo Compra</td>
                    <td className="py-1 text-right font-mono">Bs {(valueUsd * fxRates.paralelo_compra).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-400">Paralelo Venta</td>
                    <td className="py-1 text-right font-mono">Bs {(valueUsd * fxRates.paralelo_venta).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

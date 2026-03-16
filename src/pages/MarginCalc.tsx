import { useState, useMemo } from 'react'
import { MINERALS, MINERAL_LIST } from '../data/minerals'
import type { MineralId } from '../data/minerals'
import { useStore } from '../store/store'

interface FeeInput {
  senarecom: number
  toll: number
  iva: number
  cooperativa: number
  transporte: number
  regalias: number
  otros: number
}

export default function MarginCalc() {
  const { spotPrices, getFxRate } = useStore()
  const [mineral, setMineral] = useState<MineralId>('silver')
  const [tonnage, setTonnage] = useState(1)
  const [grade, setGrade] = useState(0.03) // 3% = 300 g/TM for silver example
  const [recovery, setRecovery] = useState(0.7)
  const [priceRef, setPriceRef] = useState<'senarecom' | 'spot' | 'custom'>('senarecom')
  const [customPrice, setCustomPrice] = useState(0)
  const [fees, setFees] = useState<FeeInput>({
    senarecom: 1.5,
    toll: 50,
    iva: 13,
    cooperativa: 2,
    transporte: 30,
    regalias: 5,
    otros: 0,
  })

  const m = MINERALS[mineral]
  const fxRate = getFxRate()
  const spotPerTon = m.conversionToTon(spotPrices[mineral])

  const results = useMemo(() => {
    const sellingPricePerTon =
      priceRef === 'senarecom' ? m.senarecomPricePerTon
      : priceRef === 'spot' ? spotPerTon
      : customPrice

    // Fine content recovered
    const fineContentTon = tonnage * grade * recovery
    const revenueBruto = fineContentTon * sellingPricePerTon

    // Fee calculations
    const feeSenarecom = revenueBruto * (fees.senarecom / 100)
    const feeToll = tonnage * fees.toll
    const feeIva = revenueBruto * (fees.iva / 100)
    const feeCooperativa = revenueBruto * (fees.cooperativa / 100)
    const feeTransporte = tonnage * fees.transporte
    const feeRegalias = revenueBruto * (fees.regalias / 100)
    const feeOtros = fees.otros

    const totalFees = feeSenarecom + feeToll + feeIva + feeCooperativa + feeTransporte + feeRegalias + feeOtros
    const margenNeto = revenueBruto - totalFees
    const margenPct = revenueBruto > 0 ? (margenNeto / revenueBruto) * 100 : 0

    // Breakeven calculations
    const breakevenGrade = totalFees / (tonnage * recovery * sellingPricePerTon) || 0
    const breakevenRecovery = totalFees / (tonnage * grade * sellingPricePerTon) || 0

    return {
      sellingPricePerTon,
      fineContentTon,
      revenueBruto,
      fees: {
        senarecom: feeSenarecom,
        toll: feeToll,
        iva: feeIva,
        cooperativa: feeCooperativa,
        transporte: feeTransporte,
        regalias: feeRegalias,
        otros: feeOtros,
      },
      totalFees,
      margenNeto,
      margenPct,
      breakevenGrade,
      breakevenRecovery,
    }
  }, [mineral, tonnage, grade, recovery, priceRef, customPrice, fees, spotPerTon, m])

  const updateFee = (key: keyof FeeInput, value: number) =>
    setFees((f) => ({ ...f, [key]: value }))

  const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calculador de Margenes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="font-semibold text-gray-300 mb-3">Compra</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mineral</label>
                <select value={mineral} onChange={(e) => setMineral(e.target.value as MineralId)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                  {MINERAL_LIST.map((m) => <option key={m.id} value={m.id}>{m.nameEs}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tonelaje (TM)</label>
                <input type="number" value={tonnage} onChange={(e) => setTonnage(Number(e.target.value))}
                  min={0} step="0.1"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ley (%) — {(grade * 100).toFixed(2)}%</label>
                <input type="range" value={grade} onChange={(e) => setGrade(Number(e.target.value))}
                  min={0} max={1} step={0.001}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Recuperacion (%) — {(recovery * 100).toFixed(0)}%</label>
                <input type="range" value={recovery} onChange={(e) => setRecovery(Number(e.target.value))}
                  min={0} max={1} step={0.01}
                  className="w-full accent-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="font-semibold text-gray-300 mb-3">Precio de Venta</h2>
            <div className="space-y-2">
              {(['senarecom', 'spot', 'custom'] as const).map((ref) => (
                <label key={ref} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="priceRef" value={ref}
                    checked={priceRef === ref} onChange={() => setPriceRef(ref)}
                    className="accent-blue-500" />
                  <span className="text-gray-300">
                    {ref === 'senarecom' ? 'SENARECOM' : ref === 'spot' ? 'Spot Internacional' : 'Custom'}
                  </span>
                </label>
              ))}
              {priceRef === 'custom' && (
                <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))}
                  placeholder="USD/TM"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono mt-2" />
              )}
              <div className="text-xs text-gray-500 mt-1">
                Ref: ${fmt(results.sellingPricePerTon)} /TM
              </div>
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="font-semibold text-gray-300 mb-3">Costos / Fees</h2>
          <div className="space-y-3">
            {[
              { key: 'senarecom' as const, label: 'Fee SENARECOM (%)', step: 0.1 },
              { key: 'toll' as const, label: 'Toll Ingenio (USD/TM)', step: 1 },
              { key: 'iva' as const, label: 'IVA (%)', step: 0.1 },
              { key: 'cooperativa' as const, label: 'Cooperativa (%)', step: 0.1 },
              { key: 'transporte' as const, label: 'Transporte (USD/TM)', step: 1 },
              { key: 'regalias' as const, label: 'Regalias (%)', step: 0.1 },
              { key: 'otros' as const, label: 'Otros (USD fijo)', step: 1 },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <input type="number" value={fees[key]} onChange={(e) => updateFee(key, Number(e.target.value))}
                  min={0} step={step}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            results.margenNeto >= 0 ? 'bg-green-950/30 border-green-800' : 'bg-red-950/30 border-red-800'
          }`}>
            <h2 className="font-semibold text-gray-300 mb-3">Resultado</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Contenido fino recuperado</span>
                <span className="font-mono">{fmt(results.fineContentTon)} TM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ingreso Bruto</span>
                <span className="font-mono text-white">${fmt(results.revenueBruto)}</span>
              </div>
              <div className="border-t border-gray-700 my-2" />
              {Object.entries(results.fees).map(([key, val]) => (
                val > 0 && (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key}</span>
                    <span className="font-mono text-red-400">-${fmt(val)}</span>
                  </div>
                )
              ))}
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-400">Total Costos</span>
                <span className="font-mono text-red-400">-${fmt(results.totalFees)}</span>
              </div>
              <div className="border-t border-gray-700 my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Margen Neto</span>
                <span className={`font-mono font-bold text-lg ${results.margenNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${fmt(results.margenNeto)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">En BOB</span>
                <span className={`font-mono ${results.margenNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Bs {fmt(results.margenNeto * fxRate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Margen %</span>
                <span className={`font-mono font-semibold ${results.margenPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {results.margenPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h2 className="font-semibold text-gray-300 mb-3">Breakeven</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Ley minima</span>
                <span className="font-mono text-yellow-400">
                  {(results.breakevenGrade * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recuperacion minima</span>
                <span className="font-mono text-yellow-400">
                  {(results.breakevenRecovery * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

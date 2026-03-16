import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { MINERALS, MINERAL_LIST, generateHistoricalData } from '../data/minerals'
import type { MineralId } from '../data/minerals'

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '15D', days: 15 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
  { label: '3A', days: 1095 },
]

export default function Charts() {
  const [selected, setSelected] = useState<MineralId>('tin')
  const [period, setPeriod] = useState(30)
  const [showSenarecom, setShowSenarecom] = useState(true)

  const mineral = MINERALS[selected]
  const data = useMemo(() => generateHistoricalData(mineral, period), [selected, period])

  const formatPrice = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toFixed(2)}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Graficos Historicos</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {MINERAL_LIST.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selected === m.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800'
              }`}
              style={selected === m.id ? { backgroundColor: m.color } : undefined}
            >
              {m.symbol}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                period === p.days
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white bg-gray-800/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showSenarecom}
            onChange={(e) => setShowSenarecom(e.target.checked)}
            className="accent-cyan-400"
          />
          SENARECOM
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mineral.color }} />
          <h2 className="font-semibold">{mineral.nameEs} ({mineral.symbol})</h2>
          <span className="text-sm text-gray-500">— {mineral.unitLabel}</span>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(d) => {
                const date = new Date(d)
                return period <= 30
                  ? `${date.getDate()}/${date.getMonth() + 1}`
                  : `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
              }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={formatPrice}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(val: any, name: any) => [
                `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
                name === 'price' ? 'Spot' : 'SENARECOM'
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke={mineral.color}
              strokeWidth={2}
              dot={false}
              name="Spot"
            />
            {showSenarecom && (
              <ReferenceLine
                y={mineral.senarecomPricePerTon}
                stroke="#22d3ee"
                strokeDasharray="5 5"
                label={{ value: 'SENARECOM', fill: '#22d3ee', fontSize: 11, position: 'right' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

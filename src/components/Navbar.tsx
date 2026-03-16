import type { Page } from '../App'
import { useStore } from '../store/store'

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'charts', label: 'Graficos' },
  { id: 'converter', label: 'Conversor' },
  { id: 'margin', label: 'Margenes' },
  { id: 'settings', label: 'Config' },
]

const FX_LABELS: Record<string, string> = {
  bcb_compra: 'BCB Compra',
  bcb_venta: 'BCB Venta',
  paralelo_compra: 'Paralelo Compra',
  paralelo_venta: 'Paralelo Venta',
  custom: 'Custom',
}

export default function Navbar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  const { selectedFx, setSelectedFx, getFxRate } = useStore()

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-blue-400 mr-4">HYPERO</span>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select
              value={selectedFx}
              onChange={(e) => setSelectedFx(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300"
            >
              {Object.entries(FX_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <span className="text-yellow-400 font-mono">{getFxRate().toFixed(2)} Bs/$</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

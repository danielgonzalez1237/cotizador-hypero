import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Charts from './pages/Charts'
import Converter from './pages/Converter'
import MarginCalc from './pages/MarginCalc'
import Settings from './pages/Settings'
import { useStore } from './store/store'

export type Page = 'dashboard' | 'charts' | 'converter' | 'margin' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const { refreshAll, loading } = useStore()

  useEffect(() => {
    refreshAll()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar currentPage={page} onNavigate={setPage} />
      {loading && (
        <div className="bg-blue-900/50 border-b border-blue-700 px-4 py-2 text-center text-sm text-blue-200">
          Actualizando precios en vivo...
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {page === 'dashboard' && <Dashboard />}
        {page === 'charts' && <Charts />}
        {page === 'converter' && <Converter />}
        {page === 'margin' && <MarginCalc />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  )
}

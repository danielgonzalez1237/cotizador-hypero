import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Charts from './pages/Charts'
import Converter from './pages/Converter'
import MarginCalc from './pages/MarginCalc'
import Settings from './pages/Settings'

export type Page = 'dashboard' | 'charts' | 'converter' | 'margin' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar currentPage={page} onNavigate={setPage} />
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

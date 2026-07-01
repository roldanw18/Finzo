import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { Fab } from './Fab'
import { QuickAddModals } from '@/components/QuickAddModals'
import { DemoBanner } from './DemoBanner'

export function AppLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <MobileHeader />

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <DemoBanner />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <BottomNav />
      <Fab />
      <QuickAddModals />
    </div>
  )
}

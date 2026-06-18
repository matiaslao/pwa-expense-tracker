import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from './presentation/components/AppShell'
import { Dashboard } from './presentation/components/Dashboard'
import { ActivePurchases } from './presentation/components/ActivePurchases'
import { FutureCommitments } from './presentation/components/FutureCommitments'
import { PurchaseForm } from './presentation/components/PurchaseForm'
import { PurchaseRepositoryImpl } from './infrastructure/repositories/PurchaseRepositoryImpl'
import { PurchaseService } from './application/services/PurchaseService'
import { DashboardService } from './application/services/DashboardService'
import { CLOSING_DAY } from './domain/config'
import type { PurchaseService as PurchaseServiceType } from './application/services/PurchaseService'
import type { DashboardService as DashboardServiceType } from './application/services/DashboardService'
import type { Purchase } from './domain/entities/Purchase'

interface Services {
  purchaseService: PurchaseServiceType
  dashboardService: DashboardServiceType
}

function useServices(): Services {
  const ref = useRef<Services | null>(null)
  if (!ref.current) {
    const repo = new PurchaseRepositoryImpl()
    ref.current = {
      purchaseService: new PurchaseService(repo, CLOSING_DAY),
      dashboardService: new DashboardService(repo, CLOSING_DAY),
    }
  }
  return ref.current
}

function DashboardPage({ dashboardService }: { dashboardService: DashboardServiceType }) {
  return <Dashboard dashboardService={dashboardService} />
}

function PurchasesPage({ dashboardService, purchaseService }: Services) {
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <ActivePurchases
      key={refreshKey}
      dashboardService={dashboardService}
      onEdit={(purchase) => navigate(`/edit/${purchase.id}`)}
      onDelete={async (id) => {
        await purchaseService.deletePurchase(id)
        setRefreshKey((k) => k + 1)
      }}
    />
  )
}

function FuturePage({ dashboardService }: { dashboardService: DashboardServiceType }) {
  return <FutureCommitments dashboardService={dashboardService} />
}

function NewPurchasePage({ purchaseService }: { purchaseService: PurchaseServiceType }) {
  const navigate = useNavigate()
  return (
    <PurchaseForm
      service={purchaseService}
      onSuccess={() => navigate('/')}
      onCancel={() => navigate('/')}
    />
  )
}

function EditPurchasePage({ purchaseService }: { purchaseService: PurchaseServiceType }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      purchaseService.getPurchase(id).then((p) => {
        setPurchase(p)
        setLoading(false)
      })
    }
  }, [id, purchaseService])

  if (loading) return null
  if (!purchase) return null

  return (
    <PurchaseForm
      service={purchaseService}
      initialPurchase={purchase}
      onSuccess={() => navigate('/purchases')}
      onCancel={() => navigate('/purchases')}
    />
  )
}

function AppRoutes() {
  const { purchaseService, dashboardService } = useServices()

  return (
    <Routes>
      <Route path="/" element={<DashboardPage dashboardService={dashboardService} />} />
      <Route
        path="/purchases"
        element={<PurchasesPage purchaseService={purchaseService} dashboardService={dashboardService} />}
      />
      <Route path="/future" element={<FuturePage dashboardService={dashboardService} />} />
      <Route path="/new" element={<NewPurchasePage purchaseService={purchaseService} />} />
      <Route path="/edit/:id" element={<EditPurchasePage purchaseService={purchaseService} />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  )
}

export default App

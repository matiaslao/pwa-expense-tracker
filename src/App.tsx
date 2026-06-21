import { useState, useEffect, useMemo } from 'react'
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { AppShell } from './presentation/components/AppShell'
import { Dashboard } from './presentation/components/Dashboard'
import { ActivePurchases } from './presentation/components/ActivePurchases'
import { FutureCommitments } from './presentation/components/FutureCommitments'
import { PurchaseForm } from './presentation/components/PurchaseForm'
import { Settings } from './presentation/components/Settings'
import { PurchaseRepositoryImpl } from './infrastructure/repositories/PurchaseRepositoryImpl'
import { ConfigRepositoryImpl } from './infrastructure/repositories/ConfigRepositoryImpl'
import { PeriodSnapshotRepositoryImpl } from './infrastructure/repositories/PeriodSnapshotRepositoryImpl'
import { PurchaseService } from './application/services/PurchaseService'
import { DashboardService } from './application/services/DashboardService'
import type { PurchaseService as PurchaseServiceType } from './application/services/PurchaseService'
import type { DashboardService as DashboardServiceType } from './application/services/DashboardService'
import type { ConfigRepository } from './domain/repositories/ConfigRepository'
import type { CardSettings } from './domain/types/CardSettings'
import type { Purchase } from './domain/entities/Purchase'

interface Services {
  purchaseService: PurchaseServiceType
  dashboardService: DashboardServiceType
  configRepository: ConfigRepository
}

function useServices(settings: CardSettings, configRepo: ConfigRepository): Services {
  return useMemo(() => {
    const repo = new PurchaseRepositoryImpl()
    const snapshotRepo = new PeriodSnapshotRepositoryImpl()
    return {
      purchaseService: new PurchaseService(repo, settings.closingDay, settings.dueDay),
      dashboardService: new DashboardService(repo, snapshotRepo, settings.closingDay, settings.dueDay),
      configRepository: configRepo,
    }
  }, [settings.closingDay, settings.dueDay, configRepo])
}

function DashboardPage({ dashboardService, closingDay, dueDay }: { dashboardService: DashboardServiceType; closingDay: number; dueDay: number }) {
  return <Dashboard dashboardService={dashboardService} closingDay={closingDay} dueDay={dueDay} />
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

function SettingsPage({ configRepository, onSettingsChanged }: { configRepository: ConfigRepository; onSettingsChanged: (s: CardSettings) => void }) {
  const navigate = useNavigate()
  return (
    <Settings
      configRepository={configRepository}
      onSave={(settings: CardSettings) => {
        onSettingsChanged(settings)
        navigate('/')
      }}
      onCancel={() => navigate('/')}
    />
  )
}

function AppRoutes() {
  const [settings, setSettings] = useState<CardSettings | null>(null)
  const [configRepo] = useState(() => new ConfigRepositoryImpl())

  useEffect(() => {
    configRepo.getSettings().then(setSettings)
  }, [configRepo])

  const defaultSettings: CardSettings = { closingDay: 15, dueDay: 29 }
  const currentSettings = settings ?? defaultSettings
  const { purchaseService, dashboardService, configRepository } = useServices(currentSettings, configRepo)

  if (!settings) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage dashboardService={dashboardService} closingDay={settings.closingDay} dueDay={settings.dueDay} />} />
      <Route
        path="/purchases"
        element={<PurchasesPage purchaseService={purchaseService} dashboardService={dashboardService} configRepository={configRepository} />}
      />
      <Route path="/future" element={<FuturePage dashboardService={dashboardService} />} />
      <Route path="/new" element={<NewPurchasePage purchaseService={purchaseService} />} />
      <Route path="/edit/:id" element={<EditPurchasePage purchaseService={purchaseService} />} />
      <Route path="/settings" element={<SettingsPage configRepository={configRepository} onSettingsChanged={setSettings} />} />
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </HashRouter>
  )
}

export default App

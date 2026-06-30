import { useState, useEffect, useMemo, useRef } from 'react'
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Typography } from '@mui/material'
import { AppShell } from './presentation/components/AppShell'
import { Dashboard } from './presentation/components/Dashboard'
import { ActivePurchases } from './presentation/components/ActivePurchases'
import { FutureCommitments } from './presentation/components/FutureCommitments'
import { PurchaseForm } from './presentation/components/PurchaseForm'
import { Settings } from './presentation/components/Settings'
import { History } from './presentation/components/History'
import { PurchaseRepositoryImpl } from './infrastructure/repositories/PurchaseRepositoryImpl'
import { ConfigRepositoryImpl } from './infrastructure/repositories/ConfigRepositoryImpl'
import { PeriodSnapshotRepositoryImpl } from './infrastructure/repositories/PeriodSnapshotRepositoryImpl'
import { PurchaseService } from './application/services/PurchaseService'
import { DashboardService } from './application/services/DashboardService'
import { PeriodSnapshotService } from './application/services/PeriodSnapshotService'
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
    return {
      purchaseService: new PurchaseService(repo, settings.closingDate, settings.dueDate),
      dashboardService: new DashboardService(repo, settings.closingDate, settings.dueDate),
      configRepository: configRepo,
    }
  }, [settings.closingDate.getTime(), settings.dueDate.getTime(), configRepo])
}

function DashboardPage({ dashboardService, snapshotService, closingDate, dueDate }: { dashboardService: DashboardServiceType; snapshotService: PeriodSnapshotService; closingDate: Date; dueDate: Date }) {
  return <Dashboard dashboardService={dashboardService} snapshotService={snapshotService} closingDate={closingDate} dueDate={dueDate} />
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

function HistoryPage({ snapshotService }: { snapshotService: PeriodSnapshotService }) {
  return <History snapshotService={snapshotService} />
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
  const [snapshotService] = useState(() => new PeriodSnapshotService(
    new PurchaseRepositoryImpl(),
    new PeriodSnapshotRepositoryImpl(),
  ))
  const captureDone = useRef(false)

  useEffect(() => {
    configRepo.getSettings().then(setSettings)
  }, [configRepo])

  useEffect(() => {
    if (settings && !captureDone.current) {
      captureDone.current = true
      snapshotService.checkAndCapture(settings.closingDate, settings.dueDate).then((newSettings) => {
        if (newSettings) {
          setSettings(newSettings)
          configRepo.saveSettings(newSettings)
        }
      })
    }
  }, [settings, snapshotService, configRepo])

  const defaultSettings: CardSettings = {
    closingDate: new Date(new Date().getFullYear(), 6, 23),
    dueDate: new Date(new Date().getFullYear(), 7, 6),
  }
  const currentSettings = settings ?? defaultSettings
  const { purchaseService, dashboardService, configRepository } = useServices(currentSettings, configRepo)

  if (!settings) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage dashboardService={dashboardService} snapshotService={snapshotService} closingDate={settings.closingDate} dueDate={settings.dueDate} />} />
      <Route
        path="/purchases"
        element={<PurchasesPage purchaseService={purchaseService} dashboardService={dashboardService} configRepository={configRepository} />}
      />
      <Route path="/future" element={<FuturePage dashboardService={dashboardService} />} />
      <Route path="/history" element={<HistoryPage snapshotService={snapshotService} />} />
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

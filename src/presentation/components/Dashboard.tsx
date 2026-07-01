import { useEffect, useState } from 'react'
import {
  Paper,
  Typography,
  Box,
} from '@mui/material'
import type { DashboardService, CurrentPeriodSummary } from '../../application/services/DashboardService'
import type { PeriodSnapshotService } from '../../application/services/PeriodSnapshotService'
import type { PeriodSnapshot } from '../../domain/types/PeriodSnapshot'

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface DashboardProps {
  dashboardService: DashboardService
  snapshotService: PeriodSnapshotService
  closingDate: Date
  dueDate: Date
}

export function Dashboard({ dashboardService, snapshotService, closingDate, dueDate }: DashboardProps) {
  const [summary, setSummary] = useState<CurrentPeriodSummary | null>(null)
  const [snapshot, setSnapshot] = useState<PeriodSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getCurrentPeriodSummary(),
      snapshotService.getLatestSnapshot(),
    ]).then(([s, snap]) => {
      setSummary(s)
      setSnapshot(snap)
      setLoading(false)
    })
  }, [dashboardService, snapshotService, closingDate, dueDate])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Cargando...</Typography>
  }

  if (!summary) {
    return null
  }

  return (
    <>
      <Paper sx={{ p: 3, mx: 2, my: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Período Actual
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Período</Typography>
            <Typography>{summary.period.toString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Fecha de cierre</Typography>
            <Typography>{formatDate(closingDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Fecha de vencimiento</Typography>
            <Typography>{formatDate(dueDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Total a pagar</Typography>
            <Typography variant="h6">${summary.totalDue.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Compras</Typography>
            <Typography>{summary.installmentCount}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mx: 2, my: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Período Anterior
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Período</Typography>
            <Typography>{snapshot ? snapshot.period.toString() : '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Fecha de cierre</Typography>
            <Typography>{snapshot ? formatDate(snapshot.closingDate) : '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Fecha de vencimiento</Typography>
            <Typography>{snapshot ? formatDate(snapshot.dueDate) : '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Total a pagar</Typography>
            <Typography variant="h6">{snapshot ? `$${snapshot.totalAmount.toFixed(2)}` : '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Compras</Typography>
            <Typography>{snapshot ? snapshot.purchaseCount : '-'}</Typography>
          </Box>
        </Box>
      </Paper>
    </>
  )
}

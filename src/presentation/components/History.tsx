import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
} from '@mui/material'
import type { PeriodSnapshotService } from '../../application/services/PeriodSnapshotService'
import type { PeriodSnapshot } from '../../domain/types/PeriodSnapshot'

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface HistoryProps {
  snapshotService: PeriodSnapshotService
}

export function History({ snapshotService }: HistoryProps) {
  const [snapshots, setSnapshots] = useState<PeriodSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    snapshotService.getAllSnapshots().then((result) => {
      setSnapshots(result)
      setLoading(false)
    })
  }, [snapshotService])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Cargando...</Typography>
  }

  if (snapshots.length === 0) {
    return (
      <Paper sx={{ p: 3, mx: 2, my: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">Sin historial aún</Typography>
      </Paper>
    )
  }

  const maxAmount = Math.max(...snapshots.map(s => s.totalAmount), 1)
  const maxCount = Math.max(...snapshots.map(s => s.purchaseCount), 1)

  return (
    <Paper sx={{ mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
        Historial
      </Typography>
      <Box sx={{ px: 2, pb: 2 }}>
        {snapshots.map((s) => (
          <Box key={s.id} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {s.period.toString()} &mdash; {formatDate(s.dueDate)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: `${(s.totalAmount / maxAmount) * 100}%`,
                  maxWidth: '100%',
                  height: 20,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  minWidth: 4,
                  transition: 'width 0.3s',
                }}
              />
              <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                ${s.totalAmount.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: `${(s.purchaseCount / maxCount) * 100}%`,
                  maxWidth: '100%',
                  height: 20,
                  bgcolor: 'secondary.main',
                  borderRadius: 1,
                  minWidth: 4,
                  transition: 'width 0.3s',
                }}
              />
              <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                {s.purchaseCount} compra{s.purchaseCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

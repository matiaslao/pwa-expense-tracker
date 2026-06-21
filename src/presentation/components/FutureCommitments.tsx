import { useEffect, useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
} from '@mui/material'
import type { DashboardService, FutureCommitment } from '../../application/services/DashboardService'
import { Strings } from '../strings'
import { formatCurrency } from '../utils/formatCurrency'

interface FutureCommitmentsProps {
  dashboardService: DashboardService
}

export function FutureCommitments({ dashboardService }: FutureCommitmentsProps) {
  const [commitments, setCommitments] = useState<FutureCommitment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getFutureCommitments().then((result) => {
      setCommitments(result)
      setLoading(false)
    })
  }, [dashboardService])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>{Strings.LOADING}</Typography>
  }

  if (commitments.length === 0) {
    return (
      <Paper sx={{ p: 3, mx: 2, my: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{Strings.NO_FUTURE_COMMITMENTS}</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
        {Strings.FUTURE_COMMITMENTS_TITLE}
      </Typography>
      <List>
        {commitments.map((c) => (
          <ListItem key={c.period.toString()}>
            <ListItemText
              primary={c.period.toString()}
              secondary={`${Strings.TOTAL}: ${formatCurrency(c.totalAmount)}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

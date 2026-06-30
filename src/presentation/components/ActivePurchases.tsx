import { useEffect, useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { DashboardService } from '../../application/services/DashboardService'
import type { Purchase } from '../../domain/entities/Purchase'

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface ActivePurchasesProps {
  dashboardService: DashboardService
  onEdit?: (purchase: Purchase) => void
  onDelete?: (id: string) => void
}

export function ActivePurchases({ dashboardService, onEdit, onDelete }: ActivePurchasesProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getActivePurchases().then((result) => {
      setPurchases(result)
      setLoading(false)
    })
  }, [dashboardService])

  if (loading) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading...</Typography>
  }

  if (purchases.length === 0) {
    return (
      <Paper sx={{ p: 3, mx: 2, my: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No active purchases</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
        Active Purchases
      </Typography>
      <List>
        {purchases.map((purchase) => {
          const installments = purchase.generateInstallments()
          const totalRemaining = installments.reduce((sum, inst) => sum + inst.amount, 0)

          return (
            <ListItem
              key={purchase.id}
              secondaryAction={
                <>
                  {onEdit && (
                    <IconButton edge="end" aria-label="Edit" onClick={() => onEdit(purchase)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton edge="end" aria-label="Delete" onClick={() => onDelete(purchase.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </>
              }
            >
              <ListItemText
                primary={`${purchase.description} — ${formatDate(purchase.purchaseDate)}`}
                secondary={
                  purchase.installments > 1
                    ? `$${purchase.amount.toFixed(2)} — ${installments.length} installments ($${totalRemaining.toFixed(2)} remaining)`
                    : `$${purchase.amount.toFixed(2)}`
                }
              />
            </ListItem>
          )
        })}
      </List>
    </Paper>
  )
}

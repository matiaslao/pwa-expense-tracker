import { useEffect, useState } from 'react'
import {
  List,
  ListItem,
  IconButton,
  Typography,
  Paper,
  Box,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { DashboardService } from '../../application/services/DashboardService'
import type { Purchase } from '../../domain/entities/Purchase'

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
          const isInstallment = purchase.installments > 1
          const installmentAmount = purchase.amount / purchase.installments
          const remainingCount = purchase.getRemainingInstallments(0).length

          return (
            <ListItem key={purchase.id} sx={{ py: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {purchase.description} — {formatDate(purchase.purchaseDate)}
                  </Typography>
                  {isInstallment ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Installments: {purchase.installments} — {remainingCount} remaining
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Installment Amount: ${installmentAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      ${purchase.amount.toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexShrink: 0, gap: 0.5 }}>
                  {onEdit && (
                    <IconButton size="small" aria-label="Edit" onClick={() => onEdit(purchase)}>
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton size="small" aria-label="Delete" onClick={() => onDelete(purchase.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    </Paper>
  )
}

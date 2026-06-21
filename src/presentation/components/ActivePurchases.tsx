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
import { Strings } from '../strings'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

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
    return <Typography sx={{ p: 2, textAlign: 'center' }}>{Strings.LOADING}</Typography>
  }

  if (purchases.length === 0) {
    return (
      <Paper sx={{ p: 3, mx: 2, my: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">{Strings.NO_ACTIVE_PURCHASES}</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
        {Strings.ACTIVE_PURCHASES_TITLE}
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
                        {Strings.INSTALLMENTS}: {purchase.installments} — {remainingCount} {Strings.REMAINING}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Strings.INSTALLMENT_AMOUNT}: {formatCurrency(installmentAmount)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatCurrency(purchase.amount)}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexShrink: 0, gap: 0.5 }}>
                  {onEdit && (
                    <IconButton size="small" aria-label={Strings.EDIT} onClick={() => onEdit(purchase)}>
                      <EditIcon />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton size="small" aria-label={Strings.DELETE} onClick={() => onDelete(purchase.id)}>
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

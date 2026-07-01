import { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
} from '@mui/material'
import type { PurchaseService } from '../../application/services/PurchaseService'
import type { Purchase } from '../../domain/entities/Purchase'

interface PurchaseFormProps {
  service: PurchaseService
  initialPurchase?: Purchase
  onSuccess?: () => void
  onCancel?: () => void
}

export function PurchaseForm({ service, initialPurchase, onSuccess, onCancel }: PurchaseFormProps) {
  const [description, setDescription] = useState(initialPurchase?.description ?? '')
  const [amount, setAmount] = useState(initialPurchase?.amount.toString() ?? '')
  const [installments, setInstallments] = useState(initialPurchase?.installments.toString() ?? '1')
  const [purchaseDate, setPurchaseDate] = useState(
    initialPurchase?.purchaseDate.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount)
    const installmentsNum = parseInt(installments, 10)
    const purchaseDateObj = new Date(purchaseDate + 'T12:00:00')

    if (!description.trim()) {
      setError('La descripción es obligatoria')
      return
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('El monto debe ser un número positivo')
      return
    }
    if (isNaN(installmentsNum) || installmentsNum < 1) {
      setError('Las cuotas deben ser al menos 1')
      return
    }
    if (isNaN(purchaseDateObj.getTime())) {
      setError('La fecha de compra es obligatoria')
      return
    }

    setSubmitting(true)
    try {
      if (initialPurchase) {
        await service.updatePurchase(initialPurchase.id, {
          description: description.trim(),
          amount: amountNum,
          installments: installmentsNum,
          purchaseDate: purchaseDateObj,
        })
      } else {
        await service.createPurchase({
          description: description.trim(),
          amount: amountNum,
          installments: installmentsNum,
          purchaseDate: purchaseDateObj,
        })
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper sx={{ p: 3, mx: 2, my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {initialPurchase ? 'Editar Compra' : 'Nueva Compra'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Monto (ARS)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          fullWidth
          size="small"
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Cuotas"
          type="number"
          value={installments}
          onChange={(e) => setInstallments(e.target.value)}
          required
          fullWidth
          size="small"
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Fecha de Compra"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Guardando...' : initialPurchase ? 'Actualizar' : 'Crear'}
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

import { useNavigate, useLocation } from 'react-router-dom'
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DateRangeIcon from '@mui/icons-material/DateRange'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import AddIcon from '@mui/icons-material/Add'
import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Purchases', icon: <ShoppingCartIcon />, path: '/purchases' },
    { label: 'Future', icon: <DateRangeIcon />, path: '/future' },
    { label: 'History', icon: <BarChartIcon />, path: '/history' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ]

  const currentTab = tabs.findIndex((t) => t.path === location.pathname)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Box sx={{ flex: 1, pb: 7 }}>
        {children}
      </Box>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 72, right: 16 }}
        onClick={() => navigate('/new')}
      >
        <AddIcon />
      </Fab>

      <BottomNavigation
        value={currentTab === -1 ? 0 : currentTab}
        onChange={(_, index) => navigate(tabs[index].path)}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Box>
  )
}

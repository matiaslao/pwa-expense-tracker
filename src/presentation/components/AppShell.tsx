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
import SettingsIcon from '@mui/icons-material/Settings'
import AddIcon from '@mui/icons-material/Add'
import type { ReactNode } from 'react'
import { Strings } from '../strings'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { label: Strings.NAV_DASHBOARD, icon: <DashboardIcon />, path: '/' },
    { label: Strings.NAV_PURCHASES, icon: <ShoppingCartIcon />, path: '/purchases' },
    { label: Strings.NAV_FUTURE, icon: <DateRangeIcon />, path: '/future' },
    { label: Strings.NAV_SETTINGS, icon: <SettingsIcon />, path: '/settings' },
  ]

  const currentTab = tabs.findIndex((t) => t.path === location.pathname)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Box sx={{ flex: 1, pb: 7 }}>
        {children}
      </Box>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', right: 16 }}
        onClick={() => navigate('/new')}
      >
        <AddIcon />
      </Fab>

      <BottomNavigation
        value={currentTab === -1 ? 0 : currentTab}
        onChange={(_, index) => navigate(tabs[index].path)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.path} label={tab.label} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Box>
  )
}

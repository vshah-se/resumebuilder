'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import { NAV_ITEMS, DRAWER_WIDTH, APP_NAME } from '@/lib/constants';
import { palette } from '@/lib/theme';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar sx={{ px: 2.5, gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${palette.navy} 0%, ${palette.teal} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DescriptionIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
            {APP_NAME}
          </Typography>
        </Toolbar>

        <List sx={{ px: 1, mt: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <ListItemButton
                key={item.path}
                selected={isActive}
                disabled={item.disabled}
                onClick={() => router.push(item.path)}
                sx={{
                  mb: 0.5,
                  opacity: item.disabled ? 0.5 : 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {item.disabled && (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      bgcolor: alpha(palette.slate, 0.1),
                      color: palette.slate,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}>
          <Toolbar>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {NAV_ITEMS.find((item) => item.path === pathname)?.label ?? 'Dashboard'}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

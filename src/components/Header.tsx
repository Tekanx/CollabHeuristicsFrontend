'use client';

import { AppBar, Toolbar, Typography, IconButton, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState } from 'react';

export default function Header() {
  const { user, logout, getDashboardPath } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleLogoClick = () => {
    router.push(getDashboardPath());
  };

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleProfileClick = () => {
    handleMenuClose();
    router.push('/profile');
  };
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleLogoClick}>
          <Image src="/HeuristicAppLogo.png" alt="HeuristicApp Logo" width={40} height={40} style={{ marginRight: 12 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            HeuristicApp
          </Typography>
        </Box>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="large" color="inherit" onClick={handleUserMenu}>
              <AccountCircle />
            </IconButton>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.username} - {user.role === 'COORDINADOR' ? 'Coordinador' : 'Evaluador'}</Typography>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleProfileClick}>Perfil</MenuItem>
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
} 
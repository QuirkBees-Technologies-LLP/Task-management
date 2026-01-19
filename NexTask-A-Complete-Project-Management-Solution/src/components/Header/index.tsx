'use client';

import React, { MouseEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Link as MuiLink,
  Stack,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import { appbarHeight, navRoutes } from '@/utils/constants';
import Logo from '../Logo';

interface HeaderProps {
  isAuthHeader?: boolean;
}

interface NavRoute {
  title: string;
  key: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthHeader = false }) => {
  const theme = useTheme();
  const pathname = usePathname();
  const currPathname = pathname.split('/')[1];
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      const timeout = setTimeout(() => {
        setScrolled(window.scrollY > 50);
      }, 50); // 150ms delay before triggering
      setScrollTimeout(timeout);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollTimeout]);

  const handleOpenNavMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          transition: 'all 0.4s ease-in-out',
          backgroundColor: scrolled ? alpha(theme.palette.background.paper, 0.7) : 'transparent',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
          boxShadow: scrolled ? '0px 4px 20px rgba(0,0,0,0.08)' : 'none',
          width: scrolled ? { xs: '90%', sm: '80%', md: '66%' } : '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: scrolled ? `${theme.shape.borderRadius}px` : '0px',
          marginTop: scrolled ? '12px' : '0px',
          height: appbarHeight,
          borderBottom: 'none !important',
          zIndex: theme.zIndex.drawer,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: appbarHeight }}>
            <Box
              sx={{
                flexGrow: 1,
              }}
            >
              <Logo />
            </Box>

            {!isAuthHeader && (
              <>
                {/* Desktop Nav */}
                <Stack
                  direction="row"
                  spacing={3}
                  sx={{ flexGrow: 10, display: { xs: 'none', md: 'flex' } }}
                >
                  {navRoutes.map(({ title, key }: NavRoute) => (
                    <MuiLink
                      component={Link}
                      href={`/${key}`}
                      key={key}
                      onClick={handleCloseNavMenu}
                      color="textPrimary"
                      sx={{
                        fontWeight: currPathname === key ? 'bold' : 'normal',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                        '&:hover': { color: theme.palette.primary.main },
                      }}
                    >
                      {title}
                    </MuiLink>
                  ))}
                </Stack>

                {/* Buttons */}
                <Box
                  sx={{
                    flexGrow: 0,
                    display: { xs: 'none', sm: 'none', md: 'flex' },
                  }}
                >
                  <Link href={'/login'}>
                    <Button variant="contained">Login</Button>
                  </Link>
                </Box>

                {/* Mobile Menu Icon */}
                <Box sx={{ display: { xs: 'block', sm: 'block', md: 'none' } }}>
                  <IconButton
                    size="large"
                    aria-label="menu"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleOpenNavMenu}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: 200 } } }}
      >
        {navRoutes.map(({ title, key }: NavRoute) => (
          <MenuItem key={key} onClick={handleCloseNavMenu} component={Link} href={`/${key}`}>
            <Typography sx={{ textAlign: 'center' }}>{title}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ px: 1 }}>
          <Link href={'/login'}>
            <Button variant="contained" fullWidth>
              Login
            </Button>
          </Link>
        </Box>
      </Menu>
    </>
  );
};

export default Header;

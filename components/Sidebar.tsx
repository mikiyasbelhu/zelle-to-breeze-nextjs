"use client";

import React from 'react';
import {
    Box, Typography, IconButton, Button, Avatar, Tooltip,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

interface SidebarProps {
    activePage: 'export' | 'edit';
    setActivePage: (page: 'export' | 'edit') => void;
    darkMode: boolean;
    setDarkMode: (v: boolean) => void;
    onLogout: () => void;
}

const navItems = [
    { key: 'export' as const, label: 'Converter', icon: <SwapHorizIcon /> },
    { key: 'edit' as const, label: 'Accounts', icon: <PeopleAltIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({
    activePage, setActivePage, darkMode, setDarkMode, onLogout,
}) => {
    return (
        <Box
            sx={{
                width: 280,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: darkMode
                    ? 'linear-gradient(180deg, #0a1628 0%, #0f2b5e 100%)'
                    : 'linear-gradient(180deg, #0f2b5e 0%, #1e40af 50%, #3b82f6 100%)',
                color: '#fff',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1200,
                p: 2.5,
            }}
        >
            {/* Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pt: 1, pb: 3 }}>
                <Avatar
                    src="/eebc-logo.png"
                    alt="EEBC Dallas"
                    sx={{
                        width: 42, height: 42,
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                    }}
                />
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        EEBC Dallas
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 400 }}>
                        Zelle to Breeze Converter
                    </Typography>
                </Box>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ px: 1.5, mb: 1, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.45 }}>
                    Navigation
                </Typography>
                {navItems.map((item) => {
                    const isActive = activePage === item.key;
                    return (
                        <Box
                            key={item.key}
                            onClick={() => setActivePage(item.key)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.4,
                                mb: 0.5,
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                backdropFilter: isActive ? 'blur(8px)' : 'none',
                                '&:hover': {
                                    background: isActive
                                        ? 'rgba(255,255,255,0.18)'
                                        : 'rgba(255,255,255,0.08)',
                                },
                                '& svg': {
                                    fontSize: 22,
                                    opacity: isActive ? 1 : 0.65,
                                    transition: 'opacity 0.2s ease',
                                },
                            }}
                        >
                            {item.icon}
                            <Typography sx={{ fontWeight: isActive ? 600 : 400, fontSize: '0.92rem', opacity: isActive ? 1 : 0.75 }}>
                                {item.label}
                            </Typography>
                            {isActive && (
                                <Box sx={{
                                    ml: 'auto', width: 6, height: 6, borderRadius: '50%',
                                    background: '#2dd4bf',
                                    boxShadow: '0 0 8px rgba(45,212,191,0.6)',
                                }} />
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Bottom section */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                    <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                        <IconButton
                            onClick={() => setDarkMode(!darkMode)}
                            sx={{
                                color: '#fff', opacity: 0.7,
                                background: 'rgba(255,255,255,0.06)',
                                '&:hover': { opacity: 1, background: 'rgba(255,255,255,0.12)' },
                            }}
                        >
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                    <Button
                        onClick={onLogout}
                        startIcon={<LogoutIcon />}
                        sx={{
                            color: '#fff', opacity: 0.7, textTransform: 'none', fontSize: '0.85rem',
                            '&:hover': { opacity: 1, background: 'rgba(255,255,255,0.08)' },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;

"use client";

import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, IconButton, InputAdornment,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface LoginScreenProps {
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    onLogin: () => void;
    onForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    email, setEmail, password, setPassword, onLogin, onForgotPassword,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onLogin();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4338ca 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative orbs */}
            <Box sx={{
                position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                top: -100, right: -100, filter: 'blur(40px)',
            }} />
            <Box sx={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)',
                bottom: -50, left: -50, filter: 'blur(40px)',
            }} />
            <Box sx={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                top: '50%', left: '30%', filter: 'blur(30px)',
            }} />

            <Box
                className="animate-fade-in-scale"
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    mx: 2,
                    p: { xs: 4, sm: 5 },
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 32px 64px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 3,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        border: '2px solid rgba(255,255,255,0.15)',
                    }}>
                        <img src="/eebc-logo.png" alt="EEBC Dallas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Typography
                        variant="h4"
                        sx={{ color: '#fff', fontWeight: 800, mb: 1, letterSpacing: '-0.03em' }}
                    >
                        Welcome Back
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                        Sign in to EEBC Dallas Dashboard
                    </Typography>
                </Box>

                <TextField
                    id="login-email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    fullWidth
                    margin="normal"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <EmailOutlinedIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&.Mui-focused fieldset': { borderColor: '#818cf8' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
                    }}
                />

                <TextField
                    id="login-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    fullWidth
                    margin="normal"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <LockOutlinedIcon sx={{ color: 'rgba(255,255,255,0.4)' }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                            '&.Mui-focused fieldset': { borderColor: '#818cf8' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
                    }}
                />

                <Box sx={{ textAlign: 'right', mt: 0.5, mb: 3 }}>
                    <Button
                        onClick={onForgotPassword}
                        sx={{
                            color: '#a5b4fc', textTransform: 'none', fontSize: '0.85rem',
                            '&:hover': { color: '#c7d2fe', background: 'transparent' },
                        }}
                    >
                        Forgot password?
                    </Button>
                </Box>

                <Button
                    id="login-button"
                    variant="contained"
                    onClick={onLogin}
                    fullWidth
                    sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                            transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    Sign In
                </Button>
            </Box>
        </Box>
    );
};

export default LoginScreen;

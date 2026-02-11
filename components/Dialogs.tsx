"use client";

import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Typography, Button, Box, List, ListItem, ListItemText, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// ===== Edit Account Dialog =====
interface EditDialogProps {
    open: boolean;
    onClose: () => void;
    editAccount: any;
    setEditAccount: (v: any) => void;
    onSave: () => void;
}

export const EditDialog: React.FC<EditDialogProps> = ({ open, onClose, editAccount, setEditAccount, onSave }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
            Edit Account
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
            {editAccount && (
                <Box sx={{ pt: 1 }}>
                    <TextField label="Breeze ID" type="number" disabled value={editAccount.id} fullWidth margin="normal" />
                    <TextField
                        label="Zelle Accounts (comma separated)"
                        value={editAccount.zelleAccounts.map((z: any) => z.name).join(', ')}
                        onChange={(e) =>
                            setEditAccount({
                                ...editAccount,
                                zelleAccounts: e.target.value.split(',').map((name: string) => ({ name: name.trim() })),
                            })
                        }
                        fullWidth
                        margin="normal"
                    />
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
            <Button onClick={onSave} variant="contained">Save Changes</Button>
        </DialogActions>
    </Dialog>
);

// ===== Delete Confirmation Dialog =====
interface DeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, onConfirm }) => (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
            <Box sx={{
                width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2,
                background: 'var(--error-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <WarningAmberIcon sx={{ color: 'var(--error)', fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Delete Account?</Typography>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                This action cannot be undone. The account will be permanently removed.
            </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
            <Button onClick={onClose} sx={{ color: 'var(--text-secondary)', px: 3 }}>Cancel</Button>
            <Button onClick={onConfirm} variant="contained" color="error" sx={{
                px: 3,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', boxShadow: '0 4px 16px rgba(239,68,68,0.35)' },
            }}>
                Delete
            </Button>
        </DialogActions>
    </Dialog>
);

// ===== Create Account Dialog =====
interface CreateDialogProps {
    open: boolean;
    onClose: () => void;
    newAccountId: number | null;
    setNewAccountId: (v: number) => void;
    newAccountName: string;
    setNewAccountName: (v: string) => void;
    onSave: () => void;
    errorMessage?: string;
}

export const CreateDialog: React.FC<CreateDialogProps> = ({
    open, onClose, newAccountId, setNewAccountId, newAccountName, setNewAccountName, onSave, errorMessage,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
            New Account
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
            <Box sx={{ pt: 1 }}>
                <TextField
                    label="Account ID"
                    type="number"
                    value={newAccountId || ''}
                    onChange={(e) => setNewAccountId(parseInt(e.target.value, 10))}
                    error={Boolean(errorMessage)}
                    helperText={errorMessage || ' '}
                    fullWidth
                    margin="normal"
                />
                <TextField label="Account Name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} fullWidth margin="normal" />
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
            <Button onClick={onSave} variant="contained">Create</Button>
        </DialogActions>
    </Dialog>
);

// ===== Forgot Password Dialog =====
interface ForgotPasswordDialogProps {
    open: boolean;
    onClose: () => void;
    resetEmail: string;
    setResetEmail: (v: string) => void;
    onSend: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onClose, resetEmail, setResetEmail, onSend }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem', mb: 1 }}>
                Enter your email and we'll send you a link to reset your password.
            </Typography>
            <TextField label="Email Address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} fullWidth margin="normal" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
            <Button onClick={onSend} variant="contained">Send Reset Email</Button>
        </DialogActions>
    </Dialog>
);

// ===== Missing Account Dialog =====
interface MissingAccountDialogProps {
    open: boolean;
    currentMissingAccount: string | null;
    missingAccountId: number | null;
    setMissingAccountId: (v: number) => void;
    suggestedAccounts: any[];
    onSave: () => void;
    onCancel: () => void;
}

export const MissingAccountDialog: React.FC<MissingAccountDialogProps> = ({
    open, currentMissingAccount, missingAccountId, setMissingAccountId,
    suggestedAccounts, onSave, onCancel,
}) => (
    <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Missing Account</DialogTitle>
        <DialogContent>
            <Box sx={{
                p: 2, mb: 2, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)',
                border: '1px solid rgba(245,158,11,0.2)',
            }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--warning)' }}>
                    No Breeze ID found for:
                </Typography>
                <Typography sx={{ fontWeight: 700, mt: 0.5 }}>{currentMissingAccount}</Typography>
            </Box>
            <TextField
                label="Breeze ID"
                type="number"
                value={missingAccountId || ''}
                onChange={(e) => setMissingAccountId(parseInt(e.target.value, 10))}
                fullWidth
                margin="normal"
            />
            {suggestedAccounts.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', mb: 1 }}>
                        Suggestions
                    </Typography>
                    <List disablePadding>
                        {suggestedAccounts.map((account) => (
                            <ListItem
                                key={account.id}
                                button
                                onClick={() => setMissingAccountId(account.id)}
                                sx={{
                                    borderRadius: 'var(--radius-md)', mb: 0.5,
                                    border: missingAccountId === account.id ? '2px solid var(--primary-400)' : '1px solid var(--surface-200)',
                                    background: missingAccountId === account.id ? 'var(--primary-50)' : 'transparent',
                                    '&:hover': { background: 'var(--surface-50)' },
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            #{account.id}
                                        </Typography>
                                    }
                                    secondary={account.zelleAccounts.map((z: any) => z.name).join(', ')}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={onCancel} sx={{ color: 'var(--text-secondary)' }}>Cancel Import</Button>
            <Button onClick={onSave} variant="contained">Save & Continue</Button>
        </DialogActions>
    </Dialog>
);

"use client";

import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, IconButton, Menu, MenuItem, InputAdornment,
} from '@mui/material';
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

interface EditPageProps {
    filteredAccounts: any[];
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    paginationModel: GridPaginationModel;
    setPaginationModel: (m: GridPaginationModel) => void;
    onEdit: (account: any) => void;
    onDelete: (id: number) => void;
    onCreateAccount: () => void;
    onBulkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBulkExport: () => void;
}

const EditPage: React.FC<EditPageProps> = ({
    filteredAccounts, searchQuery, setSearchQuery,
    paginationModel, setPaginationModel,
    onEdit, onDelete, onCreateAccount, onBulkUpload, onBulkExport,
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    return (
        <Box className="animate-fade-in">
            {/* Page header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 1, color: 'var(--text-primary)' }}>
                        Breeze Accounts
                    </Typography>
                    <Typography sx={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Manage linked Zelle and Breeze accounts
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                        id="create-account-btn"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateAccount}
                        sx={{ py: 1.2 }}
                    >
                        New Account
                    </Button>
                    <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            border: '1px solid var(--surface-200)',
                            borderRadius: 'var(--radius-md)',
                            p: 1,
                            '&:hover': { background: 'var(--surface-100)' },
                        }}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { borderRadius: '14px', mt: 1, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}
                    >
                        <MenuItem component="label" sx={{ fontSize: '0.9rem', py: 1.2 }}>
                            Bulk Upload
                            <input type="file" hidden accept=".csv" onChange={(e) => { onBulkUpload(e); setAnchorEl(null); }} />
                        </MenuItem>
                        <MenuItem
                            onClick={() => { onBulkExport(); setAnchorEl(null); }}
                            sx={{ fontSize: '0.9rem', py: 1.2 }}
                        >
                            Bulk Export
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Stats bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box className="card" sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <PeopleAltIcon sx={{ color: 'var(--primary-500)', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
                            {filteredAccounts.length}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            Total Accounts
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Search + Table card */}
            <Box className="card" sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 3, pb: 0 }}>
                    <TextField
                        id="search-accounts"
                        placeholder="Search by ID or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'var(--text-tertiary)', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                background: 'var(--surface-50)',
                                '&:hover': { background: 'var(--surface-100)' },
                            },
                        }}
                    />
                </Box>
                <DataGrid
                    rows={filteredAccounts.map((account: any, index: number) => ({
                        id: account.id,
                        zelleAccounts: account.zelleAccounts,
                        index,
                    }))}
                    columns={[
                        {
                            field: 'id',
                            headerName: 'Breeze ID',
                            width: 140,
                            renderCell: (params) => (
                                <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--primary-600)' }}>
                                    #{params.value}
                                </Typography>
                            ),
                        },
                        {
                            field: 'zelleAccounts',
                            headerName: 'Zelle Accounts',
                            flex: 2,
                            valueGetter: (params) =>
                                params.row.zelleAccounts
                                    ? params.row.zelleAccounts.map((z: any) => z.name).join(', ')
                                    : '',
                            renderCell: (params) => (
                                <Typography sx={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{params.value}</Typography>
                            ),
                            sortComparator: (v1: string, v2: string) => v1.localeCompare(v2),
                        },
                        {
                            field: 'actions',
                            headerName: '',
                            width: 120,
                            sortable: false,
                            renderCell: (params) => (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEdit(params.row)}
                                        sx={{
                                            color: '#6366f1 !important',
                                            borderRadius: '10px',
                                            background: 'rgba(99, 102, 241, 0.08)',
                                            '&:hover': { background: 'rgba(99, 102, 241, 0.18)' },
                                        }}
                                    >
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(params.row.id)}
                                        sx={{
                                            color: '#ef4444 !important',
                                            borderRadius: '10px',
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            '&:hover': { background: 'rgba(239, 68, 68, 0.18)' },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            ),
                        },
                    ]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20]}
                    autoHeight
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-withBorderColor': { borderColor: 'var(--surface-100)' },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid var(--surface-100)',
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default EditPage;

"use client";

import React, { useRef } from 'react';
import {
    Box, Typography, TextField, Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface ExportPageProps {
    status: string;
    batchName: string;
    setBatchName: (v: string) => void;
    batchNumber: string;
    setBatchNumber: (v: string) => void;
    convertedFile: Blob | null;
    showDownloadButton: boolean;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDownload: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

const ExportPage: React.FC<ExportPageProps> = ({
    status, batchName, setBatchName, batchNumber, setBatchNumber,
    convertedFile, showDownloadButton, handleFileUpload, handleDownload, fileInputRef,
}) => {
    const isSuccess = status.includes('successful');
    const isError = status.includes('Error');

    return (
        <Box className="animate-fade-in" sx={{ maxWidth: 720 }}>
            {/* Page header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 1, color: 'var(--text-primary)' }}>
                    Zelle → Breeze
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    Convert your Zelle payment CSV files to BreezeCMS format
                </Typography>
            </Box>

            {/* Settings card */}
            <Box className="card" sx={{ p: 4, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Batch Settings
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        id="batch-name-input"
                        label="Batch Name"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        fullWidth
                        size="medium"
                    />
                    <TextField
                        id="batch-number-input"
                        label="Batch Number"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        fullWidth
                        size="medium"
                    />
                </Box>
            </Box>

            {/* Upload area */}
            <Box
                className="card"
                component="label"
                sx={{
                    p: 5,
                    mb: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: '2px dashed var(--surface-300)',
                    background: 'var(--surface-50)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                        borderColor: 'var(--primary-400)',
                        background: 'var(--primary-50)',
                        '& .upload-icon': {
                            transform: 'translateY(-4px)',
                            color: 'var(--primary-500)',
                        },
                    },
                }}
            >
                <CloudUploadIcon
                    className="upload-icon"
                    sx={{
                        fontSize: 48,
                        color: 'var(--text-tertiary)',
                        mb: 2,
                        transition: 'all 0.3s ease',
                    }}
                />
                <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Upload CSV File
                </Typography>
                <Typography sx={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    Click to browse or drag and drop your Zelle CSV file
                </Typography>
                <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                />
            </Box>

            {/* Status */}
            {status !== 'No file uploaded.' && (
                <Box
                    className="animate-slide-in-up"
                    sx={{
                        p: 2,
                        px: 2.5,
                        mb: 3,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        background: isSuccess
                            ? 'var(--success-light)'
                            : isError
                                ? 'var(--error-light)'
                                : 'var(--surface-100)',
                        border: '1px solid',
                        borderColor: isSuccess
                            ? 'rgba(34,197,94,0.2)'
                            : isError
                                ? 'rgba(239,68,68,0.2)'
                                : 'var(--surface-200)',
                    }}
                >
                    {isSuccess ? (
                        <FileDownloadDoneIcon sx={{ color: 'var(--success)', fontSize: 22 }} />
                    ) : (
                        <InsertDriveFileIcon sx={{ color: isError ? 'var(--error)' : 'var(--text-secondary)', fontSize: 22 }} />
                    )}
                    <Typography sx={{
                        fontSize: '0.9rem', fontWeight: 500,
                        color: isSuccess ? 'var(--success)' : isError ? 'var(--error)' : 'var(--text-secondary)',
                    }}>
                        {status}
                    </Typography>
                </Box>
            )}

            {/* Download button */}
            {convertedFile && showDownloadButton && (
                <Button
                    id="download-button"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    className="animate-slide-in-up"
                    sx={{
                        py: 1.5, px: 4,
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                            boxShadow: '0 8px 24px rgba(20, 184, 166, 0.35)',
                        },
                    }}
                >
                    Download Converted File
                </Button>
            )}
        </Box>
    );
};

export default ExportPage;

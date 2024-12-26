"use client";

import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { createClient } from '@supabase/supabase-js';

const drawerWidth = 240;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FileUploader: React.FC = () => {
  const [status, setStatus] = useState<string>('No file uploaded.');
  const [batchNumber, setBatchNumber] = useState<string>('100');
  const [batchName, setBatchName] = useState<string>('Zelle Import');
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [breezeAccounts, setBreezeAccounts] = useState<any[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [activePage, setActivePage] = useState<'export' | 'edit'>('export');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editAccount, setEditAccount] = useState<any | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(null);
  const [showDownloadButton, setShowDownloadButton] = useState<boolean>(true);
  const [authDialogOpen, setAuthDialogOpen] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadBreezeAccounts = async () => {
      try {
        const { data, error } = await supabase.from('breezeAccounts').select('*');
        if (error) throw error;
        setBreezeAccounts(data);
        setFilteredAccounts(data);
      } catch (error) {
        console.error('Error loading Breeze accounts:', error);
        setBreezeAccounts([]);
        setFilteredAccounts([]);
      }
    };

    if (isAuthenticated) {
      loadBreezeAccounts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setAuthDialogOpen(false);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setStatus('No file selected.');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const zelleSheet = workbook.Sheets[workbook.SheetNames[0]];
      const zelleData = XLSX.utils.sheet_to_json(zelleSheet);
      const missingAccounts: string[] = [];

      const breezeData = zelleData.map((row: any) => {
        const description = row['Description'] || '';
        const nameParts = extractName(description);
        const fullName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
        let breezeId = getBreezeId(fullName);
        if (!breezeId) {
          missingAccounts.push(fullName);
        }

        return {
          "Breeze ID": breezeId || 'MISSING',
          "First Name": nameParts.firstName,
          "Last Name": nameParts.lastName,
          Date: row['Posting Date'],
          Amount: row['Amount'],
          Fund: 'Tithe',
          Method: 'Zelle',
          "Batch Name": batchName,
          "Batch Number": batchNumber,
          "Check Number": '',
          Note: '',
        };
      });

      if (missingAccounts.length > 0) {
        const updatedAccounts = await handleMissingAccounts(missingAccounts, breezeData);
        setBreezeAccounts(updatedAccounts);
        setFilteredAccounts(updatedAccounts);
        await saveBreezeAccounts(updatedAccounts);
      }

      const newWorkbook = XLSX.utils.book_new();
      const newSheet = XLSX.utils.json_to_sheet(breezeData);
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'BreezeCMS');

      const fileBlob = new Blob([XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' })], {
        type: 'application/octet-stream',
      });

      setConvertedFile(fileBlob);
      setStatus('Conversion successful! Click "Download Converted File" to save.');
      setShowDownloadButton(true);
    } catch (error) {
      console.error('Error processing file:', error);
      setStatus('Error during conversion. Check the console for details.');
    }
  };

  const getBreezeId = (name: string): number => {
    for (const account of breezeAccounts) {
      if (account.zelleAccounts.some((zelle: any) => zelle.name === name)) {
        return account.id;
      }
    }
    return 0;
  };

  const extractName = (description: string): { firstName: string; lastName: string } => {
    if (!description.startsWith('Zelle payment from ')) {
      return { firstName: '', lastName: '' };
    }
    const trimmedDescription = description.replace('Zelle payment from ', '').trim();
    const words = trimmedDescription.split(' ');
    const lastWord = words.pop();
    const firstName = words.shift() || '';
    return { firstName, lastName: words.join(' ') };
  };

  const handleMissingAccounts = async (missingAccounts: string[], breezeData: any[]): Promise<any[]> => {
    const updatedAccounts = [...breezeAccounts];
    for (const name of missingAccounts) {
      const id = parseInt(prompt(`Please provide Breeze ID for ${name}:`) || '0', 10);
      if (id) {
        const existingAccount = updatedAccounts.find((account) => account.id === id);
        if (existingAccount) {
          existingAccount.zelleAccounts.push({ name });
        } else {
          updatedAccounts.push({ id, zelleAccounts: [{ name }] });
        }
        // Update the breezeData with the new ID
        breezeData.forEach((entry: any) => {
          if (`${entry["First Name"]} ${entry["Last Name"]}`.trim() === name) {
            entry["Breeze ID"] = id;
          }
        });
      }
    }
    return updatedAccounts;
  };

  const saveBreezeAccounts = async (accounts: any[]) => {
    try {
      const { error } = await supabase.from('breezeAccounts').upsert(accounts);
      if (error) throw error;
    } catch (error) {
      console.error('Error saving Breeze accounts:', error);
      throw error;
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(convertedFile);
      link.download = 'BreezeCMS_Output.xlsx';
      link.click();

      // Clear the file input value after the download is triggered
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Update the status message and hide the download button
      setStatus('File downloaded successfully.');
      setShowDownloadButton(false);
    }
  };

  const handleDelete = (accountId: number) => {
    setAccountIdToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (accountIdToDelete !== null) {
      const updatedAccounts = breezeAccounts.filter((account) => account.id !== accountIdToDelete);

      setBreezeAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts);
      await saveBreezeAccounts(updatedAccounts);
      setDeleteDialogOpen(false);
      setAccountIdToDelete(null);

      try {
        const { error } = await supabase.from('breezeAccounts').delete().eq('id', accountIdToDelete);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting Breeze account:', error);
      }
    }
  };

  useEffect(() => {
    const filtered = breezeAccounts.filter(
        (acc: any) =>
            acc.id === parseInt(searchQuery, 10) ||
            acc.zelleAccounts.some((zelle: any) => zelle.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredAccounts(filtered);
  }, [searchQuery, breezeAccounts]);

  const handleEdit = (account: any) => {
    setEditAccount(account);
    setDialogOpen(true);
  };

  const handleEditSave = () => {
    const updatedAccounts = breezeAccounts.map((acc: any) => (acc.id === editAccount.id ? editAccount : acc));
    setBreezeAccounts(updatedAccounts);
    setFilteredAccounts(updatedAccounts);
    setDialogOpen(false);
    saveBreezeAccounts(updatedAccounts);
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password);
      if (error) throw error;
      if (data.length > 0) {
        setIsAuthenticated(true);
        setAuthDialogOpen(false);
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        alert('Invalid username or password');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setAuthDialogOpen(true);
  };

  const renderContent = () => {
    if (activePage === 'export') {
      return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">Zelle to Breeze Converter</Typography>
            <TextField
                label="Batch Name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Batch Number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button variant="contained" component="label" sx={{ mt: 2 }}>
              Upload File
              <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} ref={fileInputRef}/>
            </Button>
            <Typography variant="body1" sx={{ mt: 2 }}>{status}</Typography>
            {convertedFile && showDownloadButton && (
                <Button variant="outlined" onClick={handleDownload} sx={{ mt: 2 }}>
                  Download Converted File
                </Button>
            )}
          </Box>
      );
    }

    if (activePage === 'edit') {
      return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">Breeze Accounts</Typography>
            <TextField
                label="Search by ID or Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                  endAdornment: (
                      <IconButton>
                        <SearchIcon />
                      </IconButton>
                  ),
                }}
            />
            <DataGrid
                rows={filteredAccounts.map((account: any, index: number) => ({
                  id: account.id,
                  zelleAccounts: account.zelleAccounts,
                  index,
                }))}
                columns={[
                  { field: 'id', headerName: 'Breeze ID', width: 150 },
                  {
                    field: 'zelleAccounts',
                    headerName: 'Zelle Accounts',
                    flex: 2,
                    renderCell: (params) => params.value.map((zelle: any) => zelle.name).join(', '),
                  },
                  {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 150,
                    renderCell: (params) => (
                        <>
                          <IconButton onClick={() => handleEdit(params.row)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(params.row.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                    ),
                  },
                ]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20]}
                autoHeight
            />
          </Box>
      );
    }
  };

  return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                EEBC Dallas
              </Typography>
              <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  icon={<DarkModeIcon />}
                  checkedIcon={<DarkModeIcon />}
              />
              {isAuthenticated && (
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </Toolbar>
          </AppBar>
          <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
              }}
          >
            <Toolbar />
            <List>
              <ListItem button selected={activePage === 'export'} onClick={() => setActivePage('export')}>
                <ListItemText primary="Zelle to Breeze Converter" />
              </ListItem>
              <ListItem button selected={activePage === 'edit'} onClick={() => setActivePage('edit')}>
                <ListItemText primary="Breeze Accounts" />
              </ListItem>
            </List>
          </Drawer>
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            {isAuthenticated ? renderContent() : null}
          </Box>
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogContent>
              {editAccount && (
                  <Box>
                    <TextField
                        label="Breeze ID"
                        value={editAccount.id}
                        disabled
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Zelle Accounts"
                        value={editAccount.zelleAccounts.map((zelle: any) => zelle.name).join(', ')}
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
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete this account?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmDelete} variant="contained" color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)}>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
              <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  margin="normal"
              />
              <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleLogin} variant="contained">
                Login
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ThemeProvider>
  );
};

export default FileUploader;
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
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // updated
import fuzzysort from 'fuzzysort';

const drawerWidth = 240;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // added

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
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountId, setNewAccountId] = useState<number | null>(null);
  const [missingAccounts, setMissingAccounts] = useState<string[]>([]);
  const [currentMissingAccount, setCurrentMissingAccount] = useState<string | null>(null);
  const [missingAccountId, setMissingAccountId] = useState<number | null>(null);
  const [missingAccountDialogOpen, setMissingAccountDialogOpen] = useState<boolean>(false);
  const [breezeData, setBreezeData] = useState<any[]>([]);
  const [suggestedAccounts, setSuggestedAccounts] = useState<any[]>([]);
  // New state for forgot password flow:
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBreezeAccounts = async () => {
    try {
      const breezeCol = collection(db, 'breezeAccounts');
      const breezeSnapshot = await getDocs(breezeCol);
      const data = breezeSnapshot.docs.map(docSnap => ({ id: parseInt(docSnap.id), ...docSnap.data() }));
      setBreezeAccounts(data);
      setFilteredAccounts(data);
    } catch (error) {
      console.error('Error loading Breeze accounts:', error);
      setBreezeAccounts([]);
      setFilteredAccounts([]);
    }
  };

  useEffect(() => {
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
      const text = await file.text();
      const csvData = XLSX.read(text, { type: 'string', cellDates: true });
      const zelleSheet = csvData.Sheets[csvData.SheetNames[0]];
      const zelleData = XLSX.utils.sheet_to_json(zelleSheet, { header: 1 });

      // Check if the first row is a header
      const firstRow = zelleData[0];
      const hasHeader =
        (firstRow as string[]).includes('Description') ||
        (firstRow as string[]).includes('Posting Date') ||
        (firstRow as string[]).includes('Amount');

      const dataRows = hasHeader ? zelleData.slice(1) : zelleData;
      const missingAccountsSet = new Set<string>();

      const mappedBreezeData = dataRows
        .filter((row: any) => row.some((cell: any) => cell !== undefined && cell !== null && cell !== ''))
        .map((row: any) => {
          const description = row[2] || '';
          const nameParts = extractName(description);
          const fullName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
          let breezeId = getBreezeId(fullName);
          if (!breezeId) {
            missingAccountsSet.add(fullName);
          }

          const date =
            typeof row[1] === 'string'
              ? row[1]
              : row[1].toLocaleDateString('en-US');

          return {
            "Breeze ID": breezeId || 'MISSING',
            "First Name": nameParts.firstName,
            "Last Name": nameParts.lastName,
            Date: date,
            Amount: row[3],
            Fund: 'Tithe',
            Method: 'Zelle',
            "Batch Number": batchNumber,
            "Batch Name": batchName,
            "Check Number": '',
            Note: '',
          };
        });

      setBreezeData(mappedBreezeData);

      const uniqueMissingAccounts = Array.from(missingAccountsSet);
      if (uniqueMissingAccounts.length > 0) {
        setMissingAccounts(uniqueMissingAccounts);
        setCurrentMissingAccount(uniqueMissingAccounts[0]);
        await fetchSuggestedAccounts(uniqueMissingAccounts[0]);
        setMissingAccountDialogOpen(true);
      } else {
        const newSheet = XLSX.utils.json_to_sheet(mappedBreezeData);
        const csvOutput = XLSX.utils.sheet_to_csv(newSheet);
        const fileBlob = new Blob([csvOutput], { type: 'text/csv' });
        setConvertedFile(fileBlob);
        setStatus('Conversion successful! Click "Download Converted File" to save.');
        setShowDownloadButton(true);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setStatus('Error during conversion. Check the console for details.');
    }
  };

  const fetchSuggestedAccounts = async (name: string) => {
    try {
      const breezeCol = collection(db, 'breezeAccounts');
      const breezeSnapshot = await getDocs(breezeCol);
      const data = breezeSnapshot.docs.map(docSnap => ({ id: parseInt(docSnap.id), ...docSnap.data() }));

      const searchableList = breezeAccounts.flatMap((acc) =>
        acc.zelleAccounts.map((zelleAccount: { name: string }) => {
          const originalName = zelleAccount.name;
          const parts = originalName.split(' ');
          const firstLastName = parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : originalName;
          return [
            { id: acc.id, name: originalName },
            { id: acc.id, name: firstLastName }
          ];
        })
      ).flat();

      // Create a simplified query from the input: only first and last names.
      const queryParts = name.split(' ').filter(part => part);
      const simplifiedQuery = queryParts.length >= 2 ? `${queryParts[0]} ${queryParts[queryParts.length - 1]}` : name;

      // Perform fuzzy search using both the original and simplified queries.
      const resultsOriginal = fuzzysort.go(name, searchableList, { key: 'name' });
      const resultsSimplified = fuzzysort.go(simplifiedQuery, searchableList, { key: 'name' });

      // Combine the two result sets and deduplicate by account ID.
      const combinedIds = new Set<number>();
      resultsOriginal.forEach(result => combinedIds.add(result.obj.id));
      resultsSimplified.forEach(result => combinedIds.add(result.obj.id));

      const matchedAccounts = data.filter((account: any) => combinedIds.has(account.id));
      setSuggestedAccounts(matchedAccounts);
    } catch (error) {
      console.error('Error fetching suggested accounts:', error);
      setSuggestedAccounts([]);
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setStatus('No file selected.');
      return;
    }

    try {
      const text = await file.text();
      const csvData = XLSX.read(text, { type: 'string' });
      const sheet = csvData.Sheets[csvData.SheetNames[0]];
      const bulkData = XLSX.utils.sheet_to_json(sheet);

      await Promise.all(bulkData.map(async (row: any) => {
        const account = {
          id: row['Breeze ID'],
          zelleAccounts: [{ name: `${row['First Name']} ${row['Last Name']}`.trim() }],
        };
        await setDoc(doc(db, 'breezeAccounts', account.id.toString()), account, { merge: true });
      }));

      await loadBreezeAccounts();
      setStatus('Bulk upload successful!');
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      setStatus('Error during bulk upload. Check the console for details.');
    }
  };

  const getBreezeId = (name: string): number => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
    for (const account of breezeAccounts) {
      if (account.zelleAccounts.some((zelle: any) => zelle.name.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedName)) {
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
      await Promise.all(accounts.map(async (account) => {
        await setDoc(doc(db, 'breezeAccounts', account.id.toString()), account, { merge: true });
      }));
    } catch (error) {
      console.error('Error saving Breeze accounts:', error);
      throw error;
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(convertedFile);
      link.download = 'BreezeCMS_Output.csv';
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
        await deleteDoc(doc(db, 'breezeAccounts', accountIdToDelete.toString()));
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

  const handleEditSave = async () => {
    try {
      const updatedAccounts = breezeAccounts.map((acc: any) => (acc.id === editAccount.id ? editAccount : acc));
      setBreezeAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts);
      setDialogOpen(false);
      await setDoc(doc(db, 'breezeAccounts', editAccount.id.toString()), editAccount, { merge: true });
    } catch (error) {
      console.error('Error updating Breeze account:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      setAuthDialogOpen(false);
      localStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Error during authentication:', error);
      alert('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setAuthDialogOpen(true);
  };

  const handleCreateAccount = async () => {
    // Add null check for newAccountId
    if (newAccountId === null) {
      alert("Please enter a valid Account ID");
      return;
    }
    try {
      const account = { id: newAccountId, zelleAccounts: [{ name: newAccountName }] };
      await setDoc(doc(db, 'breezeAccounts', newAccountId.toString()), account);
      await loadBreezeAccounts();
      setCreateDialogOpen(false);
      setNewAccountName('');
      setNewAccountId(null);
    } catch (error) {
      console.error('Error creating Breeze account:', error);
      setCreateDialogOpen(false);
    }
  };

  const handleMissingAccountSave = async () => {
    if (missingAccountId && currentMissingAccount) {
      const updatedAccounts = [...breezeAccounts];
      const existingAccount = updatedAccounts.find((account) => account.id === missingAccountId);
      
      if (existingAccount) {
        // Check if name already exists to avoid duplicates
        const nameExists = existingAccount.zelleAccounts.some(
          (zelle: any) => zelle.name.toLowerCase() === currentMissingAccount.toLowerCase()
        );
        
        if (!nameExists) {
          existingAccount.zelleAccounts = [
            ...existingAccount.zelleAccounts,
            { name: currentMissingAccount }
          ];
        }
      } else {
        updatedAccounts.push({ 
          id: missingAccountId, 
          zelleAccounts: [{ name: currentMissingAccount }] 
        });
      }
      
      setBreezeAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts);

      const updatedBreezeData = breezeData.map((entry: any) => {
        if (`${entry["First Name"]} ${entry["Last Name"]}`.trim() === currentMissingAccount) {
          entry["Breeze ID"] = missingAccountId;
        }
        return entry;
      });

      setBreezeData(updatedBreezeData);

      try {
        // When saving to Firestore, save the complete zelleAccounts array
        const accountToSave = updatedAccounts.find(acc => acc.id === missingAccountId);
        await setDoc(
          doc(db, 'breezeAccounts', missingAccountId.toString()),
          accountToSave,
          { merge: true }
        );
      } catch (error) {
        console.error('Error updating Breeze account:', error);
      }

      const nextMissingAccount = missingAccounts.slice(1);
      setMissingAccounts(nextMissingAccount);
      if (nextMissingAccount.length > 0) {
        setCurrentMissingAccount(nextMissingAccount[0]);
        setMissingAccountId(null);
        await fetchSuggestedAccounts(nextMissingAccount[0]);
      } else {
        setMissingAccountDialogOpen(false);
        const newSheet = XLSX.utils.json_to_sheet(updatedBreezeData);
        const csvOutput = XLSX.utils.sheet_to_csv(newSheet);
        const fileBlob = new Blob([csvOutput], { type: 'text/csv' });
        setConvertedFile(fileBlob);
        setStatus('Conversion successful! Click "Download Converted File" to save.');
        setShowDownloadButton(true);
      }
    }
  };

  const handleCancelImport = () => {
    setMissingAccountDialogOpen(false);
    setStatus('Import cancelled.');
    setConvertedFile(null);
    setShowDownloadButton(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendResetEmail = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('Password reset email sent.');
      setForgotPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error sending reset email:', error);
      alert('Error sending reset email.');
    }
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
              <input type="file" hidden accept=".csv" onChange={handleFileUpload} ref={fileInputRef}/>
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
                Create New Account
              </Button>
              <Button variant="contained" component="label" sx={{ ml: 2 }}>
                Bulk Upload Breeze Accounts
                <input type="file" hidden accept=".csv" onChange={handleBulkUpload} />
              </Button>
            </Box>
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
                    valueGetter: (params) => 
                      params.row.zelleAccounts
                        ? params.row.zelleAccounts.map((zelle: any) => zelle.name).join(', ')
                        : '',
                    renderCell: (params) => params.value,
                    sortComparator: (v1: string, v2: string) => v1.localeCompare(v2),
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
                        type="number"
                        disabled
                        value={editAccount.id}
                        onChange={(e) => setEditAccount({ ...editAccount, id: parseInt(e.target.value, 10) })}
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
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <Button onClick={() => setForgotPasswordDialogOpen(true)} sx={{ mt: 1 }}>
                Forgot Password?
              </Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleLogin} variant="contained">
                Login
              </Button>
            </DialogActions>
          </Dialog>

          {/* New Forgot Password Dialog */}
          <Dialog open={forgotPasswordDialogOpen} onClose={() => setForgotPasswordDialogOpen(false)}>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
              <TextField
                  label="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  fullWidth
                  margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setForgotPasswordDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSendResetEmail} variant="contained">
                Send Reset Email
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogContent>
              <TextField
                  label="Account ID"
                  type="number"
                  value={newAccountId || ''}
                  onChange={(e) => setNewAccountId(parseInt(e.target.value, 10))}
                  fullWidth
                  margin="normal"
              />
              <TextField
                  label="Account Name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  fullWidth
                  margin="normal"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAccount} variant="contained">
                Create
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog open={missingAccountDialogOpen} onClose={() => setMissingAccountDialogOpen(false)}>
            <DialogTitle>Missing Account</DialogTitle>
            <DialogContent>
              <Typography>Please provide Breeze ID for {currentMissingAccount}:</Typography>
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
                  <Typography variant="subtitle1">Suggested Accounts:</Typography>
                  <List>
                    {suggestedAccounts.map((account) => (
                      <ListItem key={account.id} button onClick={() => setMissingAccountId(account.id)}>
                        <ListItemText primary={`${account.id} - ${account.zelleAccounts.map((zelle: any) => zelle.name).join(', ')}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelImport}>Cancel Import</Button>
              <Button onClick={handleMissingAccountSave} variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ThemeProvider>
  );
};

export default FileUploader;
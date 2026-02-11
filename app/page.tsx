"use client";

import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { CssBaseline, Box, ThemeProvider } from '@mui/material';
import { GridPaginationModel } from '@mui/x-data-grid';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import fuzzysort from 'fuzzysort';

import { getTheme } from '@/components/ui/theme';
import LoginScreen from '@/components/LoginScreen';
import Sidebar from '@/components/Sidebar';
import ExportPage from '@/components/ExportPage';
import EditPage from '@/components/EditPage';
import {
  EditDialog, DeleteDialog, CreateDialog,
  ForgotPasswordDialog, MissingAccountDialog,
} from '@/components/Dialogs';

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
const auth = getAuth(app);

const FileUploader: React.FC = () => {
  const [status, setStatus] = useState<string>('No file uploaded.');
  const [batchNumber, setBatchNumber] = useState<string>(() => String(Math.floor(Math.random() * 900) + 100));
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
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');

  const theme = getTheme(darkMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply dark mode attribute to html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
    if (isAuthenticated) loadBreezeAccounts();
  }, [isAuthenticated]);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      setAuthDialogOpen(false);
    }
  }, []);

  const extractName = (description: string): { firstName: string; lastName: string } => {
    if (!description.startsWith('Zelle payment from ')) return { firstName: '', lastName: '' };
    const trimmedDescription = description.replace('Zelle payment from ', '').trim();
    const words = trimmedDescription.split(' ');
    const lastWord = words.pop();
    const firstName = words.shift() || '';
    return { firstName, lastName: words.join(' ') };
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
      const queryParts = name.split(' ').filter(part => part);
      const simplifiedQuery = queryParts.length >= 2 ? `${queryParts[0]} ${queryParts[queryParts.length - 1]}` : name;
      const resultsOriginal = fuzzysort.go(name, searchableList, { key: 'name' });
      const resultsSimplified = fuzzysort.go(simplifiedQuery, searchableList, { key: 'name' });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setStatus('No file selected.'); return; }
    try {
      const text = await file.text();
      const csvData = XLSX.read(text, { type: 'string', cellDates: true });
      const zelleSheet = csvData.Sheets[csvData.SheetNames[0]];
      const zelleData = XLSX.utils.sheet_to_json(zelleSheet, { header: 1 });
      const firstRow = zelleData[0];
      const hasHeader = (firstRow as string[]).includes('Description') || (firstRow as string[]).includes('Posting Date') || (firstRow as string[]).includes('Amount');
      const dataRows = hasHeader ? zelleData.slice(1) : zelleData;
      const missingAccountsSet = new Set<string>();
      const mappedBreezeData = dataRows
        .filter((row: any) => row.some((cell: any) => cell !== undefined && cell !== null && cell !== ''))
        .map((row: any) => {
          const description = row[2] || '';
          const nameParts = extractName(description);
          const fullName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
          let breezeId = getBreezeId(fullName);
          if (!breezeId) missingAccountsSet.add(fullName);
          const date = typeof row[1] === 'string' ? row[1] : row[1].toLocaleDateString('en-US');
          return {
            "Breeze ID": breezeId || 'MISSING', "First Name": nameParts.firstName,
            "Last Name": nameParts.lastName, Date: date, Amount: row[3], Fund: 'Tithe',
            Method: 'Zelle', "Batch Number": batchNumber, "Batch Name": batchName,
            "Check Number": '', Note: '',
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

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setStatus('No file selected.'); return; }
    try {
      const text = await file.text();
      const csvData = XLSX.read(text, { type: 'string' });
      const sheet = csvData.Sheets[csvData.SheetNames[0]];
      const bulkData = XLSX.utils.sheet_to_json(sheet);
      await Promise.all(bulkData.map(async (row: any) => {
        const account = { id: row['Breeze ID'], zelleAccounts: [{ name: `${row['First Name']} ${row['Last Name']}`.trim() }] };
        await setDoc(doc(db, 'breezeAccounts', account.id.toString()), account, { merge: true });
      }));
      await loadBreezeAccounts();
      setStatus('Bulk upload successful!');
    } catch (error) {
      console.error('Error processing bulk upload:', error);
      setStatus('Error during bulk upload. Check the console for details.');
    }
  };

  const saveBreezeAccounts = async (accounts: any[]) => {
    try {
      await Promise.all(accounts.map(async (account) => {
        await setDoc(doc(db, 'breezeAccounts', account.id.toString()), account, { merge: true });
      }));
    } catch (error) { console.error('Error saving Breeze accounts:', error); throw error; }
  };

  const handleDownload = () => {
    if (convertedFile) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(convertedFile);
      link.download = 'BreezeCMS_Output.csv';
      link.click();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus('File downloaded successfully.');
      setShowDownloadButton(false);
    }
  };

  const handleDelete = (accountId: number) => { setAccountIdToDelete(accountId); setDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (accountIdToDelete !== null) {
      try {
        await deleteDoc(doc(db, 'breezeAccounts', accountIdToDelete.toString()));
        const updatedAccounts = breezeAccounts.filter((account) => account.id !== accountIdToDelete);
        setBreezeAccounts(updatedAccounts);
        setFilteredAccounts(updatedAccounts);
        setDeleteDialogOpen(false);
        setAccountIdToDelete(null);
      } catch (error) { console.error('Error deleting Breeze account:', error); }
    }
  };

  useEffect(() => {
    const filtered = breezeAccounts.filter(
      (acc: any) => acc.id === parseInt(searchQuery, 10) ||
        acc.zelleAccounts.some((zelle: any) => zelle.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredAccounts(filtered);
  }, [searchQuery, breezeAccounts]);

  const handleEdit = (account: any) => { setEditAccount(account); setDialogOpen(true); };

  const handleEditSave = async () => {
    try {
      await setDoc(doc(db, 'breezeAccounts', editAccount.id.toString()), editAccount, { merge: true });
      const updatedAccounts = breezeAccounts.map((acc: any) => (acc.id === editAccount.id ? editAccount : acc));
      setBreezeAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts);
      setDialogOpen(false);
    } catch (error) { console.error('Error updating Breeze account:', error); }
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

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('isAuthenticated'); setAuthDialogOpen(true); };

  const handleCreateAccount = async () => {
    if (newAccountId === null) { alert("Please enter a valid Account ID"); return; }
    try {
      const account = { id: newAccountId, zelleAccounts: [{ name: newAccountName }] };
      await setDoc(doc(db, 'breezeAccounts', newAccountId.toString()), account);
      await loadBreezeAccounts();
      setCreateDialogOpen(false);
      setNewAccountName('');
      setNewAccountId(null);
    } catch (error) { console.error('Error creating Breeze account:', error); setCreateDialogOpen(false); }
  };

  const handleMissingAccountSave = async () => {
    if (missingAccountId && currentMissingAccount) {
      const updatedAccounts = [...breezeAccounts];
      const existingAccount = updatedAccounts.find((account) => account.id === missingAccountId);
      if (existingAccount) {
        const nameExists = existingAccount.zelleAccounts.some((zelle: any) => zelle.name.toLowerCase() === currentMissingAccount.toLowerCase());
        if (!nameExists) existingAccount.zelleAccounts = [...existingAccount.zelleAccounts, { name: currentMissingAccount }];
      } else {
        updatedAccounts.push({ id: missingAccountId, zelleAccounts: [{ name: currentMissingAccount }] });
      }
      setBreezeAccounts(updatedAccounts);
      setFilteredAccounts(updatedAccounts);
      const updatedBreezeData = breezeData.map((entry: any) => {
        if (`${entry["First Name"]} ${entry["Last Name"]}`.trim() === currentMissingAccount) entry["Breeze ID"] = missingAccountId;
        return entry;
      });
      setBreezeData(updatedBreezeData);
      try {
        const accountToSave = updatedAccounts.find(acc => acc.id === missingAccountId);
        await setDoc(doc(db, 'breezeAccounts', missingAccountId.toString()), accountToSave, { merge: true });
      } catch (error) { console.error('Error updating Breeze account:', error); }
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendResetEmail = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('Password reset email sent.');
      setForgotPasswordDialogOpen(false);
    } catch (error) { console.error('Error sending reset email:', error); alert('Error sending reset email.'); }
  };

  const exportBreezeAccounts = async () => {
    const data = breezeAccounts.map(account => ({ id: account.id, zelleAccounts: account.zelleAccounts.map((z: any) => z.name) }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'breeze_accounts.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== Render =====
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginScreen
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          onLogin={handleLogin}
          onForgotPassword={() => setForgotPasswordDialogOpen(true)}
        />
        <ForgotPasswordDialog
          open={forgotPasswordDialogOpen}
          onClose={() => setForgotPasswordDialogOpen(false)}
          resetEmail={resetEmail} setResetEmail={setResetEmail}
          onSend={handleSendResetEmail}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
        <Sidebar
          activePage={activePage} setActivePage={setActivePage}
          darkMode={darkMode} setDarkMode={setDarkMode}
          onLogout={handleLogout}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: '280px',
            p: { xs: 3, md: 5 },
            pt: { xs: 4, md: 5 },
            minHeight: '100vh',
          }}
        >
          {activePage === 'export' && (
            <ExportPage
              status={status}
              batchName={batchName} setBatchName={setBatchName}
              batchNumber={batchNumber} setBatchNumber={setBatchNumber}
              convertedFile={convertedFile}
              showDownloadButton={showDownloadButton}
              handleFileUpload={handleFileUpload}
              handleDownload={handleDownload}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            />
          )}
          {activePage === 'edit' && (
            <EditPage
              filteredAccounts={filteredAccounts}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              paginationModel={paginationModel} setPaginationModel={setPaginationModel}
              onEdit={handleEdit} onDelete={handleDelete}
              onCreateAccount={() => setCreateDialogOpen(true)}
              onBulkUpload={handleBulkUpload}
              onBulkExport={exportBreezeAccounts}
            />
          )}
        </Box>

        {/* All Dialogs */}
        <EditDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editAccount={editAccount} setEditAccount={setEditAccount} onSave={handleEditSave} />
        <DeleteDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={confirmDelete} />
        <CreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} newAccountId={newAccountId} setNewAccountId={setNewAccountId} newAccountName={newAccountName} setNewAccountName={setNewAccountName} onSave={handleCreateAccount} />
        <ForgotPasswordDialog open={forgotPasswordDialogOpen} onClose={() => setForgotPasswordDialogOpen(false)} resetEmail={resetEmail} setResetEmail={setResetEmail} onSend={handleSendResetEmail} />
        <MissingAccountDialog open={missingAccountDialogOpen} currentMissingAccount={currentMissingAccount} missingAccountId={missingAccountId} setMissingAccountId={setMissingAccountId} suggestedAccounts={suggestedAccounts} onSave={handleMissingAccountSave} onCancel={handleCancelImport} />
      </Box>
    </ThemeProvider>
  );
};

export default FileUploader;
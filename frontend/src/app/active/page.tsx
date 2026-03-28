'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { activeApplicationService } from '@/services/activeApplicationService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { ActiveApplication } from '@/types/activeApplication';
import { INTERVIEW_STAGES } from '@/lib/constants';
import { palette } from '@/lib/theme';

const stageColors: Record<string, string> = {
  'Phone Screen': palette.slate,
  'Round 1': palette.navy,
  'Round 2': palette.navyLight,
  'Round 3': palette.tealDark,
  'Final': palette.teal,
  'Offer': palette.success,
  'Declined': palette.error,
};

const emptyApp: Partial<ActiveApplication> = {
  company_name: '', status: 'Phone Screen', role: '', recruiter: '',
  resume_submitted: '', referral: '', notes: '',
};

export default function ActivePage() {
  const { notify } = useNotification();
  const [apps, setApps] = useState<ActiveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<ActiveApplication>>(emptyApp);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    try { setApps(await activeApplicationService.list()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleOpen = (app?: ActiveApplication) => {
    if (app) { setEditingApp(app); setEditingId(app.id); }
    else { setEditingApp({ ...emptyApp }); setEditingId(null); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingApp.company_name) { notify('Company name is required.', 'warning'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await activeApplicationService.update(editingId, editingApp);
        setApps((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await activeApplicationService.create(editingApp);
        setApps((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
      notify('Active application saved.', 'success');
    } catch { notify('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await activeApplicationService.remove(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
      notify('Deleted.', 'success');
    } catch { notify('Failed to delete.', 'error'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Active Applications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track interview stages for your active applications.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Active Application
        </Button>
      </Box>

      {loading ? <CircularProgress /> : apps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No active applications yet.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Recruiter</TableCell>
                <TableCell>Referral</TableCell>
                <TableCell>Last Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{app.company_name}</TableCell>
                  <TableCell>{app.role || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(stageColors[app.status] || palette.slate, 0.1),
                        color: stageColors[app.status] || palette.slate,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{app.recruiter || '-'}</TableCell>
                  <TableCell>{app.referral || '-'}</TableCell>
                  <TableCell>{app.last_contact_date ? new Date(app.last_contact_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(app)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(app.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit' : 'Add'} Active Application</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Company Name" required value={editingApp.company_name || ''} onChange={(e) => setEditingApp({ ...editingApp, company_name: e.target.value })} />
          <TextField label="Role" value={editingApp.role || ''} onChange={(e) => setEditingApp({ ...editingApp, role: e.target.value })} />
          <TextField label="Status" select value={editingApp.status || 'Phone Screen'} onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })}>
            {INTERVIEW_STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Recruiter" value={editingApp.recruiter || ''} onChange={(e) => setEditingApp({ ...editingApp, recruiter: e.target.value })} />
          <TextField label="Referral" value={editingApp.referral || ''} onChange={(e) => setEditingApp({ ...editingApp, referral: e.target.value })} />
          <TextField label="Last Contact Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={editingApp.last_contact_date || ''} onChange={(e) => setEditingApp({ ...editingApp, last_contact_date: e.target.value })} />
          <TextField label="Notes" multiline rows={3} value={editingApp.notes || ''} onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

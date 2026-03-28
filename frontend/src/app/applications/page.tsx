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
import { applicationService } from '@/services/applicationService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { Application } from '@/types/application';
import { APPLICATION_STATUSES } from '@/lib/constants';
import { palette } from '@/lib/theme';

const statusColors: Record<string, string> = {
  saved: palette.slate,
  applied: palette.navy,
  interviewing: palette.teal,
  offered: palette.success,
  rejected: palette.error,
  withdrawn: palette.warning,
};

const emptyApp: Partial<Application> = {
  company_name: '', job_id: '', job_description: '', resume_submitted: '',
  status: 'saved', referral: '', comments: '',
};

export default function ApplicationsPage() {
  const { notify } = useNotification();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<Application>>(emptyApp);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setApps(await applicationService.list());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const handleOpen = (app?: Application) => {
    if (app) {
      setEditingApp(app);
      setEditingId(app.id);
    } else {
      setEditingApp({ ...emptyApp });
      setEditingId(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingApp.company_name) {
      notify('Company name is required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await applicationService.update(editingId, editingApp);
        setApps((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await applicationService.create(editingApp);
        setApps((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
      notify('Application saved.', 'success');
    } catch {
      notify('Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await applicationService.remove(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
      notify('Application deleted.', 'success');
    } catch {
      notify('Failed to delete.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Applications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track all your submitted job applications.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Application
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : apps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No applications tracked yet. Add one to get started.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Job ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Match</TableCell>
                <TableCell>Referral</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{app.company_name}</TableCell>
                  <TableCell>{app.job_id || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(statusColors[app.status] || palette.slate, 0.1),
                        color: statusColors[app.status] || palette.slate,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell>{app.match_score != null ? `${app.match_score}%` : '-'}</TableCell>
                  <TableCell>{app.referral || '-'}</TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Application' : 'Add Application'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Company Name" required value={editingApp.company_name || ''} onChange={(e) => setEditingApp({ ...editingApp, company_name: e.target.value })} />
          <TextField label="Job ID" value={editingApp.job_id || ''} onChange={(e) => setEditingApp({ ...editingApp, job_id: e.target.value })} />
          <TextField label="Status" select value={editingApp.status || 'saved'} onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as Application['status'] })}>
            {APPLICATION_STATUSES.map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Referral" value={editingApp.referral || ''} onChange={(e) => setEditingApp({ ...editingApp, referral: e.target.value })} />
          <TextField label="Resume Submitted" value={editingApp.resume_submitted || ''} onChange={(e) => setEditingApp({ ...editingApp, resume_submitted: e.target.value })} />
          <TextField label="Comments" multiline rows={3} value={editingApp.comments || ''} onChange={(e) => setEditingApp({ ...editingApp, comments: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

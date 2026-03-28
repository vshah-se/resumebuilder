'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  Divider,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/SendOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { messagingService } from '@/services/messagingService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { MessagingSequence, Message } from '@/types/messaging';
import { MESSAGE_STAGES } from '@/lib/constants';
import { palette } from '@/lib/theme';

const stageLabels: Record<string, string> = {
  initial_outreach: 'Initial Outreach',
  follow_up_1: 'Follow-up 1',
  follow_up_2: 'Follow-up 2',
  follow_up_3: 'Follow-up 3',
  thank_you: 'Thank You',
};

export default function MessagingPage() {
  const { notify } = useNotification();
  const [sequences, setSequences] = useState<MessagingSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSeq, setSelectedSeq] = useState<MessagingSequence | null>(null);

  const [newSeq, setNewSeq] = useState({ company_name: '', role: '', recruiter_email: '', recruiter_name: '' });
  const [msgPrompt, setMsgPrompt] = useState('');
  const [msgStage, setMsgStage] = useState('initial_outreach');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadSequences(); }, []);

  const loadSequences = async () => {
    try { setSequences(await messagingService.listSequences()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleCreateSequence = async () => {
    if (!newSeq.recruiter_email) { notify('Recruiter email is required.', 'warning'); return; }
    setSaving(true);
    try {
      const created = await messagingService.createSequence(newSeq);
      setSequences((prev) => [{ ...created, messages: [] }, ...prev]);
      setSelectedSeq({ ...created, messages: [] });
      setDialogOpen(false);
      setNewSeq({ company_name: '', role: '', recruiter_email: '', recruiter_name: '' });
      notify('Sequence created.', 'success');
    } catch { notify('Failed to create sequence.', 'error'); }
    finally { setSaving(false); }
  };

  const handleGenerateEmail = async () => {
    if (!selectedSeq || !msgPrompt.trim()) {
      notify('Please enter a prompt.', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceId: selectedSeq.id,
          stage: msgStage,
          prompt: msgPrompt,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      const newMsg = await messagingService.addMessage({
        sequence_id: selectedSeq.id,
        stage: msgStage,
        prompt: msgPrompt,
        generated_content: data.body || data.content,
        status: 'draft',
      });

      setSelectedSeq((prev) => prev ? {
        ...prev,
        messages: [...(prev.messages || []), newMsg],
      } : null);

      setSequences((prev) => prev.map((s) =>
        s.id === selectedSeq.id
          ? { ...s, messages: [...(s.messages || []), newMsg] }
          : s
      ));

      setMsgPrompt('');
      notify('Email generated!', 'success');
    } catch {
      notify('Failed to generate email.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSequence = async (id: string) => {
    try {
      await messagingService.deleteSequence(id);
      setSequences((prev) => prev.filter((s) => s.id !== id));
      if (selectedSeq?.id === id) setSelectedSeq(null);
      notify('Sequence deleted.', 'success');
    } catch { notify('Failed to delete.', 'error'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Messaging</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create messaging sequences for recruiters and hiring managers.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          New Sequence
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sequence list */}
        <Grid size={{ xs: 12, md: 4 }}>
          {loading ? <CircularProgress /> : sequences.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No sequences yet.</Typography>
          ) : (
            sequences.map((seq) => (
              <Card
                key={seq.id}
                sx={{
                  mb: 1.5,
                  cursor: 'pointer',
                  borderColor: selectedSeq?.id === seq.id ? palette.teal : undefined,
                  bgcolor: selectedSeq?.id === seq.id ? alpha(palette.teal, 0.03) : undefined,
                }}
                onClick={() => setSelectedSeq(seq)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5">{seq.recruiter_name || seq.recruiter_email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[seq.company_name, seq.role].filter(Boolean).join(' - ') || 'No company'}
                    </Typography>
                    <Typography variant="caption">{seq.messages?.length || 0} messages</Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteSequence(seq.id); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>

        {/* Message composer + history */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedSeq ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h3" sx={{ mb: 2 }}>Compose Message</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      select
                      label="Stage"
                      value={msgStage}
                      onChange={(e) => setMsgStage(e.target.value)}
                      sx={{ minWidth: 180 }}
                    >
                      {MESSAGE_STAGES.map((s) => (
                        <MenuItem key={s} value={s}>{stageLabels[s] || s}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Prompt / Context"
                    placeholder="e.g., I'm interested in the Senior Engineer role and want to highlight my React experience..."
                    value={msgPrompt}
                    onChange={(e) => setMsgPrompt(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    onClick={handleGenerateEmail}
                    disabled={generating || !msgPrompt.trim()}
                  >
                    {generating ? 'Generating...' : 'Generate Email'}
                  </Button>
                </CardContent>
              </Card>

              {/* Message history */}
              {(selectedSeq.messages || []).length > 0 && (
                <Box>
                  <Typography variant="h3" sx={{ mb: 2 }}>Messages</Typography>
                  {(selectedSeq.messages || []).map((msg) => (
                    <Card key={msg.id} sx={{ mb: 2 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip label={stageLabels[msg.stage] || msg.stage} size="small" />
                          <Chip label={msg.status} size="small" variant="outlined" />
                        </Box>
                        {msg.prompt && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                            Prompt: {msg.prompt}
                          </Typography>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.generated_content}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Card>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Select or create a sequence</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a sequence from the left to compose messages.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Sequence Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Messaging Sequence</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Recruiter Email" required value={newSeq.recruiter_email} onChange={(e) => setNewSeq({ ...newSeq, recruiter_email: e.target.value })} />
          <TextField label="Recruiter Name" value={newSeq.recruiter_name} onChange={(e) => setNewSeq({ ...newSeq, recruiter_name: e.target.value })} />
          <TextField label="Company" value={newSeq.company_name} onChange={(e) => setNewSeq({ ...newSeq, company_name: e.target.value })} />
          <TextField label="Role" value={newSeq.role} onChange={(e) => setNewSeq({ ...newSeq, role: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSequence} disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

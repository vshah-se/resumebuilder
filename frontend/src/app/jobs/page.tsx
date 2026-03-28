'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  alpha,
} from '@mui/material';
import SendIcon from '@mui/icons-material/SendOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import { useRouter } from 'next/navigation';
import { jobDescriptionService } from '@/services/jobDescriptionService';
import { profileService } from '@/services/profileService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { JobDescription } from '@/types/jobDescription';
import { palette } from '@/lib/theme';

export default function JobsPage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [jdText, setJdText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await jobDescriptionService.list();
      setJobs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      notify('Please enter a job description.', 'warning');
      return;
    }

    setAnalyzing(true);
    try {
      const profile = await profileService.getProfile();
      if (!profile) {
        notify('Please create your profile first.', 'warning');
        setAnalyzing(false);
        return;
      }

      // Save JD
      const jd = await jobDescriptionService.create({
        profile_id: profile.id,
        company_name: companyName,
        role_title: roleTitle,
        source_url: sourceUrl,
        raw_text: jdText,
        status: 'pending',
      });

      // Call AI match endpoint
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, jobDescriptionId: jd.id }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const analysis = await res.json();

      // Update JD with match results
      const updated = await jobDescriptionService.update(jd.id, {
        match_score: analysis.matchScore,
        match_analysis: analysis,
        status: 'matched',
      });

      setSelectedJob(updated);
      setJobs((prev) => [updated, ...prev]);
      setJdText('');
      setCompanyName('');
      setRoleTitle('');
      setSourceUrl('');
      notify('Job analysis complete!', 'success');
    } catch {
      notify('Failed to analyze job description. Make sure your profile is set up.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await jobDescriptionService.remove(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      if (selectedJob?.id === id) setSelectedJob(null);
      notify('Job description deleted.', 'success');
    } catch {
      notify('Failed to delete.', 'error');
    }
  };

  const handleGenerateResume = (jobId: string) => {
    router.push(`/resume?jobId=${jobId}`);
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 0.5 }}>Job Match</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Paste a job description to analyze how well your skills match.
      </Typography>

      {/* Input form */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Role Title" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Job URL (optional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Job Description"
                placeholder="Paste the full job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={analyzing ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                onClick={handleAnalyze}
                disabled={analyzing || !jdText.trim()}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Match'}
              </Button>
            </Grid>
          </Grid>
          {analyzing && <LinearProgress sx={{ mt: 2 }} color="secondary" />}
        </CardContent>
      </Card>

      {/* Match results */}
      {selectedJob?.match_analysis && (
        <Card sx={{ mb: 3, borderColor: alpha(palette.teal, 0.3) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h3">
                  {selectedJob.company_name || 'Job'} {selectedJob.role_title && `- ${selectedJob.role_title}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">Match Analysis</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: `4px solid ${(selectedJob.match_analysis.matchScore ?? 0) >= 70 ? palette.success : (selectedJob.match_analysis.matchScore ?? 0) >= 40 ? palette.warning : palette.error}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h2">{selectedJob.match_analysis.matchScore ?? 0}%</Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 2 }}>{selectedJob.match_analysis.summary}</Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon fontSize="small" sx={{ color: palette.success }} /> Matched Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedJob.match_analysis.matchedSkills?.map((skill) => (
                  <Chip key={skill} label={skill} size="small" sx={{ bgcolor: alpha(palette.success, 0.1), color: palette.success }} />
                ))}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CancelIcon fontSize="small" sx={{ color: palette.error }} /> Missing Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedJob.match_analysis.missingSkills?.map((skill) => (
                  <Chip key={skill} label={skill} size="small" sx={{ bgcolor: alpha(palette.error, 0.1), color: palette.error }} />
                ))}
              </Box>
            </Box>

            {selectedJob.match_analysis.recommendations?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Recommendations</Typography>
                <ul style={{ paddingLeft: 20 }}>
                  {selectedJob.match_analysis.recommendations.map((rec, i) => (
                    <li key={i}><Typography variant="body2">{rec}</Typography></li>
                  ))}
                </ul>
              </Box>
            )}

            <Button
              variant="contained"
              color="secondary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => handleGenerateResume(selectedJob.id)}
            >
              Generate Resume for This Job
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History table */}
      <Typography variant="h3" sx={{ mb: 2 }}>Previous Analyses</Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : jobs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No job descriptions analyzed yet.</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedJob(job)}
                >
                  <TableCell>{job.company_name || '-'}</TableCell>
                  <TableCell>{job.role_title || '-'}</TableCell>
                  <TableCell>
                    {job.match_score != null ? (
                      <Chip
                        label={`${job.match_score}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(job.match_score >= 70 ? palette.success : job.match_score >= 40 ? palette.warning : palette.error, 0.1),
                          color: job.match_score >= 70 ? palette.success : job.match_score >= 40 ? palette.warning : palette.error,
                          fontWeight: 600,
                        }}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell><Chip label={job.status} size="small" variant="outlined" /></TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

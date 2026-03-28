'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  CircularProgress,
  Chip,
  Grid,
  Skeleton,
  alpha,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { profileService } from '@/services/profileService';
import { generatedResumeService } from '@/services/generatedResumeService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { FullProfile } from '@/types/profile';
import type { GeneratedResume, ResumeContent } from '@/types/generatedResume';
import { palette } from '@/lib/theme';

export default function ResumePage() {
  return (
    <Suspense fallback={<Box><CircularProgress /></Box>}>
      <ResumePageContent />
    </Suspense>
  );
}

function ResumePageContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { notify } = useNotification();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [resume, setResume] = useState<GeneratedResume | null>(null);
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [p, allResumes] = await Promise.all([
          profileService.getFullProfile(),
          generatedResumeService.list(),
        ]);
        setProfile(p);
        setResumes(allResumes);

        // If jobId is specified and we already have a resume for it, show it
        if (jobId && allResumes.length > 0) {
          const existing = allResumes.find((r) => r.job_description_id === jobId);
          if (existing) setResume(existing);
        } else if (allResumes.length > 0) {
          setResume(allResumes[0]);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleGenerate = async () => {
    if (!profile) {
      notify('Please create your profile first.', 'warning');
      return;
    }
    if (!jobId) {
      notify('Please analyze a job description first from the Job Match page.', 'warning');
      return;
    }

    setGenerating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const res = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, jobDescriptionId: jobId }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      setProgress(100);

      const saved = await generatedResumeService.create({
        profile_id: profile.id,
        job_description_id: jobId,
        content: data.content,
        include_photo: false,
        version: 1,
      });

      setResume(saved);
      setResumes((prev) => [saved, ...prev]);
      notify('Resume generated successfully!', 'success');
    } catch {
      notify('Failed to generate resume. Please try again.', 'error');
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!resume) return;
    setDownloading(format);
    try {
      const res = await fetch(`/api/resume/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id }),
      });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      notify(`Resume downloaded as ${format.toUpperCase()}!`, 'success');
    } catch {
      notify(`Failed to download ${format.toUpperCase()}.`, 'error');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={48} />
        <Skeleton variant="rounded" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  const content: ResumeContent | null = resume?.content ?? null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">Resume</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {resume ? 'Preview and download your generated resume' : 'Generate a tailored resume from the Job Match page'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {jobId && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Resume'}
            </Button>
          )}
          {resume && (
            <>
              <Button
                variant="outlined"
                startIcon={downloading === 'pdf' ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={() => handleDownload('pdf')}
                disabled={!!downloading}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={downloading === 'docx' ? <CircularProgress size={18} /> : <DownloadIcon />}
                onClick={() => handleDownload('docx')}
                disabled={!!downloading}
              >
                DOCX
              </Button>
            </>
          )}
        </Box>
      </Box>

      {generating && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Generating your tailored resume...</Typography>
            <LinearProgress variant="determinate" value={progress} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{Math.round(progress)}%</Typography>
          </CardContent>
        </Card>
      )}

      {/* Resume Preview */}
      {content ? (
        <Card sx={{ maxWidth: 800, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Typography variant="h2" sx={{ textAlign: 'center', mb: 0.5 }}>
              {profile?.first_name} {profile?.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
              {[profile?.email, profile?.phone, profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : ''].filter(Boolean).join(' | ')}
            </Typography>
            {(profile?.linkedin || profile?.portfolio_link) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                {[profile?.linkedin, profile?.portfolio_link].filter(Boolean).join(' | ')}
              </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Summary */}
            {content.summary && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: palette.navy }}>PROFESSIONAL SUMMARY</Typography>
                <Typography variant="body1">{content.summary}</Typography>
              </Box>
            )}

            {/* Experience */}
            {content.experience?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: palette.navy }}>EXPERIENCE</Typography>
                {content.experience.map((exp, i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h5">{exp.company}</Typography>
                      <Typography variant="body2" color="text.secondary">{exp.location}</Typography>
                    </Box>
                    {exp.role && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{exp.role}</Typography>}
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {exp.bullets?.map((b, j) => (
                        <li key={j}><Typography variant="body2">{b}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                ))}
              </Box>
            )}

            {/* Education */}
            {content.education?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, color: palette.navy }}>EDUCATION</Typography>
                {content.education.map((edu, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="h5">{edu.school}</Typography>
                      <Typography variant="body2" color="text.secondary">{edu.degree}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{edu.location}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Skills */}
            {content.skills?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, color: palette.navy }}>SKILLS</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {content.skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        !generating && (
          <Card>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>No resume generated yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Go to the Job Match page, analyze a job description, then click &quot;Generate Resume for This Job&quot;.
              </Typography>
            </CardContent>
          </Card>
        )
      )}

      {/* Version history */}
      {resumes.length > 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Previous Resumes</Typography>
          <Grid container spacing={2}>
            {resumes.slice(1).map((r) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.id}>
                <Card
                  sx={{ cursor: 'pointer', bgcolor: resume?.id === r.id ? alpha(palette.teal, 0.05) : undefined }}
                  onClick={() => setResume(r)}
                >
                  <CardContent>
                    <Typography variant="h5">Version {r.version}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(r.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

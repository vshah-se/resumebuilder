'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Skeleton,
  alpha,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import WorkIcon from '@mui/icons-material/WorkOutlineOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { profileService } from '@/services/profileService';
import { applicationService } from '@/services/applicationService';
import { activeApplicationService } from '@/services/activeApplicationService';
import type { Profile } from '@/types/profile';
import { palette } from '@/lib/theme';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ applications: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, apps, activeApps] = await Promise.all([
          profileService.getProfile(),
          applicationService.list(),
          activeApplicationService.list(),
        ]);
        setProfile(p);
        setStats({ applications: apps.length, active: activeApps.length });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={48} />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const quickActions = [
    {
      title: 'Build Profile',
      description: profile ? 'Edit your profile and skills' : 'Upload resume or create your profile',
      icon: PersonIcon,
      color: palette.teal,
      path: '/profile',
    },
    {
      title: 'Match Job',
      description: 'Paste a job description and analyze your fit',
      icon: WorkIcon,
      color: palette.navy,
      path: '/jobs',
    },
    {
      title: 'Generate Resume',
      description: 'Create an ATS-friendly resume tailored to a job',
      icon: DescriptionIcon,
      color: palette.tealDark,
      path: '/resume',
    },
  ];

  return (
    <Box>
      {/* Welcome header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          {profile ? `Welcome back, ${profile.first_name}` : 'Welcome to ResumeForge'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {profile
            ? 'Manage your job search from one place.'
            : 'Get started by creating your profile or uploading an existing resume.'}
        </Typography>
      </Box>

      {/* Stats row */}
      {profile && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h2" sx={{ color: palette.teal }}>
                  {stats.applications}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h2" sx={{ color: palette.navy }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Interviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick actions */}
      <Typography variant="h3" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Grid size={{ xs: 12, md: 4 }} key={action.path}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  '&:hover': {
                    borderColor: alpha(action.color, 0.4),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(action.color, 0.12)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
                onClick={() => router.push(action.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      mb: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Icon />
                  </Avatar>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {action.description}
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ color: action.color }}
                  >
                    Get started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Track applications */}
      <Typography variant="h3" sx={{ mt: 4, mb: 2 }}>
        Track Progress
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => router.push('/applications')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Avatar sx={{ bgcolor: alpha(palette.navy, 0.1), color: palette.navy }}>
                <AssignmentIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4">Application Tracker</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track all submitted applications
                </Typography>
              </Box>
              <ArrowForwardIcon color="action" />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{ cursor: 'pointer' }}
            onClick={() => router.push('/active')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
              <Avatar sx={{ bgcolor: alpha(palette.teal, 0.1), color: palette.tealDark }}>
                <AssignmentIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4">Active Interviews</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track interview stages and progress
                </Typography>
              </Box>
              <ArrowForwardIcon color="action" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

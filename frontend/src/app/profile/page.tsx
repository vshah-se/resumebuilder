'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import WorkExperienceForm from '@/components/profile/WorkExperienceForm';
import EducationForm from '@/components/profile/EducationForm';
import SkillsInput from '@/components/profile/SkillsInput';
import FileUploadZone from '@/components/common/FileUploadZone';
import { profileService } from '@/services/profileService';
import { workExperienceService } from '@/services/workExperienceService';
import { educationService } from '@/services/educationService';
import { skillsService } from '@/services/skillsService';
import { useNotification } from '@/components/common/NotificationProvider';
import type { Profile, WorkExperience, Education } from '@/types/profile';

export default function ProfilePage() {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importTab, setImportTab] = useState(0);
  const [importing, setImporting] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<Partial<Profile>>({});
  const [experiences, setExperiences] = useState<Partial<WorkExperience>[]>([]);
  const [educations, setEducations] = useState<Partial<Education>[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const full = await profileService.getFullProfile();
        if (full) {
          setProfileId(full.id);
          setPersonalInfo(full);
          setExperiences(full.work_experiences || []);
          setEducations(full.education || []);
          setSkills((full.skills || []).map((s) => s.name));
        }
      } catch {
        // No profile yet
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleFileImport = async (file: File) => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = importTab === 0 ? '/api/import/resume' : '/api/import/linkedin';
      const res = await fetch(endpoint, { method: 'POST', body: formData });

      if (!res.ok) throw new Error('Import failed');

      const parsed = await res.json();

      if (parsed.personalInfo) {
        setPersonalInfo((prev) => ({ ...prev, ...parsed.personalInfo }));
      }
      if (parsed.workExperiences?.length) {
        setExperiences(parsed.workExperiences);
      }
      if (parsed.education?.length) {
        setEducations(parsed.education);
      }
      if (parsed.skills?.length) {
        setSkills(parsed.skills);
      }

      notify('Profile data extracted successfully!', 'success');
    } catch {
      notify('Failed to import file. Please try again or enter manually.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async () => {
    if (!personalInfo.first_name || !personalInfo.last_name) {
      notify('First name and last name are required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const profile = await profileService.upsertProfile({
        ...personalInfo,
        import_source: personalInfo.import_source || 'manual',
      });
      const pid = profile.id;
      setProfileId(pid);

      // Save work experiences
      const existingExp = await workExperienceService.list(pid);
      for (const exp of existingExp) {
        await workExperienceService.remove(exp.id);
      }
      for (const exp of experiences) {
        if (exp.company_name) {
          await workExperienceService.create({ ...exp, profile_id: pid });
        }
      }

      // Save education
      const existingEdu = await educationService.list(pid);
      for (const edu of existingEdu) {
        await educationService.remove(edu.id);
      }
      for (const edu of educations) {
        if (edu.school_name) {
          await educationService.create({ ...edu, profile_id: pid });
        }
      }

      // Save skills
      await skillsService.sync(pid, skills);

      notify('Profile saved successfully!', 'success');
    } catch {
      notify('Failed to save profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={48} />
        <Skeleton variant="rounded" height={200} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Profile</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {profileId ? 'Edit your profile information' : 'Create your profile to get started'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>

      {/* Import options */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={importTab} onChange={(_, v) => setImportTab(v)} sx={{ mb: 2 }}>
          <Tab label="Upload Resume" />
          <Tab label="Upload LinkedIn Export" />
          <Tab label="Manual Entry" />
        </Tabs>
        {importTab < 2 && (
          <FileUploadZone
            accept={importTab === 0 ? '.pdf,.docx' : '.pdf'}
            label={importTab === 0 ? 'Drop your resume here' : 'Drop your LinkedIn export PDF'}
            helperText={
              importTab === 0
                ? 'Supports PDF and DOCX files. Re-upload anytime to update your profile.'
                : 'Export your LinkedIn profile as PDF and upload it'
            }
            onFileSelect={handleFileImport}
            loading={importing}
          />
        )}
      </Box>

      {/* Form sections */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h4">Personal Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PersonalInfoForm data={personalInfo} onChange={setPersonalInfo} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h4">Work Experience</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <WorkExperienceForm items={experiences} onChange={setExperiences} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h4">Education</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EducationForm items={educations} onChange={setEducations} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h4">Skills</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SkillsInput skills={skills} onChange={setSkills} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

'use client';

import { Grid, TextField } from '@mui/material';
import type { Profile } from '@/types/profile';

interface PersonalInfoFormProps {
  data: Partial<Profile>;
  onChange: (data: Partial<Profile>) => void;
}

export default function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const handleChange = (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="First Name"
          value={data.first_name || ''}
          onChange={handleChange('first_name')}
          required
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Last Name"
          value={data.last_name || ''}
          onChange={handleChange('last_name')}
          required
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={data.email || ''}
          onChange={handleChange('email')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Phone"
          value={data.phone || ''}
          onChange={handleChange('phone')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="City"
          value={data.city || ''}
          onChange={handleChange('city')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="State"
          value={data.state || ''}
          onChange={handleChange('state')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="Portfolio Link"
          value={data.portfolio_link || ''}
          onChange={handleChange('portfolio_link')}
          placeholder="https://..."
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          fullWidth
          label="LinkedIn"
          value={data.linkedin || ''}
          onChange={handleChange('linkedin')}
          placeholder="https://linkedin.com/in/..."
        />
      </Grid>
    </Grid>
  );
}

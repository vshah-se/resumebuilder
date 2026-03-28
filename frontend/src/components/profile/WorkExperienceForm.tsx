'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { WorkExperience } from '@/types/profile';

interface WorkExperienceFormProps {
  items: Partial<WorkExperience>[];
  onChange: (items: Partial<WorkExperience>[]) => void;
}

export default function WorkExperienceForm({ items, onChange }: WorkExperienceFormProps) {
  const addItem = () => {
    onChange([
      ...items,
      { company_name: '', city: '', state: '', country: '', website_link: '', experience_summary: '', sort_order: items.length },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Box>
      {items.map((item, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Job {index + 1}</Typography>
              <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={item.company_name || ''}
                  onChange={(e) => updateItem(index, 'company_name', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Website Link"
                  value={item.website_link || ''}
                  onChange={(e) => updateItem(index, 'website_link', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={item.city || ''}
                  onChange={(e) => updateItem(index, 'city', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={item.state || ''}
                  onChange={(e) => updateItem(index, 'state', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Country"
                  value={item.country || ''}
                  onChange={(e) => updateItem(index, 'country', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Experience Summary"
                  value={item.experience_summary || ''}
                  onChange={(e) => updateItem(index, 'experience_summary', e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
        Add Job
      </Button>
    </Box>
  );
}

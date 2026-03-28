'use client';

import { Autocomplete, Chip, TextField } from '@mui/material';
import { SKILL_SUGGESTIONS } from '@/lib/constants';

interface SkillsInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function SkillsInput({ skills, onChange }: SkillsInputProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={SKILL_SUGGESTIONS.filter((s) => !skills.includes(s))}
      value={skills}
      onChange={(_, newValue) => onChange(newValue)}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...rest } = getTagProps({ index });
          return <Chip key={key} label={option} size="small" {...rest} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Skills"
          placeholder="Type or select skills..."
          helperText="Start typing to see suggestions, or enter custom skills"
        />
      )}
    />
  );
}

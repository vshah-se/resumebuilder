'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUploadOutlined';
import { palette } from '@/lib/theme';

interface FileUploadZoneProps {
  accept: string;
  label: string;
  helperText: string;
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

export default function FileUploadZone({
  accept,
  label,
  helperText,
  onFileSelect,
  loading,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <Box
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      sx={{
        border: `2px dashed ${dragActive ? palette.teal : palette.border}`,
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        bgcolor: dragActive ? alpha(palette.teal, 0.04) : 'transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: palette.slateLight,
          bgcolor: alpha(palette.slate, 0.02),
        },
      }}
      onClick={() => document.getElementById('file-upload-input')?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <CloudUploadIcon
        sx={{ fontSize: 40, color: palette.slateLight, mb: 1 }}
      />
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {helperText}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Processing...' : 'Browse Files'}
      </Button>
    </Box>
  );
}

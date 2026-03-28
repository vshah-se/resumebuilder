'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface Notification {
  message: string;
  severity: AlertColor;
}

interface NotificationContextType {
  notify: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notify: () => {},
});

export function useNotification() {
  return useContext(NotificationContext);
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    message: '',
    severity: 'success',
  });

  const notify = useCallback((message: string, severity: AlertColor = 'success') => {
    setNotification({ message, severity });
    setOpen(true);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

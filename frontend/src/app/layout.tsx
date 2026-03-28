import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/lib/theme';
import AppShell from '@/components/common/AppShell';
import NotificationProvider from '@/components/common/NotificationProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResumeForge - ATS-Friendly Resume Builder',
  description: 'Build ATS-friendly resumes, track applications, and manage your job search.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NotificationProvider>
              <AppShell>{children}</AppShell>
            </NotificationProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

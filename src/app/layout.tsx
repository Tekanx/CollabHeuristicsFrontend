'use client';

import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import theme from '../components/styles/theme'
import { AuthProvider } from '@/hooks/useAuth'

export default function RootLayout({children}: {children: React.ReactNode}) {

    return (
      <html lang="en">
        <body>
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    )
  }
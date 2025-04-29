import { ThemeProvider } from '@emotion/react'
import React, { useEffect } from 'react'
import theme from '../components/styles/theme'
import { CssBaseline } from '@mui/material'
import { AuthProvider } from '../components/api/authContext';

function MyApp({ Component, pageProps }) {

    useEffect(() => {}, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <Component {...pageProps}/>
        </ThemeProvider>
    )
}

export default MyApp
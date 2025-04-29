import React from "react";
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from "@mui/material";
import theme from "../styles/theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
    </ThemeProvider>
  );
}

export default App;

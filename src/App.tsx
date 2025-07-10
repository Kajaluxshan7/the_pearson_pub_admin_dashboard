import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AdminDashboard } from "./components/AdminDashboard";
import { Login } from "./components/Login";
import SetupPassword from "./pages/SetupPassword";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#d9a419", // Golden yellow
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#111827",
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#d9a419", // Golden yellow
    },
    background: {
      default: "#111827",
      paper: "#1f2937",
    },
    text: {
      primary: "#ffffff",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          color: "#ffffff",
        },
      },
    },
  },
});

// Component to handle routing logic with access to useLocation
const AppContent: React.FC<{
  isDarkMode: boolean;
  lightTheme: any;
  darkTheme: any;
  toggleTheme: () => void;
}> = ({ isDarkMode, lightTheme, darkTheme, toggleTheme }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For setup-password route, don't check auth status
    if (location.pathname.startsWith("/setup-password")) {
      setLoading(false);
      return;
    }
    // Check if user is already logged in by verifying with backend
    checkAuthStatus();
  }, [location.pathname]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("http://localhost:5000/auth/profile", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  // Handle setup-password route
  if (location.pathname.startsWith("/setup-password")) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <SetupPassword />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Login onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AdminDashboard
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <AppContent
              isDarkMode={isDarkMode}
              lightTheme={lightTheme}
              darkTheme={darkTheme}
              toggleTheme={toggleTheme}
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

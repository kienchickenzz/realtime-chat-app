import { useSelector } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

import Routes from '@/routes'
import themes from '@/themes'
import NavigationScroll from '@/layout/NavigationScroll'

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

// import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const customization = useSelector((state) => state.customization)

  const { authUser, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });
  console.log({ authUser });

  // if (!authUser)
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Loader className="size-10 animate-spin" />
  //     </div>
  //   );

    return (
    // <div data-theme={theme}>
    //   <Navbar />

    //   <Routes>
    //     <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
    //     <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
    //     <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
    //     <Route path="/settings" element={<SettingsPage />} />
    //     <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
    //   </Routes>

    //   <Toaster />
    // </div>

        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    )
}
export default App

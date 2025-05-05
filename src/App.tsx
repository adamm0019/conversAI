import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Home }  from './pages/Home';
import { GameCenter } from './pages/GameCenter';
import { ProfileDashboard } from './pages/ProfileDashboard';
import ModulesPage from './pages/Modules';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useSupabaseChat } from './lib/supabase/supabaseClient';
import { ProfileProvider } from './contexts/ProfileContext'; 

function App() {
  const { user, isLoaded } = useUser();
  const { initializeSupabase, createUserProfile, isSupabaseInitialized } = useSupabaseChat();
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      if (user) {
        try {
          const isInitialized = await initializeSupabase();
          if (isInitialized) {
            await createUserProfile({
              email: user.primaryEmailAddress?.emailAddress || '',
            });
          } else {
            console.log('Running in local-only mode');
            // Continue without Supabase, we'll use localStorage fallbacks
          }
        } catch (error) {
          console.error('Failed to initialize Supabase:', error);
          // Continue without Supabase, we'll use localStorage fallbacks
        } finally {
          setInitializationAttempted(true);
        }
      } else {
        setInitializationAttempted(true);
      }
    };

    if (isLoaded && !initializationAttempted) {
      initUser();
    }
  }, [user, isLoaded, initializationAttempted, initializeSupabase, createUserProfile]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
      <BrowserRouter>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <Notifications position="top-right" />
          <ProfileProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                  path="/games"
                  element={user ? <GameCenter /> : <Navigate to="/" replace />}
              />
              <Route
                  path="/dashboard"
                  element={user ? <ProfileDashboard /> : <Navigate to="/" replace />}
              />
              <Route
                  path="/modules"
                  element={user ? <ModulesPage /> : <Navigate to="/" replace />}
              />
              {/* Legacy route for the original home */}
              <Route
                  path="/classic"
                  element={<Home />}
              />
            </Routes>
          </ProfileProvider>
        </MantineProvider>
      </BrowserRouter>
  );
}

export default App;
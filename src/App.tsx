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
import { useFirebaseChat } from './lib/firebase/firebaseConfig';
import { ProfileProvider } from './contexts/ProfileContext'; 

function App() {
  const { user, isLoaded } = useUser();
  const { initializeFirebase, createUserProfile, isFirebaseInitialized } = useFirebaseChat();
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      if (user) {
        try {
          const isInitialized = await initializeFirebase();
          if (isInitialized) {
            await createUserProfile({
              email: user.primaryEmailAddress?.emailAddress || '',
            });
          } else {
            console.log('Running in local-only mode');
            // Continue without Firebase, we'll use localStorage fallbacks
          }
        } catch (error) {
          console.error('Failed to initialize Firebase:', error);
          // Continue without Firebase, we'll use localStorage fallbacks
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
  }, [user, isLoaded, initializationAttempted]);

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
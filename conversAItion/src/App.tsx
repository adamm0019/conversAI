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
import { useEffect } from 'react';
import { useFirebaseChat } from './lib/firebase/firebaseConfig';
import { ProfileProvider } from './contexts/ProfileContext'; // Import ProfileProvider

function App() {
  const { user, isLoaded } = useUser();
  const { initializeFirebase, createUserProfile } = useFirebaseChat();

  useEffect(() => {
    const initUser = async () => {
      if (user) {
        const isInitialized = await initializeFirebase();
        if (isInitialized) {
          // creating new profile if user is accessing for the first time
          await createUserProfile({
            email: user.primaryEmailAddress?.emailAddress || '',
          });
        }
      }
    };

    if (isLoaded) {
      initUser();
    }
  }, [user, isLoaded]);

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
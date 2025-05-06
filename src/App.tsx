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
import { useFirebaseChatService } from './services/FirebaseChatService';
import { ProfileProvider } from './contexts/ProfileContext'; 
import { LanguageInspectorExample } from './components/LanguageInspector/ExampleUsage';

function App() {
  const { user, isLoaded } = useUser();
  const { createUserProfile } = useFirebaseChatService();
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [authTimeoutReached, setAuthTimeoutReached] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Authentication loading timed out, proceeding with application");
        setAuthTimeoutReached(true);
      }
    }, 8000); // 8 seconds timeout

    return () => clearTimeout(authTimeout);
  }, [isLoaded]);

  useEffect(() => {
    const initUser = async () => {
      if (user) {
        try {
          // Create Firebase user profile for the authenticated user
          await createUserProfile({
            email: user.primaryEmailAddress?.emailAddress || '',
          });
          console.log('Firebase user profile created');
        } catch (error) {
          console.error('Failed to initialize Firebase profile:', error);
          // Continue with localStorage fallbacks
        } finally {
          setInitializationAttempted(true);
        }
      } else {
        setInitializationAttempted(true);
      }
    };

    if ((isLoaded || authTimeoutReached) && !initializationAttempted) {
      initUser();
    }
  }, [user, isLoaded, authTimeoutReached, initializationAttempted, createUserProfile]);

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
              <Route
                  path="/language-inspector"
                  element={<LanguageInspectorExample />}
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
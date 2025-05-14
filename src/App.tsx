import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Home } from './pages/Home';
import { ProfileDashboard } from './pages/ProfileDashboard';
import ModulesPage from './pages/Modules';
import PronunciationPractice from './components/PronunciationPractice/PronunciationPractice';
import { Games } from './pages/Games';
import WordMatch from './pages/games/WordMatch';
import FixPhrase from './pages/games/FixPhrase';
import ModulePlayer from './pages/modules/[id]';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useFirebaseChatService } from './services/FirebaseChatService';
import { ProfileProvider } from './contexts/ProfileContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase/firebaseConfig';

function UserProfileInitializer() {
  const { user, isLoading } = useAuth();
  const { createUserProfile } = useFirebaseChatService();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      if (user && !isLoading) {
        try {


          await createUserProfile({
            email: user.email || '',
          });



          await checkOnboardingStatus(user.uid);
        } catch (error) {

        } finally {
          setCheckingOnboarding(false);
        }
      } else if (!isLoading) {
        setCheckingOnboarding(false);
      }
    };

    initUser();
  }, [user, isLoading, createUserProfile, navigate]);

  const checkOnboardingStatus = async (userId: string) => {
    try {

      const cachedOnboardingStatus = localStorage.getItem('isOnboarded');
      if (cachedOnboardingStatus === 'true') {
        return;
      }


      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfileSnap = await getDoc(userProfileRef);

      if (userProfileSnap.exists()) {
        const userData = userProfileSnap.data();

        if (!userData.isOnboarded) {

          navigate('/onboarding');
        } else {
          localStorage.setItem('isOnboarded', 'true');
        }
      } else {


        navigate('/onboarding');
      }
    } catch (error) {

    }
  };


  if (user && checkingOnboarding) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  return null;
}

function AppContent() {
  return (
    <UserProfileProvider>
      <ProfileProvider>
        <UserProfileInitializer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<ProfileDashboard />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/modules/:id" element={<ModulePlayer />} />
            <Route path="/pronunciation-practice" element={<PronunciationPractice />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/word-match" element={<WordMatch />} />
            <Route path="/games/fix-phrase" element={<FixPhrase />} />
          </Route>
          <Route path="/classic" element={<Home />} />
        </Routes>
      </ProfileProvider>
    </UserProfileProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications position="top-right" />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { Center, Loader, Text } from '@mantine/core';

function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      setIsCheckingOnboarding(true);

      try {

        const cachedOnboardingStatus = localStorage.getItem('isOnboarded');
        if (cachedOnboardingStatus === 'true') {
          setIsOnboarded(true);
          setIsCheckingOnboarding(false);
          return;
        }


        const userProfileRef = doc(db, 'user_profiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
          const userData = userProfileSnap.data();

          const onboardingComplete = userData.isOnboarded === true;
          setIsOnboarded(onboardingComplete);

          if (onboardingComplete) {
            localStorage.setItem('isOnboarded', 'true');
          }
        } else {

          setIsOnboarded(false);
        }
      } catch (error) {


        setIsOnboarded(true);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="lg" />
          <Text mt="md">Loading...</Text>
        </div>
      </Center>
    );
  }


  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }


  if (isOnboarded === false) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }


  return <Outlet />;
}

export default ProtectedRoute; 
import { Box, Paper, Text, Stack } from '@mantine/core';
import { createStyles } from '@mantine/styles'
import darkModeLogo from '../../../src/assets/conversai-logo-dark.png';
import lightModeLogo from '../../../src/assets/conversai-logo.png';
import { useMantineColorScheme } from '@mantine/core';
import { useState, useEffect } from 'react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const useStyles = createStyles((theme: { radius: { lg: any; md: any; }; white: any; spacing: { xs: any; lg: any; }; colors: { gray: any[]; }; }) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(0px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: theme.radius.lg,
    marginTop: '40px',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
    },
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    textAlign: 'center',
    color: theme.white,
    marginBottom: theme.spacing.xs,
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  description: {
    textAlign: 'center',
    color: theme.colors.gray[3],
    fontSize: '16px',
    marginBottom: theme.spacing.lg,
  },
  logo: {
    width: '180px',
    height: 'auto',
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1001,
  }
}));

export const AuthOverlay = () => {
  const { classes } = useStyles();
  const { colorScheme } = useMantineColorScheme();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, isLoading } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);
  
  
  useEffect(() => {
    
    if (isLoading) return;
    
    
    setShouldShow(!user);
  }, [user, isLoading]);
  
  
  if (isLoading) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box className={classes.overlay}>
            <img 
              src={colorScheme === 'dark' ? darkModeLogo : lightModeLogo} 
              alt="conversAI Logo"
              className={classes.logo}
            />
            <Paper p="md" className={classes.card}>
              <Stack gap="sm" align="center">
                <Text className={classes.description}>
                  {authMode === 'signin' 
                    ? 'Sign in to access the chat functionality' 
                    : 'Create an account to get started'}
                </Text>
                
                {authMode === 'signin' ? (
                  <SignIn onSwitch={() => setAuthMode('signup')} />
                ) : (
                  <SignUp onSwitch={() => setAuthMode('signin')} />
                )}
              </Stack>
            </Paper>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

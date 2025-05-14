import { useState } from 'react';
import { TextInput, PasswordInput, Button, Group, Box, Anchor, Alert } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpProps {
  onSwitch: () => void;
}

export function SignUp({ onSwitch }: SignUpProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signUpWithEmailPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');

    try {
      await signUpWithEmailPassword(email, password, displayName);
      
    } catch (error) {
      if (error instanceof Error) {
        const authError = error as { code?: string, message: string };
        let message = 'Failed to create account';
        
        if (authError.code === 'auth/email-already-in-use') {
          message = 'Email is already in use';
        } else if (authError.code === 'auth/invalid-email') {
          message = 'Invalid email address';
        } else if (authError.code === 'auth/weak-password') {
          message = 'Password is too weak';
        }
        
        setErrorMessage(message);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {errorMessage && (
        <Alert color="red" mb="sm">
          {errorMessage}
        </Alert>
      )}
      
      <TextInput
        label="Email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        mb="sm"
      />
      
      <TextInput
        label="Display Name"
        placeholder="Your name"
        description="This is how you'll appear in the app"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        mb="sm"
      />
      
      <PasswordInput
        label="Password"
        placeholder="Create a password"
        description="Password must be at least 6 characters long"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        mb="sm"
      />
      
      <PasswordInput
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        mb="md"
      />
      
      <Group justify="space-between" mt="md">
        <Anchor component="button" type="button" color="blue" size="sm" onClick={onSwitch}>
          Already have an account? Sign in
        </Anchor>
        <Button type="submit" loading={loading}>
          Sign up
        </Button>
      </Group>
    </Box>
  );
} 
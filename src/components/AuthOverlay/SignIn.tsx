import { useState } from 'react';
import { TextInput, PasswordInput, Button, Group, Box, Text, Anchor, Alert } from '@mantine/core';
import { useAuth } from '../../contexts/AuthContext';

interface SignInProps {
  onSwitch: () => void;
}

export function SignIn({ onSwitch }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signInWithEmailPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithEmailPassword(email, password);

    } catch (error) {
      if (error instanceof Error) {
        const authError = error as { code?: string, message: string };
        let message = 'Failed to sign in';

        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email') {
          message = 'Invalid email or password';
        } else if (authError.code === 'auth/user-disabled') {
          message = 'This account has been disabled';
        } else if (authError.code === 'auth/too-many-requests') {
          message = 'Too many failed attempts. Please try again later';
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

      <PasswordInput
        label="Password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        mb="md"
      />

      <Group justify="space-between" mt="md">
        <Anchor component="button" type="button" color="blue" size="sm" onClick={onSwitch}>
          Don't have an account? Sign up
        </Anchor>
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </Group>
    </Box>
  );
} 
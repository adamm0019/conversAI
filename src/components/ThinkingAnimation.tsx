import React from 'react';
import { Box, Group, Text, Paper } from '@mantine/core';
import { motion } from 'framer-motion';

export const ThinkingAnimation = () => {
  const dots = [0, 1, 2];
  
  return (
    <Paper 
      p="xs" 
      radius="lg" 
      style={{
        backgroundColor: 'rgba(37, 38, 43, 0.65)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--mantine-color-dark-4)',
        display: 'inline-block',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
      }}
    >
      <Group align="center" gap="sm">
        <Text size="sm" c="dimmed" fw={500}>AI is thinking</Text>
        <Group gap={8}>
          {dots.map((dot) => (
            <motion.div
              key={dot}
              initial={{ opacity: 0.3, scale: 0.8 }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: dot * 0.2,
                ease: "easeInOut"
              }}
            >
              <Box 
                style={{ 
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, var(--mantine-color-primary-4) 0%, var(--mantine-color-primary-6) 100%)`,
                  boxShadow: '0 0 6px rgba(25, 118, 210, 0.4)'
                }} 
              />
            </motion.div>
          ))}
        </Group>
      </Group>
    </Paper>
  );
};
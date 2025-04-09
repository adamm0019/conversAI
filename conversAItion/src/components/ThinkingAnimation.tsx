import React from 'react';
import { Box, Group, Text } from '@mantine/core';
import { motion } from 'framer-motion';

export const ThinkingAnimation = () => {
  const dots = [0, 1, 2];
  
  return (
    <Group align="center" gap="xs">
      <Text size="sm" c="dimmed">AI is thinking</Text>
      <Group gap={4}>
        {dots.map((dot) => (
          <motion.div
            key={dot}
            initial={{ opacity: 0.3, y: 0 }}
            animate={{ 
              opacity: [0.3, 1, 0.3],
              y: [0, -4, 0]
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
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-blue-5)'
              }} 
            />
          </motion.div>
        ))}
      </Group>
    </Group>
  );
};
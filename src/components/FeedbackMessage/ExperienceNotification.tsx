import React, { useEffect, useState } from 'react';
import { Paper, Text, Group, RingProgress, Center, Badge, Stack, Box } from '@mantine/core';
import { IconTrophy, IconArrowUp, IconBrain, IconStar } from '@tabler/icons-react';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';

const pulseAnimation = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' }
});

const glowAnimation = keyframes({
  '0%': { boxShadow: '0 0 5px rgba(90, 120, 220, 0.3)' },
  '50%': { boxShadow: '0 0 20px rgba(90, 120, 220, 0.6)' },
  '100%': { boxShadow: '0 0 5px rgba(90, 120, 220, 0.3)' }
});

export interface ExperienceNotificationProps {
  xpAmount: number;
  reason: string;
  levelUp?: boolean;
  newLevel?: string;
  onClose?: () => void;
  autoHideDuration?: number;
}

export const ExperienceNotification: React.FC<ExperienceNotificationProps> = ({
  xpAmount,
  reason,
  levelUp = false,
  newLevel,
  onClose,
  autoHideDuration = 4000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          setTimeout(onClose, 300); 
        }
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onClose]);

  
  const getColor = () => {
    if (xpAmount >= 50) return '#8366d1'; 
    if (xpAmount >= 20) return '#4195d3'; 
    return '#43c59e'; 
  };

  const color = getColor();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
        >
          <Paper
            p="md"
            radius="md"
            shadow="md"
            style={{
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: 'rgba(30, 31, 40, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: levelUp ? `${glowAnimation} 2s infinite ease-in-out` : undefined
            }}
          >
            
            {levelUp && (
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
                  zIndex: 0
                }}
              />
            )}
            
            <Group mb={levelUp ? 'sm' : 0}>
              <Group gap="sm">
                <IconTrophy
                  size={24}
                  style={{
                    color: color,
                    animation: `${pulseAnimation} 1.5s infinite ease-in-out`
                  }}
                />
                <Stack gap={0} justify="center">
                  <Text size="sm" fw={600}>
                    {reason}
                  </Text>
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">
                      You earned
                    </Text>
                    <Text size="xs" fw={700} c={color}>
                      {xpAmount} XP
                    </Text>
                  </Group>
                </Stack>
              </Group>
            </Group>
            
            {levelUp && newLevel && (
              <Paper
                p="xs"
                mt="sm"
                radius="sm"
                bg="rgba(255, 255, 255, 0.08)"
                style={{ border: `1px solid ${color}20` }}
              >
                <Group>
                  <IconBrain size={18} style={{ color: color }} />
                  <Text size="sm" fw={600}>
                    Level Up!
                  </Text>
                  <IconArrowUp size={14} style={{ color: color }} />
                  <Badge color={color} size="sm">
                    {newLevel.charAt(0).toUpperCase() + newLevel.slice(1)}
                  </Badge>
                </Group>
              </Paper>
            )}
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 
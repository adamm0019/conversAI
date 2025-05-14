import { useEffect } from 'react';
import { Paper, Text, Group, RingProgress, Center } from '@mantine/core';
import { createStyles } from '@mantine/styles';
import { IconFlame } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakNotificationProps {
  streak: number;
  isVisible: boolean;
  onHide: () => void;
}

const useStyles = createStyles((theme) => ({
  notificationWrapper: {
    position: 'fixed',
    right: 20,
    top: 80,
    zIndex: 1000,
  },
  notification: {
    background: theme.colorScheme === 'dark' 
      ? 'rgba(37, 38, 43, 0.95)' 
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
  }
}));

export const StreakNotification: React.FC<StreakNotificationProps> = ({ 
  streak, 
  isVisible, 
  onHide 
}) => {
  const { classes } = useStyles();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={classes.notificationWrapper}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Paper
            shadow="md"
            p="md"
            className={classes.notification}
          >
            <Group m="xs">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.5 }}
              >
                <RingProgress
                  size={40}
                  thickness={4}
                  sections={[{ value: (streak / 7) * 100, color: 'orange' }]}
                  label={
                    <Center>
                      <IconFlame size={20} color="orange" />
                    </Center>
                  }
                />
              </motion.div>
              <div>
                <Text size="lg" fw={700} c="orange">
                  {streak} Day Streak!
                </Text>
                <Text size="sm" c="dimmed">
                  Keep it up! 🔥
                </Text>
              </div>
            </Group>
          </Paper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
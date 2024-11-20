import React from 'react';
import { ActionIcon, Group } from '@mantine/core';
import { IconMicrophone, IconPlayerStop } from '@tabler/icons-react';
import { audioControlStyles } from './styles';
import { AudioVisualiser } from './AudioVisualiser';

interface AudioControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  clientCanvasRef: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  clientCanvasRef,
  serverCanvasRef,
}) => {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div style={audioControlStyles.container}>
      <Group gap="md">
        <AudioVisualiser canvasRef={clientCanvasRef} />
        <ActionIcon
          variant={isRecording ? 'filled' : 'light'}
          color={isRecording ? 'red' : 'blue'}
          size="xl"
          onClick={handleClick}
          style={audioControlStyles.button}
        >
          {isRecording ? (
            <IconPlayerStop size={24} />
          ) : (
            <IconMicrophone size={24} />
          )}
        </ActionIcon>
        <AudioVisualiser canvasRef={serverCanvasRef} />
      </Group>
    </div>
  );
};

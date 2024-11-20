import React from 'react';
import { audioControlStyles } from './styles';

interface AudioVisualiserProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const AudioVisualiser: React.FC<AudioVisualiserProps> = ({ canvasRef }) => {
  return (
    <div style={audioControlStyles.visualizer}>
      <canvas ref={canvasRef} width={100} height={40} />
    </div>
  );
};

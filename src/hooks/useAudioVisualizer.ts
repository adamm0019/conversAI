import { useEffect, useRef } from 'react';

interface UseAudioVisualizerProps {
  clientCanvasRef: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement>;
  wavRecorder: any;
  wavStreamPlayer: any;
}

export const useAudioVisualizer = ({
  clientCanvasRef,
  serverCanvasRef,
  wavRecorder,
  wavStreamPlayer
}: UseAudioVisualizerProps) => {
  const animationFrameRef = useRef<number>();

  const drawVisualizer = (canvas: HTMLCanvasElement, analyser: AnalyserNode) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Get frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Calculate bar width and spacing
    const barCount = 64; // Number of bars to display
    const barWidth = (width / barCount) * 0.8; // Leave 20% space between bars
    const barSpacing = (width / barCount) * 0.2;
    
    // Draw bars
    ctx.fillStyle = '#4C6EF5'; // Use a nice blue color
    
    for (let i = 0; i < barCount; i++) {
      // Get average of frequency range for this bar
      const startIndex = Math.floor((i / barCount) * frequencyData.length);
      const endIndex = Math.floor(((i + 1) / barCount) * frequencyData.length);
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += frequencyData[j];
      }
      const average = sum / (endIndex - startIndex);
      
      // Calculate bar height (normalize to canvas height)
      const barHeight = (average / 255) * height;
      
      // Draw bar from bottom of canvas
      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;
      
      // Round the top of the bars
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x, y + 2);
      ctx.arc(x + barWidth / 2, y + 2, barWidth / 2, Math.PI, 0);
      ctx.lineTo(x + barWidth, height);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (!wavRecorder || !wavStreamPlayer) return;

    const clientCanvas = clientCanvasRef.current;
    const serverCanvas = serverCanvasRef.current;
    if (!clientCanvas || !serverCanvas) return;

    // Set canvas dimensions
    const setCanvasDimensions = (canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    setCanvasDimensions(clientCanvas);
    setCanvasDimensions(serverCanvas);

    // Get analyzers from wavRecorder and wavStreamPlayer
    const clientAnalyser = wavRecorder?.audioWorklet?.analyser;
    const serverAnalyser = wavStreamPlayer?.audioWorklet?.analyser;

    const animate = () => {
      if (clientAnalyser) {
        drawVisualizer(clientCanvas, clientAnalyser);
      }
      if (serverAnalyser) {
        drawVisualizer(serverCanvas, serverAnalyser);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [wavRecorder, wavStreamPlayer, clientCanvasRef, serverCanvasRef]);
};

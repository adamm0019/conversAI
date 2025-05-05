import React, { useRef, useEffect } from 'react';
import { Box, useMantineTheme } from '@mantine/core';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    isActive?: boolean;
    color?: string;
    barCount?: number;
    style?: React.CSSProperties;
    visualizerStyle?: 'bars' | 'wave' | 'particles';
}

export const AudioVisualiser: React.FC<AudioVisualizerProps> = ({
                                                                            canvasRef,
                                                                            isActive = false,
                                                                            color,
                                                                            barCount = 32,
                                                                            style,
                                                                            visualizerStyle = 'bars',
                                                                        }) => {
    const theme = useMantineTheme();
    const animationFrameRef = useRef<number | null>(null);
    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        radius: number;
        velocity: { x: number; y: number };
        alpha: number;
        color: string;
    }>>([]);

    const defaultColor = color || theme.colors.primary[6];

    
    useEffect(() => {
        if (visualizerStyle === 'particles') {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            
            particlesRef.current = Array.from({ length: 50 }).map(() => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                velocity: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: (Math.random() - 0.5) * 0.5
                },
                alpha: Math.random() * 0.5 + 0.2,
                color: defaultColor,
            }));
        }
    }, [visualizerStyle, defaultColor]);

    
    const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioLevel: number = 0) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        
        const baseSpeed = 0.5;
        const intensity = isActive ? Math.min(0.2 + audioLevel * 2, 1) : 0.2;
        const glowSize = isActive ? 2 + audioLevel * 10 : 2;

        
        particlesRef.current.forEach(particle => {
            
            particle.x += particle.velocity.x * (baseSpeed + audioLevel * 3);
            particle.y += particle.velocity.y * (baseSpeed + audioLevel * 3);

            
            if (particle.x < 0 || particle.x > canvas.width) {
                particle.velocity.x *= -1;
            }
            if (particle.y < 0 || particle.y > canvas.height) {
                particle.velocity.y *= -1;
            }

            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);

            
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * glowSize
            );
            gradient.addColorStop(0, `rgba(100, 181, 246, ${intensity * particle.alpha})`);
            gradient.addColorStop(1, 'rgba(100, 181, 246, 0)');

            ctx.fillStyle = gradient;
            ctx.fill();

            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 181, 246, ${intensity * 0.8})`;
            ctx.fill();
        });

        
        if (isActive) {
            const distance = 30 + audioLevel * 30;
            ctx.strokeStyle = `rgba(100, 181, 246, ${intensity * 0.2})`;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particlesRef.current.length; i++) {
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p1 = particlesRef.current[i];
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < distance) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }
        }
    };

    
    const drawBars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioLevel: number = 0) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bars = barCount;
        const barWidth = (canvas.width / bars) * 0.8;
        const barSpacing = (canvas.width / bars) * 0.2;
        const maxBarHeight = canvas.height * 0.8;

        for (let i = 0; i < bars; i++) {
            
            let heightFactor;
            if (isActive) {
                
                const positionFactor = Math.sin((i / bars) * Math.PI);
                const baseFactor = 0.1 + Math.random() * 0.2;
                heightFactor = baseFactor + (positionFactor * audioLevel * 0.7);
            } else {
                
                const time = Date.now() / 1000;
                const phase = (i / bars) * Math.PI * 2;
                heightFactor = 0.1 + Math.sin(time * 2 + phase) * 0.05;
            }

            const barHeight = maxBarHeight * heightFactor;
            const x = i * (barWidth + barSpacing);
            const y = canvas.height - barHeight;

            
            const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
            gradient.addColorStop(0, `rgba(100, 181, 246, ${isActive ? 0.8 : 0.3})`);
            gradient.addColorStop(1, `rgba(33, 150, 243, ${isActive ? 0.4 : 0.1})`);

            ctx.fillStyle = gradient;

            
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.lineTo(x, y + barWidth/2);
            ctx.arc(x + barWidth/2, y + barWidth/2, barWidth/2, Math.PI, 0, true);
            ctx.lineTo(x + barWidth, canvas.height);
            ctx.fill();

            
            if (isActive && audioLevel > 0.2) {
                ctx.shadowColor = 'rgba(33, 150, 243, 0.5)';
                ctx.shadowBlur = 10 * audioLevel;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    };

    
    const drawWave = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, audioLevel: number = 0) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerY = canvas.height / 2;
        const amplitude = isActive ? (canvas.height / 4) * audioLevel : canvas.height / 16;

        
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let x = 0; x < canvas.width; x++) {
            
            const time = Date.now() / 1000;
            const frequency = 0.02;
            const baseWave = Math.sin(x * frequency + time * 2) * amplitude;
            const secondWave = Math.sin(x * frequency * 2 + time * 3) * amplitude * 0.3;

            const waveHeight = baseWave + secondWave;
            const y = centerY + waveHeight;

            ctx.lineTo(x, y);
        }

        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgba(100, 181, 246, ${isActive ? 0.1 : 0.05})`);
        gradient.addColorStop(0.5, `rgba(33, 150, 243, ${isActive ? 0.3 : 0.1})`);
        gradient.addColorStop(1, `rgba(25, 118, 210, ${isActive ? 0.1 : 0.05})`);

        ctx.fillStyle = gradient;
        ctx.fill();

        
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let x = 0; x < canvas.width; x++) {
            const time = Date.now() / 1000;
            const frequency = 0.02;
            const baseWave = Math.sin(x * frequency + time * 2) * amplitude;
            const secondWave = Math.sin(x * frequency * 2 + time * 3) * amplitude * 0.3;

            const waveHeight = baseWave + secondWave;
            const y = centerY + waveHeight;

            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(33, 150, 243, ${isActive ? 0.8 : 0.3})`;
        ctx.lineWidth = 2;

        
        if (isActive) {
            ctx.shadowColor = 'rgba(33, 150, 243, 0.5)';
            ctx.shadowBlur = 5;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    };

    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        
        const resizeCanvas = () => {
            const { width, height } = canvas.getBoundingClientRect();

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
        };

        resizeCanvas();

        
        const getMockAudioLevel = () => {
            if (!isActive) return 0;

            
            const time = Date.now() / 1000;
            const baseLevel = 0.2 + Math.sin(time * 2) * 0.15;
            const randomFactor = Math.random() * 0.1;

            return baseLevel + randomFactor;
        };

        
        const animate = () => {
            const audioLevel = getMockAudioLevel();

            switch (visualizerStyle) {
                case 'particles':
                    drawParticles(ctx, canvas, audioLevel);
                    break;
                case 'wave':
                    drawWave(ctx, canvas, audioLevel);
                    break;
                case 'bars':
                default:
                    drawBars(ctx, canvas, audioLevel);
                    break;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [canvasRef, isActive, barCount, visualizerStyle]);

    return (
        <motion.div
            initial={{ opacity: 0.6 }}
            animate={{
                opacity: isActive ? 1 : 0.6,
                scale: isActive ? 1 : 0.98
            }}
            transition={{ duration: 0.3 }}
            style={{
                background: 'rgba(26, 27, 30, 0.6)',
                borderRadius: theme.radius.md,
                overflow: 'hidden',
                boxShadow: isActive ? '0 0 15px rgba(33, 150, 243, 0.2)' : 'none',
                border: isActive ? '1px solid rgba(100, 181, 246, 0.3)' : '1px solid rgba(60, 60, 60, 0.3)',
                height: '100%',
                width: '100%',
                ...style
            }}
        >
            <Box style={{ width: '100%', height: '100%' }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        filter: isActive ? 'none' : 'grayscale(0.5)'
                    }}
                />
            </Box>
        </motion.div>
    );
};

export default AudioVisualiser;
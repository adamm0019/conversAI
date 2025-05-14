import React from 'react';
import { Box, Tooltip, useMantineTheme, MantineColor } from '@mantine/core';
import { motion } from 'framer-motion';

interface VoiceActivityIndicatorProps {
    audioLevel: number; 
    onClick: () => void; 
    size?: number; 
    color?: MantineColor | string; 
    tooltipLabel?: string;
}

const NUM_BARS = 20; 
const MIN_BAR_HEIGHT = 2; 
const MAX_BAR_HEIGHT_SCALE = 0.8; 

const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
                                                                           audioLevel,
                                                                           onClick,
                                                                           size = 42, 
                                                                           color = 'blue', 
                                                                           tooltipLabel = 'Stop recording',
                                                                       }) => {
    const theme = useMantineTheme();
    
    const barColor = theme.variantColorResolver({
        color: color || theme.primaryColor,
        theme,
        variant: 'filled', 
    }).background;

    const svgSize = size * 0.8; 
    const center = svgSize / 2;
    const maxPossibleHeight = center * MAX_BAR_HEIGHT_SCALE;
    const barWidth = svgSize / (NUM_BARS * 1.8); 

    
    const getBarHeight = (index: number): number => {
        const distanceFromCenter = Math.abs(index - (NUM_BARS - 1) / 2);
        const positionFactor = Math.max(0, 1 - distanceFromCenter / (NUM_BARS / 1.5));
        const effectiveAudioLevel = audioLevel * positionFactor;
        const targetHeight = MIN_BAR_HEIGHT + effectiveAudioLevel * maxPossibleHeight;
        return Math.max(MIN_BAR_HEIGHT, Math.min(targetHeight, maxPossibleHeight + MIN_BAR_HEIGHT));
    };

    return (
        <Tooltip label={tooltipLabel} position="top" withArrow>
            <Box
                onClick={onClick}
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '50%',
                     
                }}
                aria-label={tooltipLabel}
                component={motion.div} 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <svg
                    width={svgSize}
                    height={svgSize}
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    style={{ overflow: 'visible' }}
                >
                    <g transform={`translate(0, ${center})`}>
                        {Array.from({ length: NUM_BARS }).map((_, i) => {
                            const barHeight = getBarHeight(i);
                            const x = (svgSize / NUM_BARS) * i; 

                            return (
                                <motion.rect
                                    key={i}
                                    x={x}
                                    y={-barHeight / 2} 
                                    width={barWidth}
                                    
                                    initial={{ height: MIN_BAR_HEIGHT }}
                                    animate={{ height: barHeight }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }} 
                                    fill={barColor}
                                    rx={barWidth / 2} 
                                    ry={barWidth / 2}
                                />
                            );
                        })}
                    </g>
                </svg>
            </Box>
        </Tooltip>
    );
};

export default VoiceActivityIndicator;
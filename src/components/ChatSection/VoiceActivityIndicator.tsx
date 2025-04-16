import React from 'react';
import { Box, Tooltip, useMantineTheme, MantineColor } from '@mantine/core';
import { motion } from 'framer-motion';

interface VoiceActivityIndicatorProps {
    audioLevel: number; // Expected range: 0 to 1
    onClick: () => void; // Function to call when clicked (stop recording)
    size?: number; // Diameter of the circular indicator area
    color?: MantineColor | string; // Color of the bars
    tooltipLabel?: string;
}

const NUM_BARS = 20; // Number of visualizer bars
const MIN_BAR_HEIGHT = 2; // Minimum height for bars even with no sound
const MAX_BAR_HEIGHT_SCALE = 0.8; // Max height relative to indicator size/2

const VoiceActivityIndicator: React.FC<VoiceActivityIndicatorProps> = ({
                                                                           audioLevel,
                                                                           onClick,
                                                                           size = 42, // Corresponds roughly to Mantine's 'xl' ActionIcon size
                                                                           color = 'blue', // Default color, will be overridden by prop in EnhancedChatSection
                                                                           tooltipLabel = 'Stop recording',
                                                                       }) => {
    const theme = useMantineTheme();
    // Resolve color based on the prop passed or default Mantine primary color
    const barColor = theme.variantColorResolver({
        color: color || theme.primaryColor,
        theme,
        variant: 'filled', // Use filled variant color logic
    }).background;

    const svgSize = size * 0.8; // SVG drawing area size
    const center = svgSize / 2;
    const maxPossibleHeight = center * MAX_BAR_HEIGHT_SCALE;
    const barWidth = svgSize / (NUM_BARS * 1.8); // Adjust spacing

    // Calculate bar heights based on audio level and position
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
                    // Optional: Add transition for background changes if needed
                    // transition: 'background-color 0.2s ease',
                    // ':hover': { backgroundColor: 'rgba(var(--mantine-color-gray-6-rgb), 0.1)' }, // Example hover
                }}
                aria-label={tooltipLabel}
                component={motion.div} // Add motion for hover/tap effects
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <svg
                    width={svgSize}
                    height={svgSize}
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    style={{ overflow: 'visible' }}
                >
                    <g transform={`translate(0, ${center})`}> {/* Center group vertically */}
                        {Array.from({ length: NUM_BARS }).map((_, i) => {
                            const barHeight = getBarHeight(i);
                            const x = (svgSize / NUM_BARS) * i; // Bar positioning

                            return (
                                <motion.rect
                                    key={i}
                                    x={x}
                                    y={-barHeight / 2} // Center bar vertically around the middle line
                                    width={barWidth}
                                    // Animate the height smoothly
                                    initial={{ height: MIN_BAR_HEIGHT }}
                                    animate={{ height: barHeight }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }} // Spring animation
                                    fill={barColor}
                                    rx={barWidth / 2} // Rounded corners
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
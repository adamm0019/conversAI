import { useRef, useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface AudioServiceOptions {
    visualizationEnabled?: boolean;
    clientCanvasRef?: React.RefObject<HTMLCanvasElement>;
    serverCanvasRef?: React.RefObject<HTMLCanvasElement>;

    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;

    onAudioReceived?: (base64Audio: string) => Promise<void>;
    onVisualDataUpdate?: (data: Uint8Array) => void;
    onError?: (error: Error) => void;
}


export const playTextToSpeech = async (text: string, language?: string): Promise<void> => {
    if (!text) {

        return;
    }

    try {
        const elevenLabsServerUrl = import.meta.env.VITE_ELEVEN_LABS_SERVER_URL || 'http://localhost:3001';

        const response = await fetch(`${elevenLabsServerUrl}/api/text-to-speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                language
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to convert text to speech');
        }

        
        const audioBlob = await response.blob();
        
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        
        await audio.play();
        
        
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };

    } catch (error) {

    }
};

export const useAudioService = (options: AudioServiceOptions = {}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [serverAudioLevel, setServerAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const clientVisualizationIntervalRef = useRef<number | null>(null);
    const serverVisualizationIntervalRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

            if (options.visualizationEnabled) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
            }
        }
        return audioContextRef.current;
    }, [options.visualizationEnabled]);

    const visualizeClientAudio = useCallback(() => {
        if (!options.clientCanvasRef?.current || !analyserRef.current) return;

        const canvas = options.clientCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const drawVisualization = () => {
            if (!analyserRef.current) return null;

            clientVisualizationIntervalRef.current = requestAnimationFrame(drawVisualization);

            analyserRef.current.getByteFrequencyData(dataArray);

            const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
            setAudioLevel(average / 255);

            if (options.onVisualDataUpdate) {
                options.onVisualDataUpdate(dataArray);
            }

            canvasCtx.fillStyle = 'rgb(25, 26, 30)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            dataArray.forEach((value) => {
                const barHeight = (value / 255) * canvas.height;

                const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, 'rgba(65, 105, 225, 0.3)');
                gradient.addColorStop(1, 'rgba(65, 105, 225, 0.8)');

                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            });
        };

        drawVisualization();
    }, [options.clientCanvasRef, options.onVisualDataUpdate]);

    const visualizeServerAudio = useCallback((base64Audio: string) => {
        if (!options.serverCanvasRef?.current) return;

        const canvas = options.serverCanvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        if (serverVisualizationIntervalRef.current) {
            cancelAnimationFrame(serverVisualizationIntervalRef.current);
        }

        const audioContext = initAudioContext();
        const audioData = Buffer.from(base64Audio, 'base64');

        const drawServerVisualization = (audioBuffer: AudioBuffer) => {
            const bufferLength = audioBuffer.length;
            const dataArray = new Float32Array(bufferLength);
            const channel = audioBuffer.getChannelData(0);

            const step = Math.floor(bufferLength / canvas.width);

            const draw = () => {
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                canvasCtx.fillStyle = 'rgb(25, 26, 30)';
                canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

                canvasCtx.beginPath();
                canvasCtx.strokeStyle = 'rgb(100, 149, 237)';
                canvasCtx.lineWidth = 2;

                for (let i = 0; i < canvas.width; i++) {
                    const sampleIdx = i * step;
                    if (sampleIdx < bufferLength) {
                        const amplitude = Math.abs(channel[sampleIdx]) * 0.8;
                        const y = (canvas.height / 2) * (1 - amplitude);

                        if (i === 0) {
                            canvasCtx.moveTo(i, y);
                        } else {
                            canvasCtx.lineTo(i, y);
                        }
                    }
                }

                canvasCtx.stroke();
            };

            draw();
        };

        audioContext.decodeAudioData(audioData.buffer)
            .then(drawServerVisualization)
            .catch(err => console.error('Error decoding audio data:', err));
    }, [options.serverCanvasRef, initAudioContext]);

    const startRecording = useCallback(async () => {
        try {
            const audioContext = initAudioContext();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation ?? true,
                    noiseSuppression: options.noiseSuppression ?? true,
                    autoGainControl: options.autoGainControl ?? true,
                }
            });

            streamRef.current = stream;

            if (options.visualizationEnabled && analyserRef.current) {
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyserRef.current);
                visualizeClientAudio();
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);

                    if (options.onAudioReceived) {
                        try {
                            const blob = new Blob([event.data], { type: 'audio/webm' });
                            const arrayBuffer = await blob.arrayBuffer();
                            const base64Audio = Buffer.from(arrayBuffer).toString('base64');
                            await options.onAudioReceived(base64Audio);
                        } catch (error) {

                        }
                    }
                }
            };

            mediaRecorder.onstop = async () => {
                setIsProcessing(true);

                try {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

                    if (options.onAudioReceived && audioChunksRef.current.length > 0) {
                        await options.onAudioReceived(base64Audio);
                    }
                } catch (error) {

                    if (options.onError) {
                        options.onError(error instanceof Error ? error : new Error('Unknown audio processing error'));
                    }
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start(100);
            setIsRecording(true);
        } catch (error) {

            notifications.show({
                title: 'Microphone Error',
                message: error instanceof Error
                    ? error.message
                    : 'Unable to access microphone. Please check your permissions.',
                color: 'red',
            });

            if (options.onError) {
                options.onError(error instanceof Error ? error : new Error('Unknown audio recording error'));
            }
        }
    }, [initAudioContext, options, visualizeClientAudio]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (clientVisualizationIntervalRef.current) {
            cancelAnimationFrame(clientVisualizationIntervalRef.current);
            clientVisualizationIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
    }, []);

    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            const audioContext = initAudioContext();
            const audioData = Buffer.from(base64Audio, 'base64');

            if (options.visualizationEnabled) {
                visualizeServerAudio(base64Audio);
            }

            const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            setServerAudioLevel(0.8);
            source.start(0);

            source.onended = () => {
                setServerAudioLevel(0);
            };

            return new Promise<void>((resolve) => {
                source.onended = () => {
                    setServerAudioLevel(0);
                    resolve();
                };
            });
        } catch (error) {

            setServerAudioLevel(0);
            if (options.onError) {
                options.onError(error instanceof Error ? error : new Error('Unknown audio playback error'));
            }
            return Promise.reject(error);
        }
    }, [initAudioContext, options, visualizeServerAudio]);

    useEffect(() => {
        return () => {
            stopRecording();

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [stopRecording]);

    return {
        isRecording,
        isProcessing,
        audioLevel,
        serverAudioLevel,
        startRecording,
        stopRecording,
        playAudio
    };
};
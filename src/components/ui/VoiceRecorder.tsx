'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// Polyfill types for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: any) => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function VoiceRecorder({ onComplete }: { onComplete: (blob: Blob, transcript: string) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timer, setTimer] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState(''); // For editing

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        try {
            // 1. Audio Recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);

            // 2. Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let interimTranscript = '';
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (final) {
                        setTranscript(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + final);
                    }
                };

                // Keep alive logic is simple here, might need more robust handling for production but ok for MVP
                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                };

                recognition.start();
                speechRecognitionRef.current = recognition;
            } else {
                alert("Your browser does not support Speech Recognition. Live transcript wont be available.");
            }

            setIsRecording(true);
            setTimer(0);
            setAudioBlob(null);
            setTranscript('');
            setFinalTranscript('');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
        }
        setIsRecording(false);
        // Sync final transcript for editing
        setFinalTranscript(transcript);
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[600px]">
            {/* Header / Timer */}
            <div className="bg-off-black text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="font-mono text-xl">{formatTime(timer)}</span>
                </div>
                <span className="uppercase text-xs tracking-widest text-gray-400 font-sans">
                    {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Ready to Record'}
                </span>
            </div>

            {/* Visualizer Area */}
            <div className="bg-off-black h-32 flex items-center justify-center gap-1 border-t border-white/10 relative overflow-hidden flex-shrink-0">
                {/* Mock Waveform Bars */}
                {isRecording && !isPaused ? (
                    Array.from({ length: 40 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-brand-red rounded-full"
                            animate={{
                                height: [10, ((i % 5) + 2) * 10, 10],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: i * 0.05
                            }}
                        />
                    ))
                ) : (
                    <div className="w-full h-0.5 bg-gray-700" />
                )}
            </div>

            {/* Transcript Area */}
            <div className="flex-1 p-6 bg-gray-50 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Transcript</h3>
                    {audioBlob && !isRecording && <span className="text-xs text-brand-red font-medium">Editable</span>}
                </div>

                {isRecording ? (
                    <div className="flex-1 overflow-y-auto p-4 bg-white rounded-xl border border-gray-200">
                        {transcript ? (
                            <p className="text-lg text-off-black leading-relaxed whitespace-pre-wrap">{transcript}</p>
                        ) : (
                            <p className="text-gray-400 italic">Listening...</p>
                        )}
                        <div className="h-4" /> {/* Spacer for auto-scroll if we add ref */}
                    </div>
                ) : audioBlob ? (
                    <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="flex-1 w-full p-4 bg-white rounded-xl border-2 border-brand-red/10 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none text-lg text-off-black leading-relaxed resize-none transition-all"
                        placeholder="Transcript will appear here..."
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Mic size={48} className="text-gray-200 mb-4" />
                        <p className="text-gray-400 italic">
                            Tap the microphone to start recording.<br />
                            Your words will be transcribed in real-time.
                        </p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-gray-100 flex justify-center items-center gap-6">
                {!isRecording ? (
                    audioBlob ? (
                        // If checking finished, show Record Again (Reset) or just Play
                        <button
                            onClick={toggleRecording}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-off-black rounded-full font-medium transition-colors"
                        >
                            <RefreshCw size={18} />
                            Record Again
                        </button>
                    ) : (
                        <button
                            onClick={toggleRecording}
                            className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-red-200"
                        >
                            <Mic size={28} />
                        </button>
                    )
                ) : (
                    <>
                        <button
                            onClick={toggleRecording}
                            className="w-16 h-16 rounded-full bg-off-black text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                        >
                            <Square size={24} fill="currentColor" />
                        </button>
                    </>
                )}

                {audioBlob && !isRecording && (
                    <button
                        onClick={() => {
                            if (audioBlob) onComplete(audioBlob, transcript);
                        }}
                        className="bg-brand-red text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                        Generate SOP
                        <Play size={16} fill="currentColor" />
                    </button>
                )}
            </div>
        </div>
    );
}

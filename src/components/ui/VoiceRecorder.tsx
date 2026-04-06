'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Play, RefreshCw, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

// Polyfill types for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
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
    onerror: (event: Event & { error: string }) => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

export default function VoiceRecorder({ onComplete }: { onComplete: (blob: Blob, transcript: string) => void }) {
    const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused] = useState(false);
    const [timer, setTimer] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

    const MAX_RECORDING_SECONDS = 600; // 10 minutes
    const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

    const resetRecorderState = useCallback(() => {
        setIsRecording(false);
        setTimer(0);
        setAudioBlob(null);
        setTranscript('');
        setUploadedFileName(null);
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
        }
        setIsRecording(false);
    }, []);

    // Timer Logic — includes auto-stop at max duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && !isPaused) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    const next = prev + 1;
                    if (next >= MAX_RECORDING_SECONDS) {
                        // Schedule stop outside of setState to avoid cascading renders
                        queueMicrotask(() => stopRecording());
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, isPaused, stopRecording]);

    // Cleanup speech recognition, media recorder, and mic stream on unmount
    useEffect(() => {
        return () => {
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.abort();
                speechRecognitionRef.current = null;
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            if (inputMode !== 'record') {
                setInputMode('record');
            }
            // 1. Audio Recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
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
            mediaRecorderRef.current = recorder;

            // 2. Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let final = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        }
                    }

                    if (final) {
                        setTranscript(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + final);
                    }
                };

                // Keep alive logic is simple here, might need more robust handling for production but ok for MVP
                recognition.onerror = (event: Event & { error: string }) => {
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
            setUploadedFileName(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please allow permissions.");
        }
    };

    const handleUploadAudio = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            alert('Please choose a valid audio file.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_AUDIO_SIZE) {
            alert('Audio file is too large (max 25 MB). Please upload a shorter file.');
            event.target.value = '';
            return;
        }

        if (isRecording) {
            stopRecording();
        }

        setInputMode('upload');
        setAudioBlob(file);
        setUploadedFileName(file.name);
        setTimer(0);

        // Upload path does not auto-transcribe in current backend, so transcript is user-provided.
        if (!transcript) {
            setTranscript('');
        }
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
        <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-off-black text-white px-5 sm:px-7 py-5 flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Audio Input</p>
                    <h2 className="text-lg sm:text-xl font-semibold mt-1">SOP Source</h2>
                </div>
                <div className="text-right">
                    <div className="font-mono text-xl">{formatTime(timer)}</div>
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400 mt-1">
                        {isRecording ? 'Recording' : inputMode === 'upload' ? 'Upload Mode' : 'Ready'}
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            setInputMode('record');
                            setUploadedFileName(null);
                        }}
                        className={`rounded-2xl px-4 py-3 text-left border transition-all ${inputMode === 'record'
                            ? 'bg-white border-off-black shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-off-black">
                            <Mic size={16} /> Record with Microphone
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Best when speaking live with instant transcript support.</p>
                    </button>

                    <button
                        onClick={() => {
                            setInputMode('upload');
                            if (isRecording) stopRecording();
                        }}
                        className={`rounded-2xl px-4 py-3 text-left border transition-all ${inputMode === 'upload'
                            ? 'bg-white border-off-black shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-off-black">
                            <Upload size={16} /> Upload Existing Recording
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Attach audio file, then provide transcript for generation.</p>
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                <section className="lg:col-span-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                    <h3 className="text-xs uppercase tracking-[0.14em] text-gray-500 font-semibold mb-3">Input Controls</h3>

                    {inputMode === 'record' ? (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-off-black p-4 h-32 flex items-center justify-center gap-1 overflow-hidden">
                                {isRecording ? (
                                    Array.from({ length: 28 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1 bg-brand-red rounded-full"
                                            animate={{ height: [8, ((i % 6) + 2) * 8, 8], opacity: [0.55, 1, 0.55] }}
                                            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', delay: i * 0.03 }}
                                        />
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">Waveform Idle</p>
                                )}
                            </div>

                            <button
                                onClick={toggleRecording}
                                className={`w-full h-11 rounded-xl font-semibold text-sm transition-colors ${isRecording
                                    ? 'bg-off-black text-white hover:bg-gray-800'
                                    : 'bg-brand-red text-white hover:bg-red-600'
                                    }`}
                            >
                                {isRecording ? 'Stop Recording' : 'Start Recording'}
                            </button>

                            {!isRecording && audioBlob && (
                                <button
                                    onClick={() => {
                                        resetRecorderState();
                                        startRecording();
                                    }}
                                    className="w-full h-11 rounded-xl bg-white border border-gray-200 text-off-black text-sm font-medium hover:bg-gray-100"
                                >
                                    <span className="inline-flex items-center gap-2"><RefreshCw size={14} /> Record Again</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-red transition-colors">
                                <Upload size={18} className="text-gray-500" />
                                <span className="text-sm font-medium text-off-black">Choose Audio File</span>
                                <span className="text-xs text-gray-500">Up to 25 MB · audio/*</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={handleUploadAudio} />
                            </label>

                            {uploadedFileName && (
                                <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between gap-3">
                                    <span className="text-xs text-gray-600 truncate" title={uploadedFileName}>{uploadedFileName}</span>
                                    <button onClick={resetRecorderState} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col min-h-[320px]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs uppercase tracking-[0.14em] text-gray-500 font-semibold">Transcript</h3>
                        {audioBlob && !isRecording && <span className="text-[11px] text-brand-red font-semibold">Editable</span>}
                    </div>

                    {isRecording ? (
                        <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4 overflow-y-auto" data-lenis-prevent>
                            {transcript ? (
                                <p className="text-[15px] leading-relaxed text-off-black whitespace-pre-wrap">{transcript}</p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Listening... start speaking.</p>
                            )}
                        </div>
                    ) : audioBlob ? (
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="flex-1 w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-[15px] leading-relaxed resize-none"
                            placeholder={inputMode === 'upload' ? 'Transcript (optional). If left empty, we will auto-transcribe your uploaded audio.' : 'Transcript appears here and can be edited before generation...'}
                        />
                    ) : (
                        <div className="flex-1 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
                            <Mic size={26} className="text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">
                                {inputMode === 'upload'
                                    ? 'Upload audio first. Transcript is optional and can be auto-generated.'
                                    : 'Press Start Recording and we will capture your transcript live.'}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                    {audioBlob ? 'Ready to generate SOP from current audio and transcript.' : 'Add audio source to continue.'}
                </p>

                {audioBlob && !isRecording && (
                    <button
                        onClick={() => {
                            if (audioBlob.size > MAX_AUDIO_SIZE) {
                                alert('Recording is too large (max 25 MB). Please use a shorter audio file.');
                                return;
                            }
                            onComplete(audioBlob, transcript);
                        }}
                        className="h-11 px-6 rounded-xl bg-brand-red text-white font-semibold text-sm hover:bg-red-600 transition-colors inline-flex items-center gap-2"
                    >
                        Generate SOP
                        <Play size={15} fill="currentColor" />
                    </button>
                )}
            </div>
        </div>
    );
}

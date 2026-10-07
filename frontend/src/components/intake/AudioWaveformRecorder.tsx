'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Check, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsap, withMotion } from '@/lib/motion';

interface AudioWaveformRecorderProps {
  onRecordingComplete: (file: File) => void;
  isUploading?: boolean;
}

export function AudioWaveformRecorder({
  onRecordingComplete,
  isUploading = false,
}: AudioWaveformRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  const BAR_COUNT = 16;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      // Set up Web Audio AnalyserNode for live amplitude waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setHasRecorded(true);
        const file = new File([blob], `patient-intake-voice-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        onRecordingComplete(file);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Animate waveform bars with GSAP quickTo
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        barsRef.current.forEach((bar, idx) => {
          if (bar) {
            const val = dataArray[idx % dataArray.length] || 0;
            const normalizedHeight = Math.max(4, (val / 255) * 36);
            withMotion(() => {
              gsap.to(bar, {
                height: `${normalizedHeight}px`,
                duration: 0.1,
                ease: 'sine.out',
              });
            });
          }
        });

        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-3.5 bg-card border border-border rounded-[6px] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Spoken Audio Intake (STT)
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[hsl(var(--urgency-urgent))]">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--urgency-urgent))] animate-ping" />
            <span className="tabular-nums">{formatDuration(recordingDuration)}</span>
          </div>
        )}
      </div>

      {/* Waveform Visualizer */}
      <div className="h-10 bg-muted/50 rounded-[4px] border border-border/60 flex items-center justify-center gap-1 px-4">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            className={`w-1 rounded-full transition-colors ${
              isRecording ? 'bg-primary' : hasRecorded ? 'bg-emerald-600' : 'bg-muted-foreground/30'
            }`}
            style={{ height: '4px' }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          {isRecording
            ? 'Speaking... click stop when finished.'
            : hasRecorded
            ? 'Recording captured and ready for submission.'
            : 'Record patient symptoms verbally in any regional language.'}
        </span>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={stopRecording}
              className="h-7 text-[11px] gap-1"
            >
              <Square className="w-3 h-3" /> Stop Recording
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={startRecording}
              disabled={isUploading}
              className="h-7 text-[11px] gap-1"
            >
              <Mic className="w-3 h-3 text-primary" />
              {hasRecorded ? 'Re-record' : 'Record Voice'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

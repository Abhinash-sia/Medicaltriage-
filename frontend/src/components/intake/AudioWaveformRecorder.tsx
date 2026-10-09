'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  FileAudio,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { gsap, withMotion } from '@/lib/motion';

interface AudioWaveformRecorderProps {
  onRecordingComplete: (file: File) => void;
  onRemove?: () => void;
  initialFile?: File | null;
  isUploading?: boolean;
}

// Pseudo-waveform heights for aesthetic voice audio track
const PREVIEW_BAR_HEIGHTS = [
  8, 14, 22, 16, 28, 34, 20, 12, 18, 26, 32, 24, 16, 30, 22, 14, 28, 36, 18,
  12, 22, 26, 16, 10, 18, 24, 14, 8,
];

export function AudioWaveformRecorder({
  onRecordingComplete,
  onRemove,
  initialFile = null,
  isUploading = false,
}: AudioWaveformRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const RECORD_BAR_COUNT = 16;

  // Cleanup helper for object URLs
  const cleanupUrl = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  // Sync with initialFile if provided from parent (e.g. on step navigation)
  useEffect(() => {
    if (initialFile && !activeUrlRef.current) {
      const url = URL.createObjectURL(initialFile);
      activeUrlRef.current = url;
      setAudioUrl(url);
      setFileName(initialFile.name);
      setFileSize(initialFile.size);
      setHasRecorded(true);
    }
  }, [initialFile]);

  // Handle capture of audio from recording or upload
  const handleAudioCaptured = useCallback(
    (blobOrFile: Blob | File, defaultName?: string) => {
      cleanupUrl();
      const url = URL.createObjectURL(blobOrFile);
      activeUrlRef.current = url;
      setAudioUrl(url);
      setHasRecorded(true);
      setIsPlaying(false);
      setCurrentTime(0);

      const file =
        blobOrFile instanceof File
          ? blobOrFile
          : new File(
              [blobOrFile],
              defaultName || `patient-voice-intake-${Date.now()}.webm`,
              {
                type: blobOrFile.type || 'audio/webm',
              }
            );

      setFileName(file.name);
      setFileSize(file.size);
      onRecordingComplete(file);
    },
    [cleanupUrl, onRecordingComplete]
  );

  // Start live microphone recording
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      // Set up Web Audio AnalyserNode for live amplitude waveform
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
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
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mime });
        handleAudioCaptured(blob, `patient-voice-intake-${Date.now()}.webm`);

        // Stop all stream tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Animate waveform bars with GSAP
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
      setMicError('Microphone access blocked or unavailable. You can upload an audio file instead.');
    }
  };

  // Stop recording
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

  // Handle uploaded audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|webm|m4a|aac)$/i)) {
      setMicError('Please select a valid audio file (.webm, .mp3, .wav, .m4a, .ogg)');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setMicError('Audio file exceeds maximum 25MB limit.');
      return;
    }

    setMicError(null);
    handleAudioCaptured(file, file.name);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop of audio files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|webm|m4a|aac)$/i))) {
      setMicError(null);
      handleAudioCaptured(file, file.name);
    }
  };

  // Toggle playback
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Seek audio playback position
  const handleScrub = (ratio: number) => {
    if (!audioRef.current) return;
    const effectiveDuration = totalDuration > 0 ? totalDuration : recordingDuration || 1;
    const target = Math.max(0, Math.min(effectiveDuration, ratio * effectiveDuration));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  // Toggle speed
  const handleSpeedToggle = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.muted = next;
  };

  // Discard recording
  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    cleanupUrl();
    setAudioUrl(null);
    setHasRecorded(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setTotalDuration(0);
    setFileName('');
    setFileSize(0);
    onRemove?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupUrl();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [cleanupUrl]);

  const formatTime = (sec: number) => {
    if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const effectiveDuration = totalDuration > 0 ? totalDuration : recordingDuration || 1;
  const progressRatio = effectiveDuration > 0 ? currentTime / effectiveDuration : 0;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-3.5 bg-card border rounded-[6px] space-y-3 transition-colors ${
        isDragOver
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border'
      }`}
    >
      {/* Hidden native audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (isFinite(d) && d > 0) {
              setTotalDuration(d);
            } else if (recordingDuration > 0) {
              setTotalDuration(recordingDuration);
            }
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Hidden file input for uploading audio */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.webm,.mp3,.wav,.ogg,.m4a,.aac"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Spoken Audio Intake (Voice Note)
          </span>
        </div>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[hsl(var(--urgency-urgent))]">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--urgency-urgent))] animate-ping" />
            <span className="tabular-nums">{formatTime(recordingDuration)}</span>
          </div>
        )}

        {hasRecorded && !isRecording && (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-mono"
          >
            <CheckCircle2 className="w-3 h-3" /> Voice Attached
          </Badge>
        )}
      </div>

      {micError && (
        <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-[4px]">
          {micError}
        </div>
      )}

      {/* STATE 1: ACTIVE PLAYBACK MODE (Captured or Uploaded) */}
      {hasRecorded && !isRecording ? (
        <div className="p-3 bg-muted/40 border border-border/80 rounded-[6px] space-y-2.5">
          {/* Audio Info & Time Header */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <FileAudio className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-foreground text-xs truncate block max-w-[180px] sm:max-w-[280px]">
                  {fileName || 'Voice Recording'}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatFileSize(fileSize)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Playback speed selector */}
              <button
                type="button"
                onClick={handleSpeedToggle}
                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-foreground transition-colors"
                title="Playback speed"
              >
                {playbackRate}x
              </button>

              {/* Mute button */}
              <button
                type="button"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-destructive" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Timestamp */}
              <div className="text-[11px] font-mono font-medium text-foreground tabular-nums bg-background/80 px-2 py-0.5 rounded border border-border/60">
                {formatTime(currentTime)} / {formatTime(effectiveDuration)}
              </div>
            </div>
          </div>

          {/* Interactive Waveform Track */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              handleScrub(ratio);
            }}
            className="h-12 bg-card rounded-[5px] border border-border/70 flex items-center justify-between px-3 gap-1 cursor-pointer hover:border-primary/50 transition-colors select-none group"
            title="Click to listen from this position"
          >
            {PREVIEW_BAR_HEIGHTS.map((baseH, idx) => {
              const barRatio = idx / (PREVIEW_BAR_HEIGHTS.length - 1);
              const isPlayed = progressRatio >= barRatio;
              const isCurrent = Math.abs(progressRatio - barRatio) < 0.04;

              return (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full py-1"
                >
                  <div
                    style={{
                      height: `${baseH}px`,
                      transform: isPlaying && isPlayed ? 'scaleY(1.15)' : 'scaleY(1)',
                    }}
                    className={`w-full max-w-[4px] rounded-full transition-all duration-100 ${
                      isPlayed
                        ? 'bg-primary'
                        : 'bg-muted-foreground/25 group-hover:bg-muted-foreground/40'
                    } ${isCurrent ? 'ring-1 ring-primary ring-offset-1' : ''}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Progress Seek Bar */}
          <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-75"
              style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
            />
          </div>

          {/* Bottom Player Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {/* Main Play / Pause Button */}
              <Button
                type="button"
                size="sm"
                onClick={togglePlayPause}
                className="h-8 px-3 text-xs gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Listen</span>
                  </>
                )}
              </Button>

              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {isPlaying ? 'Playing recording...' : 'Click to listen to your voice input'}
              </span>
            </div>

            {/* Re-record / Upload Another / Remove */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={startRecording}
                disabled={isUploading}
                className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                title="Discard and record new audio"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-record</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                title="Upload a different audio file"
              >
                <Upload className="w-3 h-3" />
                <span className="hidden sm:inline">Upload File</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemove}
                disabled={isUploading}
                className="h-7 text-[11px] gap-1 text-destructive hover:bg-destructive/10"
                title="Remove voice recording"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* STATE 2: RECORDING / READY TO RECORD MODE */
        <>
          {/* Waveform Visualizer */}
          <div className="h-10 bg-muted/50 rounded-[4px] border border-border/60 flex items-center justify-center gap-1.5 px-4">
            {Array.from({ length: RECORD_BAR_COUNT }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  barsRef.current[i] = el;
                }}
                className={`w-1 rounded-full transition-colors ${
                  isRecording ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                style={{ height: '4px' }}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              {isRecording
                ? 'Speaking... click stop when finished.'
                : 'Record your symptoms verbally or upload a voice memo.'}
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isRecording ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-7 text-[11px] gap-1 animate-pulse"
                >
                  <Square className="w-3 h-3 fill-current" /> Stop Recording
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-3 h-3" /> Upload Audio
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={startRecording}
                    disabled={isUploading}
                    className="h-7 text-[11px] gap-1 bg-primary text-primary-foreground shadow-2xs"
                  >
                    <Mic className="w-3 h-3" /> Record Voice
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

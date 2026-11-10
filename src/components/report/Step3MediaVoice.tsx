import React, { useRef, useState } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Camera,
  Video as VideoIcon,
  X,
  UploadCloud,
  AlertTriangle,
} from 'lucide-react';
import { compressImage, formatBytes } from '../../utils/compression';
import { useI18n } from '../../i18n';

export interface DraftMediaItem {
  id: string;
  file: File | Blob;
  kind: 'image' | 'video' | 'audio';
  previewUrl: string;
  name: string;
  size: number;
  originalSize?: number;
  compressed?: boolean;
}

interface Step3Props {
  mediaFiles: DraftMediaItem[];
  onAddMedia: (media: DraftMediaItem) => void;
  onRemoveMedia: (id: string) => void;
  // Audio recording
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationSeconds: number;
  voiceError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResetRecording: () => void;
  // Speech to text
  transcript: string;
  isListening: boolean;
  isSpeechSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onAppendTranscriptToDescription: (text: string) => void;
}

export const Step3MediaVoice: React.FC<Step3Props> = ({
  mediaFiles,
  onAddMedia,
  onRemoveMedia,
  isRecording,
  audioBlob,
  audioUrl,
  durationSeconds,
  voiceError,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  transcript,
  isListening,
  isSpeechSupported,
  onStartListening,
  onStopListening,
  onAppendTranscriptToDescription,
}) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);
    setUploadProgress(15);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type.startsWith('image/')) {
          setUploadProgress(40);
          try {
            const comp = await compressImage(file, 1600, 0.8);
            setUploadProgress(85);
            onAddMedia({
              id: `media-${Date.now()}-${Math.random()}`,
              file: comp.compressedFile,
              kind: 'image',
              previewUrl: comp.dataUrl,
              name: file.name,
              size: comp.compressedSize,
              originalSize: comp.originalSize,
              compressed: true,
            });
          } catch (e) {
            console.warn('Compression failed, saving original:', e);
            onAddMedia({
              id: `media-${Date.now()}-${Math.random()}`,
              file,
              kind: 'image',
              previewUrl: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              compressed: false,
            });
          }
        } else if (file.type.startsWith('video/')) {
          onAddMedia({
            id: `media-${Date.now()}-${Math.random()}`,
            file,
            kind: 'video',
            previewUrl: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
          });
        } else {
          setFileError(`Unsupported format: ${file.name}. Only images and videos are supported.`);
        }
      }
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 600);
    } catch (err) {
      console.warn('Media upload error:', err);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* SECTION 1: VOICE RECORDING & SPEECH-TO-TEXT */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-graphite-surface flex items-center justify-center text-graphite-text">
              <Mic className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-graphite-text">
                {t('recordVoice')}
              </h3>
              <p className="text-[11px] text-graphite-muted">Audio memo & live transcription</p>
            </div>
          </div>

          {isRecording && (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emergency-subtle border border-emergency-border text-emergency-accent text-[11px] font-mono tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emergency-accent"></span>
              <span>Recording: {formatTimer(durationSeconds)}</span>
            </div>
          )}
        </div>

        {/* Audio controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isRecording && !audioBlob && (
            <button
              type="button"
              onClick={onStartRecording}
              className="group h-9 px-3 bg-graphite-raised hover:bg-red-500/5 hover:border-red-500/40 active:bg-graphite-card border border-graphite-border-strong text-graphite-text font-medium rounded-control text-xs flex items-center space-x-2 transition-colors duration-150"
            >
              <Mic className="w-3.5 h-3.5 text-red-400 stroke-[1.75]" />
              <span className="group-hover:text-red-200 transition-colors">Record Voice Memo</span>
            </button>
          )}

          {isRecording && (
            <button
              type="button"
              onClick={onStopRecording}
              className="h-9 px-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-control text-xs flex items-center space-x-2 transition-colors duration-150"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording</span>
            </button>
          )}

          {audioBlob && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <audio src={audioUrl || ''} controls className="h-8 max-w-full sm:max-w-xs" />
              <button
                type="button"
                onClick={onResetRecording}
                className="p-2 text-graphite-muted hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/5 bg-graphite-raised border border-graphite-border rounded-control transition-colors duration-150"
                title="Discard recording and record again"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
              </button>
            </div>
          )}

          {/* Speech to text button */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={isListening ? onStopListening : onStartListening}
              className={`group h-9 px-3 border rounded-control text-xs font-medium flex items-center space-x-1.5 transition-colors duration-150 ${
                isListening
                  ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-300'
                  : 'border-graphite-border bg-graphite-raised hover:border-emerald-500/40 hover:bg-emerald-500/5 text-graphite-secondary hover:text-emerald-300'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 stroke-[1.5] transition-colors ${isListening ? 'text-emerald-400' : 'text-graphite-muted group-hover:text-emerald-400'}`} />
              <span>{isListening ? 'Listening...' : 'Transcribe to text'}</span>
            </button>
          )}
        </div>

        {voiceError && (
          <div className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-control border border-rose-500/25 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Live speech transcript preview */}
        {transcript && (
          <div className="bg-graphite-raised border border-graphite-border p-3 rounded-control space-y-2">
            <div className="flex items-center justify-between text-[11px] text-graphite-muted">
              <span>Speech transcript</span>
              <button
                type="button"
                onClick={() => onAppendTranscriptToDescription(transcript)}
                className="text-graphite-text hover:underline font-medium"
              >
                Insert into description
              </button>
            </div>
            <p className="text-xs text-graphite-text italic">"{transcript}"</p>
          </div>
        )}
      </div>

      {/* SECTION 2: PHOTOS & VIDEOS */}
      <div className="bg-graphite-card border border-graphite-border rounded-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-graphite-surface flex items-center justify-center text-graphite-text">
              <Camera className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="text-xs font-medium text-graphite-text">
                {t('uploadMedia')}
              </h3>
              <p className="text-[11px] text-graphite-muted">{t('compressionNotice')}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group h-10 px-3 bg-graphite-raised hover:bg-sky-500/5 hover:border-sky-500/40 active:bg-graphite-card border border-graphite-border text-graphite-text font-medium rounded-control text-xs flex items-center justify-center space-x-2 transition-colors duration-150 cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 stroke-[1.5] text-sky-400 group-hover:scale-105 transition-transform" />
            <span className="group-hover:text-sky-200 transition-colors">Select Media</span>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="group h-10 px-3 bg-graphite-raised hover:bg-indigo-500/5 hover:border-indigo-500/40 active:bg-graphite-card border border-graphite-border text-graphite-text font-medium rounded-control text-xs flex items-center justify-center space-x-2 transition-colors duration-150 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 stroke-[1.5] text-indigo-400 group-hover:scale-105 transition-transform" />
            <span className="group-hover:text-indigo-200 transition-colors">{t('captureCamera')}</span>
          </button>
        </div>

        {/* Progress bar */}
        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-graphite-muted">
              <span>Optimizing media...</span>
              <span className="font-mono tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1 bg-graphite-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-emergency-accent transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {fileError && (
          <div className="text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-control border border-rose-500/25 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Media Preview Grid */}
        {mediaFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {mediaFiles.map((m) => (
              <div
                key={m.id}
                className="relative group rounded-control overflow-hidden border border-graphite-border bg-graphite-surface aspect-video flex items-center justify-center"
              >
                {m.kind === 'image' ? (
                  <img
                    src={m.previewUrl}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-graphite-secondary p-2">
                    <VideoIcon className="w-5 h-5 mb-1 stroke-[1.5]" />
                    <span className="text-[10px] text-center line-clamp-1">{m.name}</span>
                  </div>
                )}

                {/* Compression badge */}
                {m.compressed && m.originalSize && (
                  <span className="absolute bottom-1.5 left-1.5 bg-graphite-deep/85 backdrop-blur-sm border border-graphite-border text-[10px] text-graphite-text px-1.5 py-0.5 rounded font-mono tabular-nums">
                    {formatBytes(m.size)} (-{Math.round(((m.originalSize - m.size) / m.originalSize) * 100)}%)
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemoveMedia(m.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-graphite-deep/80 hover:bg-emergency-accent text-graphite-text rounded transition-colors duration-150"
                  aria-label="Remove media item"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-graphite-border rounded-control p-4 text-center text-xs text-graphite-muted">
            No media attached. Photos and videos help triage units assess scene safety.
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Props = {
  maquinaId?: string;
  disabled?: boolean;
  audioUrl?: string | null;
  onUploaded?: (url: string) => void;
};

export function AudioNoteRecorder({ maquinaId, disabled, audioUrl, onUploaded }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (!maquinaId) {
          setError('Guarda la máquina primero para adjuntar audio');
          return;
        }
        const form = new FormData();
        form.append('file', blob, `nota-${Date.now()}.webm`);
        try {
          const res = await apiFetch<{ url: string }>(`/maquinas/${maquinaId}/nota-audio`, {
            method: 'POST',
            body: form,
          });
          onUploaded?.(res.url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al subir audio');
        }
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('No se pudo acceder al micrófono');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  const fullUrl = audioUrl?.startsWith('http')
    ? audioUrl
    : audioUrl
      ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}${audioUrl}`
      : null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#6c757d]">Nota de voz opcional (después de registrar la máquina)</p>
      <div className="flex gap-2">
        {!recording ? (
          <button
            type="button"
            disabled={disabled || !maquinaId}
            onClick={startRecording}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            🎤 Grabar nota
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm"
          >
            ⏹ Detener y guardar
          </button>
        )}
      </div>
      {fullUrl && (
        <audio controls src={fullUrl} className="w-full max-w-md">
          <track kind="captions" />
        </audio>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

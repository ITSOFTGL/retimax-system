'use client';

import { useRef, useState } from 'react';

const MAX_FILES = 10;

type Props = {
  label?: string;
  disabled?: boolean;
  uploading?: boolean;
  /** Solo seleccionar archivos sin subirlos al servidor */
  selectOnly?: boolean;
  onUpload: (files: File[]) => Promise<void>;
};

export function PhotoUploader({
  label = 'Fotos (máx. 10 — cámara o galería)',
  disabled,
  uploading,
  selectOnly,
  onUpload,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  function handleChange(list: FileList | null) {
    if (!list?.length) return;
    const selected = Array.from(list).slice(0, MAX_FILES);
    if (list.length > MAX_FILES) {
      setError(`Solo se permiten ${MAX_FILES} fotos por carga.`);
    } else {
      setError('');
    }
    setFiles(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setError('');
    try {
      await onUpload(files);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir fotos');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        disabled={disabled || uploading}
        onChange={(e) => handleChange(e.target.files)}
        className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#f5c842] file:px-3 file:py-2 file:font-semibold file:text-[#1a1a1a]"
      />
      <p className="text-xs text-[#6c757d]">
        Desde celular puedes tomar foto directo o elegir de la galería. Hasta {MAX_FILES} imágenes.
      </p>
      {files.length > 0 && (
        <p className="text-sm text-[#1a1a1a]">{files.length} foto(s) seleccionada(s)</p>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={disabled || uploading || files.length === 0}
        className="rounded-lg bg-[#f5c842] px-4 py-2 font-semibold text-sm disabled:opacity-50"
      >
        {uploading
          ? 'Subiendo...'
          : selectOnly
            ? `Confirmar ${files.length} foto(s)`
            : `Subir ${files.length || ''} foto(s)`}
      </button>
    </form>
  );
}

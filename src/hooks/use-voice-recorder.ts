"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Ваш браузер не поддерживает запись аудио. Используйте Chrome, Firefox или Safari."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;

      // Choose best available format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setIsRecording(false);
        cleanup();
      };

      mediaRecorder.onerror = () => {
        setError("Ошибка записи. Попробуйте ещё раз.");
        setIsRecording(false);
        cleanup();
      };

      mediaRecorder.start(1000); // collect data every second
      setIsRecording(true);

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Доступ к микрофону запрещён. Разрешите доступ в настройках браузера."
        );
      } else if (
        err instanceof DOMException &&
        err.name === "NotFoundError"
      ) {
        setError("Микрофон не найден. Подключите микрофон и попробуйте снова.");
      } else {
        setError("Не удалось начать запись. Проверьте микрофон.");
      }
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    setIsRecording(false);
    chunksRef.current = [];
  }, [cleanup]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

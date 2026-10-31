/**
 * Browser microphone recorder — records audio and returns a 16kHz mono WAV Blob
 * ready for Gnani STT.
 *
 * Usage:
 *   const recorder = createMicRecorder();
 *   await recorder.start();          // requests mic permission
 *   const wavBlob = await recorder.stop(); // returns WAV Blob
 *   recorder.cleanup();              // release mic stream
 */

export function createMicRecorder() {
  let mediaStream = null;
  let audioContext = null;
  let sourceNode = null;
  let processorNode = null;
  let audioChunks = [];
  let isRecording = false;

  async function start() {
    // Request microphone — will throw if denied
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: { ideal: 16000 },
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000,
    });
    sourceNode = audioContext.createMediaStreamSource(mediaStream);

    // ScriptProcessor for broad browser compat (AudioWorklet would be better
    // but adds complexity; fine for a hackathon demo with max 30s recordings)
    const bufferSize = 4096;
    processorNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    audioChunks = [];

    processorNode.onaudioprocess = (e) => {
      if (!isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      // Copy the float32 samples
      audioChunks.push(new Float32Array(channelData));
    };

    sourceNode.connect(processorNode);
    processorNode.connect(audioContext.destination);
    isRecording = true;
  }

  async function stop() {
    isRecording = false;

    // Disconnect nodes
    if (processorNode) {
      processorNode.disconnect();
      processorNode = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }

    // Merge all chunks into a single Float32Array
    const totalLength = audioChunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    audioChunks = [];

    const sampleRate = audioContext?.sampleRate || 16000;

    // Resample to 16000 if AudioContext gave us a different rate
    let samples = merged;
    if (sampleRate !== 16000) {
      samples = resample(merged, sampleRate, 16000);
    }

    // Encode to WAV
    const wavBlob = encodeWAV(samples, 16000);

    // Close audio context
    if (audioContext) {
      await audioContext.close().catch(() => {});
      audioContext = null;
    }

    return wavBlob;
  }

  function cleanup() {
    isRecording = false;
    if (processorNode) {
      processorNode.disconnect();
      processorNode = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  }

  function getIsRecording() {
    return isRecording;
  }

  return { start, stop, cleanup, getIsRecording };
}

// ── Linear interpolation resampler ──────────────────────────────────
function resample(samples, fromRate, toRate) {
  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, samples.length - 1);
    const frac = srcIndex - lo;
    result[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
  }
  return result;
}

// ── WAV encoder (16-bit PCM mono) ────────────────────────────────────
function encodeWAV(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM samples — clamp float32 [-1, 1] to int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


/**
 * Mock Service for local testing without a live Gnani API key
 */

/**
 * Generates a valid 16-bit PCM mono WAV buffer with a gentle soft chime tone
 * @param {number} durationSec - duration in seconds (default 1.0)
 * @param {number} sampleRate - sample rate in Hz (default 24000)
 * @returns {Buffer} valid WAV audio buffer
 */
export function generateMockWav(durationSec = 1.0, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataByteLength = numSamples * (bitsPerSample / 8);
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;

  const buffer = Buffer.alloc(totalLength);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(totalLength - 8, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);             // block align
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Generate a soft gentle 440Hz / 880Hz chime with fade-out
  let offset = 44;
  const freq = 523.25; // C5 tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-3 * t); // smooth decay
    const sample = Math.sin(2 * Math.PI * freq * t) * decay * 0.35;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Returns a mock transcription for testing STT pipeline
 * @returns {{ transcript: string, detected_language_code: string, mock: boolean }}
 */
export function getMockTranscription() {
  const mockQueries = [
    { transcript: 'Why is it built of red sandstone?', detected_language_code: 'en-IN' },
    { transcript: 'यह लाल बलुआ पत्थर से क्यों बना है?', detected_language_code: 'hi-IN' },
    { transcript: 'Where is the main entrance?', detected_language_code: 'en-IN' },
    { transcript: 'Who is buried in the main chamber?', detected_language_code: 'en-IN' },
  ];
  const chosen = mockQueries[Math.floor(Math.random() * mockQueries.length)];
  return {
    ...chosen,
    mock: true,
  };
}

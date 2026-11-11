/**
 * src/services/audio/audioExportEncoder.ts
 *
 * Pure browser-compatible 48,000 Hz MP3 (MPEG-1 Layer III, 192 kbps) & 16-bit PCM WAV
 * audio encoder, Dharani-title filename builder, clause splitter, and reliable
 * cross-browser download trigger.
 */

export type AudioExportFormat = 'mp3' | 'wav';

export interface AudioExportProgress {
  phase: 'synthesizing' | 'encoding';
  completedChunks: number;
  totalChunks: number;
  percent: number;
}

export interface ExportedDharaniAudio {
  blob: Blob;
  url: string;
  format: AudioExportFormat;
  mimeType: 'audio/mpeg' | 'audio/wav';
  fileName: string;
  dharaniTitle: string;
  durationSec: number;
  sampleRate: number;
  model: string;
}

const MAX_UTF8_BASENAME_BYTES = 248;
const MP3_FRAME_SAMPLES = 1152;

/**
 * Sanitizes a Dharani title so it matches the exact displayed Dharani name
 * while remaining 100% legal on Windows, macOS, Linux, iOS, and Android filesystems.
 */
export function sanitizeDharaniFileBaseName(
  rawTitle: string | undefined | null,
  fallbackTitle = '陀罗尼音频'
): string {
  const candidate = String(rawTitle ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/[\\/:*?"<>|]+/g, '·')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '');

  const base = candidate || fallbackTitle;

  if (typeof TextEncoder === 'undefined') {
    return base.slice(0, 80);
  }

  const encoder = new TextEncoder();
  if (encoder.encode(base).byteLength <= MAX_UTF8_BASENAME_BYTES) {
    return base;
  }

  let acc = '';
  let usedBytes = 0;
  for (const cp of base) {
    const cpBytes = encoder.encode(cp).byteLength;
    if (usedBytes + cpBytes > MAX_UTF8_BASENAME_BYTES) {
      break;
    }
    acc += cp;
    usedBytes += cpBytes;
  }
  return acc.trim().replace(/[.\s]+$/g, '') || fallbackTitle;
}

/**
 * Builds the exact exported audio filename matching the Dharani's name,
 * e.g. `千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼（大悲咒全本）.mp3`.
 */
export function buildDharaniAudioFileName(
  dharaniTitle: string | undefined | null,
  format: AudioExportFormat = 'mp3',
  fallbackTitle = '陀罗尼音频'
): string {
  const ext = format === 'wav' ? 'wav' : 'mp3';
  const baseName = sanitizeDharaniFileBaseName(dharaniTitle, fallbackTitle);
  return `${baseName}.${ext}`;
}

/**
 * Splits a verse's IAST text into bounded sub-clauses (`<= maxChars`) along daṇḍas or word boundaries
 * so every cloud TTS or Worker ONNX synthesis step completes quickly without hitting HTTP gateway timeouts.
 */
export function splitIastIntoExportSubclauses(
  iastText: string,
  maxChars = 220
): string[] {
  const trimmed = (iastText || '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const dandaParts = trimmed
    .split(/(?<=(?:॥|।|\|\||\|))\s*/u)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushOversizedByWords = (segment: string) => {
    const words = segment.split(/\s+/).filter(Boolean);
    let buf = '';
    for (const w of words) {
      if (!buf) {
        buf = w;
      } else if (buf.length + 1 + w.length <= maxChars) {
        buf += ` ${w}`;
      } else {
        chunks.push(buf);
        buf = w;
      }
    }
    if (buf) {
      chunks.push(buf);
    }
  };

  for (const part of dandaParts) {
    if (!current) {
      if (part.length <= maxChars) {
        current = part;
      } else {
        pushOversizedByWords(part);
      }
    } else if (current.length + 1 + part.length <= maxChars) {
      current += ` ${part}`;
    } else {
      chunks.push(current);
      current = '';
      if (part.length <= maxChars) {
        current = part;
      } else {
        pushOversizedByWords(part);
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

/**
 * Converts float32 PCM [-1, 1] into clamped signed 16-bit PCM samples.
 */
export function float32ToInt16Pcm(floatSamples: Float32Array): Int16Array {
  const len = floatSamples.length;
  const out = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const clamped = Math.max(-1, Math.min(1, floatSamples[i]));
    out[i] = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
  }
  return out;
}

/**
 * Encodes mono or stereo Float32Array PCM channels into standard 16-bit RIFF WAVE bytes.
 */
export function encodePcmToWavBytes(
  channels: Float32Array[],
  sampleRate = 48000
): Uint8Array {
  const safeChannels =
    channels.length > 0 && channels[0].length > 0
      ? channels
      : [new Float32Array(Math.max(480, Math.round(sampleRate * 0.05)))];

  const numChannels = Math.min(2, safeChannels.length);
  const left = safeChannels[0];
  const right = numChannels > 1 ? safeChannels[1] : left;
  const numFrames = left.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeAscii = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM = 1
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;
    if (numChannels > 1) {
      const sR = Math.max(-1, Math.min(1, right[i] ?? sL));
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  }

  return new Uint8Array(arrayBuffer);
}

/**
 * Encodes mono or stereo 48,000 Hz Float32Array PCM channels into MPEG-1 Layer III (.mp3) bytes
 * using `@breezystack/lamejs` at 192 kbps, yielding periodically so browser UI stays smooth.
 */
export async function encodePcmToMp3Bytes(
  channels: Float32Array[],
  sampleRate = 48000,
  kbps = 192,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const safeChannels =
    channels.length > 0 && channels[0].length > 0
      ? channels
      : [new Float32Array(Math.max(480, Math.round(sampleRate * 0.05)))];

  const lameModule = await import('@breezystack/lamejs');
  const Mp3EncoderCtor =
    lameModule.Mp3Encoder ||
    (lameModule as unknown as { default?: { Mp3Encoder?: typeof lameModule.Mp3Encoder } })
      .default?.Mp3Encoder;

  if (typeof Mp3EncoderCtor !== 'function') {
    throw new Error('MP3 编码器初始化失败 (Mp3Encoder unavailable)');
  }

  const numChannels = Math.min(2, safeChannels.length);
  const leftInt16 = float32ToInt16Pcm(safeChannels[0]);
  const rightInt16 = numChannels > 1 ? float32ToInt16Pcm(safeChannels[1]) : null;
  const encoder = new Mp3EncoderCtor(numChannels, sampleRate, kbps);

  const mp3Parts: Uint8Array[] = [];
  const totalSamples = leftInt16.length;
  let frameCounter = 0;

  for (let i = 0; i < totalSamples; i += MP3_FRAME_SAMPLES) {
    const leftChunk = leftInt16.subarray(i, i + MP3_FRAME_SAMPLES);
    const encoded =
      numChannels > 1 && rightInt16
        ? encoder.encodeBuffer(leftChunk, rightInt16.subarray(i, i + MP3_FRAME_SAMPLES))
        : encoder.encodeBuffer(leftChunk);

    if (encoded && encoded.length > 0) {
      mp3Parts.push(new Uint8Array(encoded));
    }

    frameCounter++;
    if (frameCounter % 240 === 0) {
      onProgress?.(Math.min(0.98, i / Math.max(1, totalSamples)));
      if (typeof window !== 'undefined') {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  const flushed = encoder.flush();
  if (flushed && flushed.length > 0) {
    mp3Parts.push(new Uint8Array(flushed));
  }
  onProgress?.(1);

  const totalByteLength = mp3Parts.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const output = new Uint8Array(totalByteLength);
  let byteOffset = 0;
  for (const part of mp3Parts) {
    output.set(part, byteOffset);
    byteOffset += part.byteLength;
  }

  return output;
}

/**
 * Converts a Uint8Array into a typed Blob cleanly across DOM & Node environments.
 */
export function uint8ArrayToAudioBlob(
  bytes: Uint8Array,
  mimeType: 'audio/mpeg' | 'audio/wav'
): Blob {
  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return new Blob([ab], { type: mimeType });
}

/**
 * Triggers an immediate browser file download with the exact Dharani filename.
 * Safely keeps the anchor and Blob URL alive long enough for Safari, Chrome, Firefox,
 * Edge, and mobile browsers to stream the file to disk.
 */
export function triggerBrowserAudioDownload(
  blob: Blob,
  fileName: string,
  existingObjectUrl?: string
): string {
  const canCreateUrl =
    typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
  const objectUrl =
    existingObjectUrl || (canCreateUrl ? URL.createObjectURL(blob) : '');

  if (
    objectUrl &&
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  ) {
    const anchor = document.createElement('a') as HTMLAnchorElement;
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    if (anchor.style) {
      anchor.style.position = 'fixed';
      anchor.style.left = '-9999px';
      anchor.style.top = '-9999px';
      anchor.style.opacity = '0';
      anchor.style.pointerEvents = 'none';
    }

    const host = document.body || document.documentElement;
    if (host && typeof host.appendChild === 'function') {
      host.appendChild(anchor);
    }

    if (typeof anchor.click === 'function') {
      anchor.click();
    } else if (typeof MouseEvent !== 'undefined' && typeof anchor.dispatchEvent === 'function') {
      anchor.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
      );
    }

    setTimeout(() => {
      try {
        if (anchor.parentNode) {
          anchor.parentNode.removeChild(anchor);
        }
      } catch {
        // Ignore DOM cleanup errors
      }
    }, 1500);

    if (!existingObjectUrl && typeof URL.revokeObjectURL === 'function') {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revoke errors
        }
      }, 120_000);
    }
  }

  return objectUrl;
}

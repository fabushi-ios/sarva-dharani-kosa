# ==============================================================================
# Stage 1: Build Frontend Static Assets (React 19 + TypeScript + Vite)
# ==============================================================================
FROM node:22-slim AS frontend-builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html sanskrit_phonetic_engine.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ==============================================================================
# Stage 2: Production 48kHz Classical Sanskrit Neural VITS API + Web Server
# Compatible with Hugging Face Spaces (Port 7860, UID 1000), Render, Railway, Fly.io
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOME=/home/user \
    HOST=0.0.0.0 \
    PORT=7860 \
    OMP_NUM_THREADS=2 \
    TTS_CACHE_DIR=/tmp/sarva-tts-cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY models ./models
COPY backend ./backend
COPY public ./public
COPY sanskrit_phonetic_engine.html ./sanskrit_phonetic_engine.html
COPY --from=frontend-builder /app/dist ./dist

# Ensure cache directory is writable by non-root containers (e.g. Hugging Face Spaces UID 1000)
RUN mkdir -p /app/public/audio/cache /tmp/sarva-tts-cache && \
    chown -R 1000:1000 /app /tmp/sarva-tts-cache && \
    chmod -R 775 /app/public/audio /tmp/sarva-tts-cache

USER 1000
EXPOSE 7860

CMD ["sh", "-c", "uvicorn backend.tts_server:app --host ${HOST:-0.0.0.0} --port ${PORT:-7860}"]

<p align="center">
  <img src=".github/assets/icon-dark.webp" alt="Voicebox" width="120" height="120" />
</p>

<h1 align="center">Voicebox</h1>

<p align="center">
  <strong>The open-source AI voice studio.</strong><br/>
  Clone any voice. Generate speech. Dictate into any app. Talk to agents in voices you own.<br/>
  A local-first voice I/O stack with a web-based interface and separate inference backend.
</p>

<p align="center">
  <a href="https://github.com/astre-lab/Voicebox/releases">
    <img src="https://img.shields.io/github/downloads/astre-lab/Voicebox/total?style=flat&color=blue" alt="Downloads" />
  </a>
  <a href="https://github.com/astre-lab/Voicebox/releases/latest">
    <img src="https://img.shields.io/github/v/release/astre-lab/Voicebox?style=flat" alt="Release" />
  </a>
  <a href="https://github.com/astre-lab/Voicebox/stargazers">
    <img src="https://img.shields.io/github/stars/astre-lab/Voicebox?style=flat" alt="Stars" />
  </a>
  <a href="https://github.com/astre-lab/Voicebox/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/astre-lab/Voicebox?style=flat" alt="License" />
  </a>
</p>

<p align="center">
  <a href="https://voicebox.sh">voicebox.sh</a> •
  <a href="https://docs.voicebox.sh">Docs</a> •
  <a href="#features">Features</a> •
  <a href="#api">API</a> •
  <a href="docs/content/docs/overview/troubleshooting.mdx">Troubleshooting</a>
</p>

<br/>

<p align="center">
  <img src="landing/public/assets/app-screenshot-1.webp" alt="Voicebox App Screenshot" width="800" />
</p>

<p align="center">
  <em>Voicebox web interface</em>
</p>

<br/>

<p align="center">
  <img src="landing/public/assets/app-screenshot-2.webp" alt="Voicebox Screenshot 2" width="800" />
</p>

<p align="center">
  <img src="landing/public/assets/app-screenshot-3.webp" alt="Voicebox Screenshot 3" width="800" />
</p>

<br/>

## What is Voicebox?

Voicebox is a **local-first AI voice studio** for generating, cloning, and working with speech locally.

It combines voice cloning, text-to-speech, speech-to-text, audio processing, voice profiles, and agent integrations in a single application.

The current architecture separates the user interface from the inference server:

```text
Browser
   │
   │ HTTP
   ▼
Voicebox Web
React + Vite
   │
   │ HTTP / REST
   ▼
Voicebox Server
FastAPI + Python
   │
   ▼
GPU / CPU inference
```

This makes the frontend independently deployable while allowing the backend to run wherever the required inference hardware is available — including a local machine, a GPU server, or a container.

### Highlights

- **Complete privacy** — models, voice data, and captures can remain on your own infrastructure
- **7 TTS engines** — Qwen3-TTS, Qwen CustomVoice, LuxTTS, Chatterbox Multilingual, Chatterbox Turbo, HumeAI TADA, and Kokoro
- **Voice cloning and preset voices** — zero-shot cloning from reference audio, plus curated preset voices
- **23 languages** — including English, Arabic, Japanese, Hindi, Swahili, and more
- **Post-processing effects** — pitch shift, reverb, delay, chorus, compression, and filters
- **Expressive speech** — paralinguistic tags such as `[laugh]`, `[sigh]`, and `[gasp]` through supported engines
- **Unlimited generation length** — automatic chunking and crossfading for long-form text
- **Stories editor** — multi-track timeline for conversations, podcasts, and narratives
- **Voice input** — Whisper-based speech-to-text and in-app dictation
- **Agent voice output** — MCP and HTTP integrations for giving agents a voice
- **Voice personalities** — local LLM-assisted rewriting for voice profiles
- **API-first** — REST API plus MCP server for integrating Voicebox into other applications
- **Web-first architecture** — the frontend runs as a standard web application and communicates with a separate backend
- **Flexible deployment** — run the frontend and inference server together or independently

---

## Download

Voicebox is currently being developed as a web-based application with a separately deployable Python inference server.

For development and self-hosting, see the [Development](#development) section below.

> Pre-built desktop application packages from the original Voicebox project are not part of this web-first fork.

---

## Features

### Multi-Engine Voice Cloning

Seven TTS engines with different strengths, switchable per generation:

| Engine | Languages | Strengths |
| --- | ---: | --- |
| **Qwen3-TTS** (0.6B / 1.7B) | 10 | High-quality multilingual cloning and delivery instructions |
| **Qwen CustomVoice** | 10 | Curated preset voices with natural-language delivery control |
| **LuxTTS** | English | Lightweight model, 48kHz output, fast inference |
| **Chatterbox Multilingual** | 23 | Broad multilingual coverage |
| **Chatterbox Turbo** | English | Fast model with expressive speech and paralinguistic tags |
| **TADA** (1B / 3B) | 10 | HumeAI speech-language model |
| **Kokoro** | 8 | Small, fast model with curated preset voices |

### Emotions & Paralinguistic Tags

**Chatterbox Turbo** supports tags such as:

```text
[laugh]
[chuckle]
[gasp]
[cough]
[sigh]
[groan]
[sniff]
[shush]
[clear throat]
```

These can be inserted directly into supported generation text.

### Post-Processing Effects

Voicebox provides audio effects powered by Spotify's `pedalboard` library.

| Effect | Description |
| --- | --- |
| Pitch Shift | Up or down by up to 12 semitones |
| Reverb | Configurable room size, damping, and wet/dry mix |
| Delay | Echo with adjustable time, feedback, and mix |
| Chorus / Flanger | Modulated delay for metallic or lush textures |
| Compressor | Dynamic range compression |
| Gain | Volume adjustment |
| High-Pass Filter | Remove low frequencies |
| Low-Pass Filter | Remove high frequencies |

Built-in presets include Robotic, Radio, Echo Chamber, and Deep Voice. Custom presets are also supported.

### Unlimited Generation Length

Long text is automatically split at sentence boundaries and generated in chunks before being crossfaded together.

- Configurable chunking limit
- Adjustable crossfade
- Support for up to 50,000 characters
- Sentence-aware splitting
- Support for CJK punctuation and supported speech tags

### Generation Versions

Every generation can maintain multiple versions with provenance tracking:

- **Original** — the initial TTS output
- **Effects versions** — alternate effects chains
- **Takes** — regenerated variations
- **Source tracking** — lineage between versions
- **Favorites** — quickly mark useful generations

### Async Generation Queue

Generation is asynchronous, allowing the interface to remain responsive while audio is produced.

- Serial execution queue
- SSE status streaming
- Failed-generation retry
- Recovery of stale generations after crashes

### Voice Profile Management

- Create profiles from audio files
- Record reference audio directly in the application
- Import and export profiles
- Multiple reference samples
- Per-profile default effects
- Descriptions and language metadata

### Stories Editor

A multi-voice timeline editor for conversations, podcasts, and narratives.

- Multi-track composition
- Drag-and-drop editing
- Audio trimming and splitting
- Synchronized playback
- Version pinning per clip

### Voice Input

Voicebox supports speech input through its web interface and its speech-to-text backend.

- Push-to-talk and toggle-style input
- In-app microphone controls
- Whisper-based transcription
- Optional LLM refinement
- Capture history and transcript editing

Platform-level global dictation and automatic paste are platform-dependent and are not part of the current web-only architecture.

### Speech-to-Text

Voicebox uses OpenAI Whisper for transcription.

The backend can run inference using the appropriate runtime for the deployment environment, including PyTorch-based GPU and CPU execution.

| Size | Notes |
| --- | --- |
| Base / Small / Medium / Large | Standard Whisper quality ladder |
| Turbo | Faster Whisper inference with minimal quality loss |

More STT engines are planned.

### Captures

Dictation recordings, in-app recordings, and uploaded audio can be stored in the Captures system.

- Replay recordings
- Re-transcribe with different Whisper models
- Refine transcripts with the local LLM
- Edit transcripts
- Promote captures to voice samples
- Keep original audio alongside transcripts

### Agent Voice Output

Voicebox provides speech output for MCP-aware agents and other applications.

For example:

```ts
await voicebox.speak({
  text: "Deploy complete.",
  profile: "Morgan",
});
```

The same functionality is available through the HTTP API:

```http
POST /speak
```

This allows agents, scripts, automation systems, and other applications to use Voicebox as a speech backend.

### Voice Personalities

A voice profile can have an associated personality that describes how that voice should communicate.

The local LLM can then be used to rewrite input text before it is passed to the TTS engine.

Supported workflows include:

- **Compose** — generate a fresh line in the voice's personality
- **Speak in character** — rewrite text through the personality before synthesis
- **Agent integration** — expose the same functionality through MCP

Local LLM options include Qwen3 models where supported by the backend configuration.

### Model Management

- Per-model unloading
- Custom model directories
- Model folder migration
- Download cancellation and cleanup

### GPU Support

Voicebox is designed to support multiple inference environments through the Python backend.

| Platform | Backend | Notes |
| --- | --- | --- |
| macOS (Apple Silicon) | MLX / Metal | Apple Silicon acceleration |
| Windows (NVIDIA) | PyTorch / CUDA | NVIDIA GPU inference |
| Linux (NVIDIA) | PyTorch / CUDA | Local or remote CUDA backend |
| Linux (AMD) | PyTorch / ROCm | AMD GPU inference |
| Windows | DirectML | Windows GPU support |
| Intel Arc | XPU / IPEX | Intel GPU acceleration |
| Any | CPU | CPU inference where supported |

The web frontend itself does not require a GPU. GPU requirements apply to the Voicebox backend and the models being used.

---

## API

Voicebox exposes a REST API for integrating voice I/O into applications and agents.

The backend API is available at the configured Voicebox server address.

### Generate speech

```bash
curl -X POST http://127.0.0.1:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "profile_id": "abc123", "language": "en"}'
```

### Agent voice output

```bash
curl -X POST http://127.0.0.1:8000/speak \
  -H "Content-Type: application/json" \
  -H "X-Voicebox-Client-Id: my-script" \
  -d '{"text": "Deploy complete.", "profile": "Morgan"}'
```

### Transcribe audio

```bash
curl -X POST http://127.0.0.1:8000/transcribe \
  -F "audio=@recording.wav" \
  -F "model=whisper-turbo"
```

### List voice profiles

```bash
curl http://127.0.0.1:8000/profiles
```

The exact server address and port can be changed depending on how the backend is deployed.

### MCP server

Voicebox also provides a built-in **Model Context Protocol** server.

MCP-aware clients can use Voicebox for speech generation, transcription, and access to Voicebox data.

Example:

```bash
claude mcp add voicebox \
  --transport http \
  --url http://127.0.0.1:8000/mcp \
  --header "X-Voicebox-Client-Id: claude-code"
```

Example HTTP MCP configuration:

```json
{
  "mcpServers": {
    "voicebox": {
      "url": "http://127.0.0.1:8000/mcp",
      "headers": {
        "X-Voicebox-Client-Id": "cursor"
      }
    }
  }
}
```

Available MCP tools include:

- `voicebox.speak`
- `voicebox.transcribe`
- `voicebox.list_captures`
- `voicebox.list_profiles`

See the [MCP guide](docs/content/docs/overview/mcp-server.mdx) for tool signatures, configuration, and security notes.

---

## Architecture

Voicebox is intentionally split into independently deployable components.

### Web frontend

The frontend lives in `web/` and uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Query

It is built as a normal web application and can be served by any static HTTP server.

### Backend

The backend lives in `backend/` and provides:

- FastAPI HTTP API
- TTS inference
- Speech-to-text
- Voice profile management
- Audio processing
- Model management
- MCP server functionality
- SQLite-backed application data

The backend can run locally or on a separate machine with access to the required GPU.

### Deployment

A typical deployment looks like:

```text
┌──────────────────────────────┐
│          Browser             │
└──────────────┬───────────────┘
               │ HTTP
               ▼
┌──────────────────────────────┐
│       Voicebox Web           │
│       React + Vite            │
└──────────────┬───────────────┘
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│      Voicebox Server         │
│      FastAPI + Python         │
└──────────────┬───────────────┘
               │
               ▼
          GPU / CPU
```

The frontend and backend do not need to run on the same machine.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | Zustand, React Query |
| Backend | FastAPI, Python |
| TTS Engines | Qwen3-TTS, Qwen CustomVoice, LuxTTS, Chatterbox, Chatterbox Turbo, TADA, Kokoro |
| STT | Whisper / Whisper Turbo |
| Local LLM | Qwen3 |
| API | REST |
| Agent Protocol | MCP / FastMCP |
| Effects | Pedalboard |
| Inference | PyTorch / CUDA / ROCm / XPU / MLX where supported |
| Database | SQLite |
| Audio | WaveSurfer.js, librosa |

---

## Roadmap

The project is actively moving toward a more modular, web-first architecture.

| Feature | Description |
| --- | --- |
| **Windows / Linux auto-paste** | Platform-specific dictation paste support |
| **STT engine expansion** | Parakeet v3 and Qwen3-ASR |
| **Pipeline routing** | Configurable source → transform → sink pipelines |
| **Streaming transcription** | WebSocket streaming transcription |
| **End-to-end speech LLMs** | Voice-to-voice models such as Moshi, GLM-4-Voice, and Qwen2.5 Omni |
| **Voice Design** | Create voices from text descriptions |
| **Long-form capture** | Mic + system audio capture with LLM processing |
| **Platform sinks** | Integrations such as Apple Notes and Obsidian |
| **Plugin architecture** | Extensible models, transforms, and sinks |
| **Mobile companion** | Control Voicebox from a phone |
| **Svelte frontend** | Future exploration of a Svelte + Tailwind + shadcn-svelte frontend |

For the current engineering status, open issues, and active work, see [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md).

---

## Development

### Prerequisites

The current web-first development setup requires:

- Node.js
- pnpm
- Python 3.11+
- Git

A GPU is only required for backend inference workloads that use GPU acceleration.

### Clone the repository

```bash
git clone https://github.com/astre-lab/Voicebox.git
cd Voicebox
```

### Install dependencies

Install the JavaScript workspace dependencies:

```bash
pnpm install
```

Set up the Python backend according to the instructions in [`backend/`](backend/) and the project development documentation.

### Start the web frontend

```bash
pnpm run dev:web
```

The Vite development server will start the Voicebox web interface.

### Start the backend

From the repository root:

```bash
pnpm run dev:server
```

The backend runs on the configured server port.

The frontend can then be configured to connect to the backend using the appropriate server URL/environment configuration.

### Build the web frontend

```bash
pnpm run build:web
```

The production frontend is generated in:

```text
web/dist/
```

The resulting static files can be served by nginx, Caddy, another web server, or a container.

### Build the landing site

```bash
pnpm run build:landing
```

### Type checking

```bash
pnpm run typecheck
```

### Linting

```bash
pnpm run lint
```

### Formatting

```bash
pnpm run format
```

### Full checks

```bash
pnpm run check
```

---

## Project Structure

```text
Voicebox/
├── app/              # Shared React application code
├── web/              # Web application and Vite entry point
├── backend/          # Python FastAPI server and inference
├── landing/          # Marketing website
├── scripts/          # Development and build scripts
├── docs/             # Documentation
└── .github/          # GitHub workflows and repository assets
```

The web application is intentionally separated from the backend so that each component can be developed, built, and deployed independently.

---

## Adding New Voice Models

The multi-engine architecture makes adding TTS engines straightforward.

See the [TTS engine development guide](docs/content/docs/developer/tts-engines.mdx) for the process covering:

- Dependency research
- Backend protocol implementation
- Model configuration
- Frontend integration
- Testing
- Packaging

An [agent skill](.agents/skills/add-tts-engine/SKILL.md) is also available for AI-assisted model integration.

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the relevant checks
5. Submit a pull request

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contribution guidelines.

---

## Security

If you discover a security vulnerability, please report it responsibly.

See [`SECURITY.md`](SECURITY.md) for details.

---

## License

MIT License — see [`LICENSE`](LICENSE) for details.

---

<p align="center">
  <a href="https://voicebox.sh">voicebox.sh</a>
</p>
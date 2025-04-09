# Language Learning Assistant

An interactive language learning application powered by OpenAI's real-time API, featuring voice-based conversations, real-time transcription, and adaptive learning capabilities.

## Features

### Core Functionality
- **Real-time Voice Interaction**: Natural conversations with AI language tutor
- **Dual Voice Detection Modes**:
  - Push-to-Talk (Manual)
  - Voice Activity Detection (Automatic)
- **Multi-Language Support**:
  - Spanish
  - French
  - German
  - Italian
  - Portuguese

### Technical Features
- Real-time audio visualization
- WebSocket-based communication
- Low-latency voice processing
- Dynamic transcription
- Event logging and monitoring

### Learning Features
- Proficiency level tracking
- Pronunciation practice
- Grammar checking
- Vocabulary review
- Conversation history

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- ElevenLabs API key

### Installation
```bash
# Clone the repository
git clone https://github.com/adamm0019/conversAItion-vite.git

# Navigate to project directory
cd conversAItion-vite

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your OpenAI API key to .env
VITE_OPENAI_API_KEY=your_api_key_here

# Add your ElevenLabs API key to .env
VITE_ELEVEN_LABS_API_KEY

# Start the development server
npm run dev
```

### Running the Local Relay Server
```bash
# Start the relay server
cd eleven-server
node index.js
```

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Mantine UI
- **State Management**: React Hooks
- **Audio Processing**: Web Audio API
- **API Integration**: OpenAI Real-time API, ElevenLabs Agent API
- **Styling**: Mantine Core + framer-motion + Tabler Icons

## 🔧 Configuration

## Usage

1. **Start a Session**:
   - Click 'Start new chat' to initialize
   - Enter text in chat input area or use microphone to record audio

2. **Voice Interaction**:
   - Use Push-to-Talk or VAD mode
   - Speak naturally with the AI tutor
   - View real-time transcription

3. **Learning Tools**:
   - Helpful language learning games
   - Grammar checking features
   - Review vocabulary
   - Track progress

## Contact

Adam Malone - [adam-malone@hotmail.co.uk]

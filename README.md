# Language Learning Assistant 🎙️

An interactive language learning application powered by OpenAI's real-time API, featuring voice-based conversations, real-time transcription, and adaptive learning capabilities.

## 🌟 Features

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

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

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
OPENAI_API_KEY=your_api_key_here

# Start the development server
npm run dev
```

### Running the Local Relay Server
```bash
# Start the relay server
cd relay-server
node index.js
```

## 🛠️ Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Mantine UI
- **State Management**: React Hooks
- **Audio Processing**: Web Audio API
- **API Integration**: OpenAI Real-time API
- **Styling**: Mantine Core + Emotion + Tabler Icons

## 📁 Project Structure

```
src/
├── components/
│   ├── AudioControls/
│   ├── ChatSection/
│   ├── Header/
│   └── EventsPanel/
├── hooks/
│   ├── useAudioRecording.ts
├── types/
│   └── index.ts
├── styles/
│   └── theme.ts
└── utils/
    ├── conversation_config.js
    └── wav_renderer.ts
```

## 🔧 Configuration

### Environment Variables
```env
VITE_LOCAL_RELAY_SERVER_URL=http://localhost:8081
OPENAI_API_KEY=your_api_key
```

### Audio Settings
- Sample Rate: 24000 Hz
- Channel Count: 1
- Bit Depth: 16-bit

## 🎯 Usage

1. **Start a Session**:
   - Click 'Connect' to initialize
   - Select your target language
   - Choose voice detection mode

2. **Voice Interaction**:
   - Use Push-to-Talk or VAD mode
   - Speak naturally with the AI tutor
   - View real-time transcription

3. **Learning Tools**:
   - Access pronunciation practice
   - Use grammar check features
   - Review vocabulary
   - Track progress

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the Real-time API
- Mantine team for the UI components
- Contributors and testers

## 📫 Contact

Adam Malone - [adam-malone@hotmail.co.uk]

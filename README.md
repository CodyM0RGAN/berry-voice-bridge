# Berry's Voice Bridge

A project to create a voice bridge using ElevenLabs Conversational AI and WebRTC for real-time communication between a Raspberry Pi and a PC over a local network.

## Features
- Real-time voice communication between Raspberry Pi and PC
- WebSocket-based signaling for connection establishment
- WebRTC for low-latency audio streaming
- ElevenLabs Conversational AI integration

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/CodyM0RGAN/berry-voice-bridge.git
   cd berry-voice-bridge
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your ElevenLabs API key and other configuration values.

4. Run the server:
   ```
   python src/server.py
   ```

5. Run the client:
   ```
   python src/websocket_client.py
   ```

## Project Structure

- `src/`: Source code
  - `server.py`: WebSocket signaling server
  - `websocket_client.py`: WebSocket client implementation
  - `voice_processor.py`: Audio recording and playback utilities
- `requirements.txt`: Python dependencies
- `.env.example`: Environment variables template
- `Dockerfile`: Docker configuration for containerization
- `docker-compose.yml`: Docker Compose configuration

## Dependencies

- Python 3.7+
- websockets
- python-dotenv
- pyaudio
- aiortc (for WebRTC support)
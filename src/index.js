require('dotenv').config();
const WebSocket = require('ws');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Configuration
const CONFIG = {
  port: process.env.PORT || 8787,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenAgentId: process.env.ELEVEN_AGENT_ID,
  elevenWsUrl: process.env.ELEVEN_WS_URL || 'wss://api.elevenlabs.io/v1/convai/ws',
  berrySupervisorUrl: process.env.BERRY_SUPERVISOR_URL || 'http://supervisor:8080/invoke',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000
};

// Validation
if (!CONFIG.elevenLabsApiKey) {
  logger.error('ELEVENLABS_API_KEY is required');
  process.exit(1);
}

if (!CONFIG.elevenAgentId) {
  logger.error('ELEVEN_AGENT_ID is required');
  process.exit(1);
}

// WebSocket server
const wss = new WebSocket.Server({ port: CONFIG.port });

wss.on('connection', (clientWs) => {
  logger.info('New client connected');
  
  // Connect to ElevenLabs WebSocket
  const elevenWs = new WebSocket(CONFIG.elevenWsUrl);
  
  elevenWs.on('open', () => {
    logger.info('Connected to ElevenLabs WebSocket');
    
    // Send initialization message
    const initMessage = {
      type: 'open_session',
      pipeline: 'conversation',
      agent_id: CONFIG.elevenAgentId
    };
    
    elevenWs.send(JSON.stringify(initMessage));
  });
  
  elevenWs.on('message', async (data) => {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'session_opened':
        logger.info('Session opened with ElevenLabs');
        break;
        
      case 'conversation_started':
        logger.info('Conversation started');
        break;
        
      case 'user_transcript':
        logger.info('User transcript received', { text: message.text });
        // Forward user transcript to client
        clientWs.send(JSON.stringify({ type: 'user_transcript', text: message.text }));
        break;
        
      case 'agent_response':
        logger.info('Agent response received', { text: message.text });
        // Forward agent response to client
        clientWs.send(JSON.stringify({ type: 'agent_response', text: message.text }));
        break;
        
      case 'agent_audio':
        logger.info('Agent audio received');
        // Forward agent audio to client
        clientWs.send(JSON.stringify({ type: 'agent_audio', data: message.data }));
        break;
        
      default:
        logger.warn('Unknown message type', { type: message.type });
    }
  });
  
  elevenWs.on('error', (error) => {
    logger.error('ElevenLabs WebSocket error', { error: error.message });
  });
  
  elevenWs.on('close', () => {
    logger.info('ElevenLabs WebSocket connection closed');
  });
  
  // Handle messages from the client
  clientWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'user_audio':
          // Send user audio to ElevenLabs
          elevenWs.send(JSON.stringify({ type: 'user_audio', data: message.data }));
          break;
          
        case 'user_text':
          // Send user text to ElevenLabs
          elevenWs.send(JSON.stringify({ type: 'user_text', text: message.text }));
          break;
          
        case 'supervisor_request':
          // Forward request to Berry Supervisor
          const response = await fetch(CONFIG.berrySupervisorUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(message.payload),
            timeout: CONFIG.requestTimeoutMs
          });
          
          const result = await response.json();
          
          // Send supervisor response back to client
          clientWs.send(JSON.stringify({ 
            type: 'supervisor_response', 
            requestId: message.requestId,
            payload: result 
          }));
          break;
          
        default:
          logger.warn('Unknown client message type', { type: message.type });
      }
    } catch (error) {
      logger.error('Error handling client message', { error: error.message });
    }
  });
  
  clientWs.on('error', (error) => {
    logger.error('Client WebSocket error', { error: error.message });
  });
  
  clientWs.on('close', () => {
    logger.info('Client disconnected');
    // Close ElevenLabs connection when client disconnects
    if (elevenWs.readyState === WebSocket.OPEN) {
      elevenWs.close();
    }
  });
});

logger.info(`Voice bridge server started on port ${CONFIG.port}`);
import asyncio
import websockets
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def connect_to_server():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as websocket:
        print("Connected to server")
        
        # Send a message to the server
        await websocket.send(json.dumps({"type": "client_connected", "data": "Hello from client"}))
        
        # Listen for messages from the server
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

if __name__ == "__main__":
    asyncio.run(connect_to_server())
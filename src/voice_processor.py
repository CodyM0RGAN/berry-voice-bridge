import pyaudio
import wave
import threading
import time

class VoiceProcessor:
    def __init__(self, format=pyaudio.paInt16, channels=1, rate=44100, chunk=1024):
        self.format = format
        self.channels = channels
        self.rate = rate
        self.chunk = chunk
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.frames = []
        self.recording = False

    def start_recording(self):
        self.stream = self.audio.open(format=self.format,
                                      channels=self.channels,
                                      rate=self.rate,
                                      input=True,
                                      frames_per_buffer=self.chunk)
        self.recording = True
        self.frames = []
        
        print("Recording started...")
        while self.recording:
            data = self.stream.read(self.chunk)
            self.frames.append(data)

    def stop_recording(self):
        self.recording = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        print("Recording stopped.")

    def save_recording(self, filename):
        wf = wave.open(filename, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(self.audio.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(self.frames))
        wf.close()
        print(f"Recording saved to {filename}")

    def play_audio(self, filename):
        wf = wave.open(filename, 'rb')
        stream = self.audio.open(format=self.audio.get_format_from_width(wf.getsampwidth()),
                                 channels=wf.getnchannels(),
                                 rate=wf.getframerate(),
                                 output=True)
        data = wf.readframes(self.chunk)
        while data:
            stream.write(data)
            data = wf.readframes(self.chunk)
        
        stream.stop_stream()
        stream.close()
        print(f"Finished playing {filename}")

# Example usage
if __name__ == "__main__":
    processor = VoiceProcessor()
    
    # Start recording in a separate thread
    record_thread = threading.Thread(target=processor.start_recording)
    record_thread.start()
    
    # Record for 5 seconds
    time.sleep(5)
    
    # Stop recording
    processor.stop_recording()
    
    # Save the recording
    processor.save_recording("output.wav")
    
    # Play the recording
    processor.play_audio("output.wav")
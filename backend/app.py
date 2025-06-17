from flask import Flask, request, jsonify
from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np
import io
import soundfile as sf
from flask_cors import CORS

app = Flask(__name__)
encoder = VoiceEncoder()

enrolled_embedding = None  # Store enrolled voice embedding

def embed_audio(audio_bytes):
    audio, sr = sf.read(io.BytesIO(audio_bytes))
    wav = preprocess_wav(audio)
    return encoder.embed_utterance(wav)

@app.route('/enroll', methods=['POST'])
def enroll():
    global enrolled_embedding
    audio_file = request.files.get('audio')
    if not audio_file:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_bytes = audio_file.read()
    enrolled_embedding = embed_audio(audio_bytes)
    return jsonify({'message': 'Voice enrolled successfully!'})

@app.route('/verify', methods=['POST'])
def verify():
    if enrolled_embedding is None:
        return jsonify({'error': 'No voice enrolled yet'}), 400

    audio_file = request.files.get('audio')
    if not audio_file:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_bytes = audio_file.read()
    test_embedding = embed_audio(audio_bytes)

    similarity = np.dot(enrolled_embedding, test_embedding) / (np.linalg.norm(enrolled_embedding) * np.linalg.norm(test_embedding))
    threshold = 0.75
    verified = similarity > threshold

    return jsonify({
        'similarity': float(similarity),
        'verified': verified
    })

if __name__ == '__main__':
    app.run(debug=True)
app = Flask(__name__)
CORS(app) 
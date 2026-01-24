"""
Tino Voice Service - ElevenLabs Integration
Text-to-Speech (TTS) and Speech-to-Text (STT) for Tino AI

Features:
- Multiple voice options (Hindi/English, Male/Female)
- Real-time voice streaming
- Automatic language detection
"""

from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import os
import base64
import io
from elevenlabs import ElevenLabs, VoiceSettings

router = APIRouter(prefix="/tino-voice", tags=["tino-voice"])

# ElevenLabs API Key from environment
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

# Voice IDs for different options
# These are ElevenLabs pre-made multilingual voices
VOICE_OPTIONS = {
    "male_hindi": {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Sarah - clear multilingual voice
        "name": "Tino (Male - Hindi)",
        "description": "Male voice for Hindi/Hinglish"
    },
    "female_hindi": {
        "voice_id": "XB0fDUnXU5powFXDhCwa",  # Charlotte - warm multilingual voice
        "name": "Tino (Female - Hindi)", 
        "description": "Female voice for Hindi/Hinglish"
    },
    "male_english": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam - clear English voice
        "name": "Tino (Male - English)",
        "description": "Male voice for English"
    },
    "female_english": {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel - friendly English voice
        "name": "Tino (Female - English)",
        "description": "Female voice for English"
    }
}

# Pydantic Models
class TTSRequest(BaseModel):
    text: str
    voice_type: str = "male_hindi"  # male_hindi, female_hindi, male_english, female_english
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True

class TTSResponse(BaseModel):
    audio_base64: str
    voice_type: str
    text: str
    success: bool

class STTResponse(BaseModel):
    transcribed_text: str
    detected_language: Optional[str] = None
    success: bool

class VoiceOption(BaseModel):
    id: str
    name: str
    description: str
    gender: str
    language: str

class VoiceOptionsResponse(BaseModel):
    voices: List[VoiceOption]

# Initialize ElevenLabs client
def get_eleven_client():
    if not ELEVENLABS_API_KEY:
        return None
    return ElevenLabs(api_key=ELEVENLABS_API_KEY)


@router.get("/voices", response_model=VoiceOptionsResponse)
async def get_available_voices():
    """Get list of available voice options for Tino AI"""
    voices = [
        VoiceOption(
            id="male_hindi",
            name="Tino (पुरुष - हिंदी)",
            description="हिंदी/Hinglish के लिए पुरुष आवाज़",
            gender="male",
            language="hindi"
        ),
        VoiceOption(
            id="female_hindi",
            name="Tino (महिला - हिंदी)",
            description="हिंदी/Hinglish के लिए महिला आवाज़",
            gender="female",
            language="hindi"
        ),
        VoiceOption(
            id="male_english",
            name="Tino (Male - English)",
            description="Male voice for English",
            gender="male",
            language="english"
        ),
        VoiceOption(
            id="female_english",
            name="Tino (Female - English)",
            description="Female voice for English",
            gender="female",
            language="english"
        )
    ]
    return VoiceOptionsResponse(voices=voices)


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using ElevenLabs"""
    try:
        client = get_eleven_client()
        
        if not client:
            # Fallback: Return empty audio if no API key
            print("WARNING: ELEVENLABS_API_KEY not configured, TTS disabled")
            return TTSResponse(
                audio_base64="",
                voice_type=request.voice_type,
                text=request.text,
                success=False
            )
        
        # Get voice ID based on selected type
        voice_config = VOICE_OPTIONS.get(request.voice_type, VOICE_OPTIONS["male_hindi"])
        voice_id = voice_config["voice_id"]
        
        # Configure voice settings
        voice_settings = VoiceSettings(
            stability=request.stability,
            similarity_boost=request.similarity_boost,
            style=request.style,
            use_speaker_boost=request.use_speaker_boost
        )
        
        # Generate audio
        audio_generator = client.text_to_speech.convert(
            text=request.text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",  # Supports Hindi and English
            voice_settings=voice_settings
        )
        
        # Collect audio chunks
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Convert to base64
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        return TTSResponse(
            audio_base64=audio_b64,
            voice_type=request.voice_type,
            text=request.text,
            success=True
        )
        
    except Exception as e:
        print(f"TTS Error: {str(e)}")
        return TTSResponse(
            audio_base64="",
            voice_type=request.voice_type,
            text=request.text,
            success=False
        )


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(audio_file: UploadFile = File(...)):
    """Convert speech to text using ElevenLabs"""
    try:
        client = get_eleven_client()
        
        if not client:
            return STTResponse(
                transcribed_text="",
                detected_language=None,
                success=False
            )
        
        # Read audio content
        audio_content = await audio_file.read()
        
        # Transcribe using ElevenLabs
        transcription_response = client.speech_to_text.convert(
            file=io.BytesIO(audio_content),
            model_id="scribe_v1"
        )
        
        # Extract text
        transcribed_text = transcription_response.text if hasattr(transcription_response, 'text') else str(transcription_response)
        
        # Simple language detection (based on script)
        detected_language = detect_language(transcribed_text)
        
        return STTResponse(
            transcribed_text=transcribed_text,
            detected_language=detected_language,
            success=True
        )
        
    except Exception as e:
        print(f"STT Error: {str(e)}")
        return STTResponse(
            transcribed_text="",
            detected_language=None,
            success=False
        )


def detect_language(text: str) -> str:
    """Simple language detection based on script"""
    # Check for Devanagari script (Hindi)
    devanagari_count = sum(1 for char in text if '\u0900' <= char <= '\u097F')
    total_chars = len(text.replace(" ", ""))
    
    if total_chars == 0:
        return "english"
    
    hindi_ratio = devanagari_count / total_chars
    
    if hindi_ratio > 0.3:
        return "hindi"
    elif hindi_ratio > 0.1:
        return "hinglish"
    else:
        return "english"


@router.get("/status")
async def voice_status():
    """Check if ElevenLabs voice service is configured"""
    has_key = bool(ELEVENLABS_API_KEY)
    return {
        "elevenlabs_configured": has_key,
        "available_voices": len(VOICE_OPTIONS),
        "tts_enabled": has_key,
        "stt_enabled": has_key
    }

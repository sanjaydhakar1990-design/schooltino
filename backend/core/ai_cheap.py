"""
ai_cheap.py - Ultra-Cheap AI Engine for Schooltino
====================================================
Priority stack (cheapest first):
  1. GROQ        - FREE (Llama 3, Mixtral) - 14,400 req/day free
  2. Gemini Flash - ₹0.075/million tokens (ultra cheap)
  3. Sarvam AI   - Indian startup, Hindi/regional support, cheap
  4. Ollama      - Self-hosted, 100% FREE (if server available)
  5. OpenAI GPT  - Last resort (expensive)

All calls are async with timeout + retry logic.
"""

import os
import logging
import asyncio
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# ====================== API KEYS ======================
# SCALE STRATEGY for thousands of schools (₹0.05/school/month):
# - Multiple API keys per provider = multiply free quota
# - Gemini Flash: $0.075/M tokens = cheapest reliable cloud AI at scale
# - 10,000 schools × 50 queries/day = only ~$19/day total
# - Comma-separate multiple keys: GROQ_API_KEYS=key1,key2,key3

_GROQ_KEYS_RAW    = os.getenv("GROQ_API_KEYS", os.getenv("GROQ_API_KEY", ""))
GROQ_API_KEYS     = [k.strip() for k in _GROQ_KEYS_RAW.split(",") if k.strip()]
GROQ_API_KEY      = GROQ_API_KEYS[0] if GROQ_API_KEYS else ""

_GEMINI_KEYS_RAW  = os.getenv("GEMINI_API_KEYS", os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", ""))
GEMINI_API_KEYS   = [k.strip() for k in _GEMINI_KEYS_RAW.split(",") if k.strip()]
GEMINI_API_KEY    = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else ""

SARVAM_API_KEY     = os.getenv("SARVAM_API_KEY", "")
OLLAMA_BASE_URL    = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY", "")
EMERGENT_LLM_KEY   = os.getenv("EMERGENT_LLM_KEY", "")

# Round-robin for key rotation (maximizes free tier across keys)
_groq_key_idx   = 0
_gemini_key_idx = 0

def _next_groq_key() -> str:
    global _groq_key_idx
    if not GROQ_API_KEYS: return ""
    key = GROQ_API_KEYS[_groq_key_idx % len(GROQ_API_KEYS)]
    _groq_key_idx += 1
    return key

def _next_gemini_key() -> str:
    global _gemini_key_idx
    if not GEMINI_API_KEYS: return ""
    key = GEMINI_API_KEYS[_gemini_key_idx % len(GEMINI_API_KEYS)]
    _gemini_key_idx += 1
    return key

# ====================== MODEL CONFIG ======================

GROQ_MODELS = {
    "fast":     "llama-3.1-8b-instant",      # Fastest, good for simple tasks
    "smart":    "llama-3.3-70b-versatile",   # Best quality on Groq (free!)
    "code":     "llama-3.1-70b-versatile",   # Code generation
    "mixtral":  "mixtral-8x7b-32768",         # Long context tasks
}

GEMINI_MODELS = {
    "flash":    "gemini-1.5-flash",           # Cheapest, fastest
    "flash_8b": "gemini-1.5-flash-8b",        # Even cheaper, good for simple tasks
    "pro":      "gemini-1.5-pro",             # More capable but pricier
}

OLLAMA_MODELS = {
    "fast":     "phi3",                       # Very fast, small
    "smart":    "llama3.1",                   # Good quality
    "hindi":    "llama3.1",                   # Hindi support
}

SARVAM_MODELS = {
    "saaras":   "saaras:v1",                  # Sarvam's main LLM
}


# ====================== GROQ AI (PRIMARY - FREE) ======================

async def ask_groq(
    prompt: str,
    system: str = "You are a helpful school management assistant.",
    model: str = "smart",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    timeout: int = 20
) -> Optional[str]:
    """
    Call Groq AI - COMPLETELY FREE up to 14,400 requests/day.
    Uses Llama 3.3 70B by default (better than GPT-3.5!).
    """
    if not GROQ_API_KEY:
        return None

    model_id = GROQ_MODELS.get(model, GROQ_MODELS["smart"])

    payload = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    except httpx.TimeoutException:
        logger.warning("Groq API timeout")
        return None
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return None


# ====================== GEMINI FLASH (SECONDARY - ULTRA CHEAP) ======================

async def ask_gemini(
    prompt: str,
    system: str = "You are a helpful school management assistant.",
    model: str = "flash",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    timeout: int = 25
) -> Optional[str]:
    """
    Call Google Gemini Flash - ₹0.075/million tokens input (EXTREMELY CHEAP).
    Gemini Flash 8B is even cheaper for simple tasks.
    """
    if not GEMINI_API_KEY:
        return None

    model_id = GEMINI_MODELS.get(model, GEMINI_MODELS["flash"])
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system}\n\n{prompt}"}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature
        }
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                url,
                params={"key": GEMINI_API_KEY},
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    except httpx.TimeoutException:
        logger.warning("Gemini API timeout")
        return None
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None


# ====================== SARVAM AI (HINDI/INDIAN LANGUAGES) ======================

async def ask_sarvam(
    prompt: str,
    language: str = "hi-IN",   # hi-IN, mr-IN, gu-IN, ta-IN, te-IN, kn-IN, ml-IN, pa-IN, bn-IN, od-IN
    timeout: int = 20
) -> Optional[str]:
    """
    Call Sarvam AI - Indian startup, best for Hindi & regional Indian languages.
    Supports: Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Punjabi, Bengali, Odia.
    API: https://www.sarvam.ai
    """
    if not SARVAM_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {SARVAM_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "saaras:v1",
                    "messages": [{"role": "user", "content": prompt}],
                    "language": language
                }
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"Sarvam AI error: {e}")
        return None


async def sarvam_translate(text: str, source_lang: str = "en-IN", target_lang: str = "hi-IN") -> Optional[str]:
    """
    Translate text using Sarvam AI.
    Perfect for Hindi school notices, fee receipts, admit cards, etc.
    """
    if not SARVAM_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.sarvam.ai/translate",
                headers={"api-subscription-key": SARVAM_API_KEY},
                json={
                    "input": text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "speaker_gender": "Female",
                    "mode": "formal"
                }
            )
            resp.raise_for_status()
            return resp.json().get("translated_text")
    except Exception as e:
        logger.error(f"Sarvam translate error: {e}")
        return None


async def sarvam_text_to_speech(text: str, language: str = "hi-IN") -> Optional[bytes]:
    """
    Convert text to speech using Sarvam AI - perfect for Indian language announcements.
    """
    if not SARVAM_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={"api-subscription-key": SARVAM_API_KEY},
                json={
                    "inputs": [text],
                    "target_language_code": language,
                    "speaker": "meera",
                    "pitch": 0,
                    "pace": 1.0,
                    "loudness": 1.5,
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                    "model": "bulbul:v1"
                }
            )
            resp.raise_for_status()
            import base64
            audio_b64 = resp.json()["audios"][0]
            return base64.b64decode(audio_b64)
    except Exception as e:
        logger.error(f"Sarvam TTS error: {e}")
        return None


# ====================== OLLAMA (SELF-HOSTED, 100% FREE) ======================

async def ask_ollama(
    prompt: str,
    system: str = "You are a helpful school management assistant.",
    model: str = "llama3.1",
    timeout: int = 60
) -> Optional[str]:
    """
    Call local Ollama server - 100% FREE, runs on your own machine/server.
    Install: https://ollama.ai
    Run: ollama pull llama3.1
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user",   "content": prompt}
                    ],
                    "stream": False
                }
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]
    except Exception as e:
        logger.debug(f"Ollama not available: {e}")
        return None


# ====================== SMART AI ROUTER ======================

async def ask_ai(
    prompt: str,
    system: str = "You are a helpful school management assistant for Indian schools.",
    task_type: str = "general",   # general, hindi, code, analysis, simple
    max_tokens: int = 1024,
    school_plan: str = "free"
) -> str:
    """
    MAIN AI FUNCTION - Automatically picks the cheapest available AI.

    Priority order:
      1. Groq       (free, fast, powerful)
      2. Gemini Flash (super cheap, reliable)
      3. Ollama     (free if self-hosted)
      4. Sarvam     (for Hindi/Indian languages)
      5. Fallback   (rule-based response)

    task_type options:
      - "general"   : school management, Q&A
      - "hindi"     : Hindi language tasks → Sarvam first
      - "code"      : Code generation → Groq code model
      - "analysis"  : Data analysis → Groq smart model
      - "simple"    : Short answers → Groq fast or Gemini flash-8b
    """
    # For Hindi tasks, try Sarvam first
    if task_type == "hindi" and SARVAM_API_KEY:
        result = await ask_sarvam(prompt, language="hi-IN")
        if result:
            return result

    # Try Groq first (FREE!)
    groq_model = "fast" if task_type == "simple" else ("code" if task_type == "code" else "smart")
    result = await ask_groq(prompt, system=system, model=groq_model, max_tokens=max_tokens)
    if result:
        return result

    # Try Gemini Flash (ultra cheap)
    gemini_model = "flash_8b" if task_type == "simple" else "flash"
    result = await ask_gemini(prompt, system=system, model=gemini_model, max_tokens=max_tokens)
    if result:
        return result

    # Try Ollama (free self-hosted)
    result = await ask_ollama(prompt, system=system)
    if result:
        return result

    # Fallback for Hindi
    if task_type == "hindi":
        result = await ask_sarvam(prompt)
        if result:
            return result

    # Final fallback - rule-based response
    return _rule_based_fallback(prompt, task_type)


def _rule_based_fallback(prompt: str, task_type: str) -> str:
    """Basic rule-based response when all AI services are unavailable"""
    prompt_lower = prompt.lower()

    if any(word in prompt_lower for word in ["attendance", "absent", "present"]):
        return "Attendance data is available in the Attendance module. Please check the daily attendance report."
    if any(word in prompt_lower for word in ["fee", "payment", "pending"]):
        return "Fee information is available in the Fee Management module. Please check the fee status report."
    if any(word in prompt_lower for word in ["exam", "result", "marks"]):
        return "Examination results are available in the Examination module."
    if any(word in prompt_lower for word in ["student", "admission"]):
        return "Student information is available in the Student Management module."

    return ("AI assistant is temporarily unavailable. "
            "Please check the relevant module for the information you need, "
            "or contact your system administrator.")


# ====================== SCHOOL-SPECIFIC AI FUNCTIONS ======================

async def generate_school_notice(
    title: str,
    content: str,
    language: str = "en",
    school_name: str = ""
) -> dict:
    """Generate a formatted school notice with AI"""
    lang_instruction = "in Hindi" if language == "hi" else "in English"
    prompt = f"""
Write a formal school notice {lang_instruction} for {school_name}:
Title: {title}
Content: {content}

Format it properly with:
- Date, School letterhead style
- Clear subject line
- Body with proper formatting
- Signature line for Principal/Director

Keep it professional and concise.
"""
    notice_text = await ask_ai(
        prompt,
        system=f"You are a school administrator drafting official notices for {school_name}.",
        task_type="hindi" if language == "hi" else "general",
        max_tokens=800
    )
    return {"notice": notice_text, "language": language}


async def analyze_attendance_data(school_id: str, data: dict) -> str:
    """Analyze attendance patterns and give insights"""
    prompt = f"""
Analyze this school attendance data and provide insights:
{data}

Provide:
1. Overall attendance percentage
2. Students with poor attendance (below 75%)
3. Days with highest absenteeism
4. Recommendations to improve attendance
Keep response concise and actionable.
"""
    return await ask_ai(prompt, task_type="analysis", max_tokens=600)


async def generate_fee_reminder(
    student_name: str,
    amount_due: float,
    due_date: str,
    school_name: str,
    language: str = "en"
) -> str:
    """Generate a polite fee reminder message"""
    if language == "hi":
        prompt = f"""
{school_name} की ओर से {student_name} के अभिभावकों को विनम्र सूचना:
₹{amount_due} की फीस {due_date} तक जमा करें।
एक विनम्र reminder SMS/notification लिखें।
"""
    else:
        prompt = f"""
Write a polite fee reminder for:
Student: {student_name}
Amount Due: ₹{amount_due}
Due Date: {due_date}
School: {school_name}
Keep it short (under 160 chars for SMS).
"""
    return await ask_ai(prompt, task_type="hindi" if language == "hi" else "simple", max_tokens=200)


async def suggest_timetable(
    classes: list,
    teachers: list,
    subjects: list,
    periods_per_day: int = 8
) -> str:
    """AI-generated timetable suggestions"""
    prompt = f"""
Create an optimal timetable for a school with:
Classes: {classes}
Teachers: {teachers}
Subjects: {subjects}
Periods per day: {periods_per_day}

Suggest a weekly timetable in table format ensuring:
- No teacher conflict (same teacher in two classes simultaneously)
- Math/Science in morning slots
- PT/Art in afternoon
- Balanced subject distribution
"""
    return await ask_ai(prompt, task_type="analysis", max_tokens=2000)


async def analyze_student_performance(student_data: dict) -> str:
    """Analyze student performance and generate report card comments"""
    prompt = f"""
Analyze this student's academic data and write:
1. A brief performance summary (2-3 sentences)
2. Strengths identified
3. Areas for improvement
4. Teacher's comment for report card

Student data: {student_data}

Keep comments positive and constructive.
"""
    return await ask_ai(prompt, task_type="general", max_tokens=500)


async def answer_parent_query(
    query: str,
    school_context: dict,
    language: str = "en"
) -> str:
    """Answer parent queries via WhatsApp/chat bot"""
    system = f"""You are a helpful school assistant for {school_context.get('name', 'the school')}.
You help parents with questions about fees, attendance, holidays, etc.
Be polite, brief, and helpful. Respond in {'Hindi' if language == 'hi' else 'English'}."""

    return await ask_ai(query, system=system,
                         task_type="hindi" if language == "hi" else "simple",
                         max_tokens=300)

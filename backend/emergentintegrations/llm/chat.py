from typing import Optional, List, Any
from pydantic import BaseModel
import os


class UserMessage:
    def __init__(self, text: str = "", content: str = ""):
        self.text = text or content
        self.content = text or content


class LlmChat:
    def __init__(self, api_key: Optional[str] = None, session_id: str = "", system_message: str = "", **kwargs):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = "gpt-4o-mini"
        self.session_id = session_id
        self.system_message = system_message
        self.messages = []
        if system_message:
            self.messages.append({"role": "system", "content": system_message})

    def with_model(self, provider: str = "openai", model: str = "gpt-4o-mini"):
        model_map = {
            "gpt-5.2": "gpt-4o-mini",
            "gpt-4o-mini": "gpt-4o-mini",
            "gpt-4o": "gpt-4o",
            "gpt-4": "gpt-4o-mini",
        }
        self.model = model_map.get(model, "gpt-4o-mini")
        return self

    async def send_message(self, message) -> str:
        text = message.text if hasattr(message, 'text') else str(message)
        self.messages.append({"role": "user", "content": text})

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                max_tokens=4000,
                temperature=0.7
            )
            reply = response.choices[0].message.content or ""
            self.messages.append({"role": "assistant", "content": reply})
            return reply
        except Exception as e:
            return f"AI Error: {str(e)}"

    async def chat(self, messages: List[dict], **kwargs) -> str:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=4000,
                temperature=0.7
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"AI Error: {str(e)}"

# Stub implementation for emergentintegrations.llm.chat
from typing import Optional, List, Any
from dataclasses import dataclass

@dataclass
class UserMessage:
    content: str
    
@dataclass  
class SystemMessage:
    content: str

@dataclass
class AssistantMessage:
    content: str

class LlmChat:
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4", **kwargs):
        self.api_key = api_key
        self.model = model
        self.messages = []
        
    async def send_message(self, message: str, **kwargs) -> str:
        return "AI features require emergentintegrations package. Please contact support."
    
    def add_message(self, message: Any):
        self.messages.append(message)
        
    async def chat(self, messages: List[Any] = None, **kwargs) -> str:
        return "AI features require emergentintegrations package. Please contact support."

from typing import Optional, List, Any

class LlmChat:
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4", **kwargs):
        self.api_key = api_key
        self.model = model
    
    async def chat(self, messages: List[dict], **kwargs) -> str:
        return "AI Chat requires emergentintegrations package."

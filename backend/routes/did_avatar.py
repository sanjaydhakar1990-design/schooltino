"""
D-ID Talking Avatar Integration
Creates animated talking video from static image + text/audio

Features:
- Generate lip-synced video from avatar image
- Support Hindi/English voices
- Optional feature - falls back to static image if disabled
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx
import base64
import asyncio

router = APIRouter(prefix="/did-avatar", tags=["did-avatar"])

# D-ID API Configuration
DID_API_KEY = os.environ.get("DID_API_KEY", "")
DID_API_URL = "https://api.d-id.com"

# Avatar images
AVATAR_IMAGES = {
    "mouse": "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/n5ydts5x_file_00000000791472098b8ae0c774846f1e.png",
    "male": "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/zun0ltqf_file_0000000025187209a5652c1654e41827.png",
    "female": "https://customer-assets.emergentagent.com/job_d4088fe6-03f9-44d7-9f91-cc135f9aad3b/artifacts/0xijk3by_file_00000000a4b87209bd803c4c7b66fdb1.png"
}

# Pydantic Models
class TalkingAvatarRequest(BaseModel):
    text: str
    avatar_type: str = "mouse"  # mouse, male, female
    language: str = "hi"  # hi (Hindi), en (English)
    voice_id: Optional[str] = None

class TalkingAvatarResponse(BaseModel):
    video_url: Optional[str] = None
    clip_id: Optional[str] = None
    status: str
    success: bool
    error: Optional[str] = None


def get_headers():
    """Get D-ID API headers with authentication"""
    return {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json"
    }


@router.get("/status")
async def get_did_status():
    """Check if D-ID is configured and available"""
    is_configured = bool(DID_API_KEY)
    
    if is_configured:
        # Test API connection
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{DID_API_URL}/credits",
                    headers=get_headers(),
                    timeout=10.0
                )
                if response.status_code == 200:
                    credits = response.json()
                    return {
                        "configured": True,
                        "connected": True,
                        "credits": credits,
                        "message": "D-ID API is ready"
                    }
                else:
                    return {
                        "configured": True,
                        "connected": False,
                        "message": f"D-ID API error: {response.status_code}"
                    }
        except Exception as e:
            return {
                "configured": True,
                "connected": False,
                "message": f"Connection error: {str(e)}"
            }
    
    return {
        "configured": False,
        "connected": False,
        "message": "D-ID API key not configured"
    }


@router.post("/create-clip", response_model=TalkingAvatarResponse)
async def create_talking_clip(request: TalkingAvatarRequest):
    """Create a talking avatar video clip"""
    
    if not DID_API_KEY:
        return TalkingAvatarResponse(
            status="disabled",
            success=False,
            error="D-ID not configured - using static avatar"
        )
    
    try:
        # Get avatar image URL
        image_url = AVATAR_IMAGES.get(request.avatar_type, AVATAR_IMAGES["mouse"])
        
        # Voice configuration based on language
        if request.language == "hi":
            voice_config = {
                "type": "microsoft",
                "voice_id": "hi-IN-SwaraNeural"  # Hindi female voice
            }
        else:
            voice_config = {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"  # English female voice
            }
        
        # Create clip request
        payload = {
            "source_url": image_url,
            "script": {
                "type": "text",
                "input": request.text[:500],  # Limit text length
                "provider": voice_config
            },
            "config": {
                "stitch": True,
                "result_format": "mp4"
            }
        }
        
        async with httpx.AsyncClient() as client:
            # Create the clip
            response = await client.post(
                f"{DID_API_URL}/clips",
                headers=get_headers(),
                json=payload,
                timeout=30.0
            )
            
            if response.status_code not in [200, 201]:
                error_msg = response.text
                print(f"D-ID Create Error: {response.status_code} - {error_msg}")
                return TalkingAvatarResponse(
                    status="error",
                    success=False,
                    error=f"D-ID API error: {response.status_code}"
                )
            
            result = response.json()
            clip_id = result.get("id")
            
            if not clip_id:
                return TalkingAvatarResponse(
                    status="error",
                    success=False,
                    error="No clip ID returned"
                )
            
            # Poll for completion (max 60 seconds)
            for _ in range(30):
                await asyncio.sleep(2)
                
                status_response = await client.get(
                    f"{DID_API_URL}/clips/{clip_id}",
                    headers=get_headers(),
                    timeout=10.0
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get("status")
                    
                    if status == "done":
                        video_url = status_data.get("result_url")
                        return TalkingAvatarResponse(
                            video_url=video_url,
                            clip_id=clip_id,
                            status="done",
                            success=True
                        )
                    elif status == "error":
                        return TalkingAvatarResponse(
                            clip_id=clip_id,
                            status="error",
                            success=False,
                            error=status_data.get("error", "Unknown error")
                        )
            
            # Timeout - return clip_id for later checking
            return TalkingAvatarResponse(
                clip_id=clip_id,
                status="processing",
                success=True,
                error="Video still processing - check back later"
            )
            
    except Exception as e:
        print(f"D-ID Error: {str(e)}")
        return TalkingAvatarResponse(
            status="error",
            success=False,
            error=str(e)
        )


@router.get("/clip/{clip_id}")
async def get_clip_status(clip_id: str):
    """Get status of a clip"""
    
    if not DID_API_KEY:
        raise HTTPException(status_code=400, detail="D-ID not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{DID_API_URL}/clips/{clip_id}",
                headers=get_headers(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to get clip status")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

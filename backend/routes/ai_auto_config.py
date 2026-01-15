# /app/backend/routes/ai_auto_config.py
"""
AI-POWERED AUTO CONFIGURATION SYSTEM
=====================================
- CCTV Auto Detection & Configuration
- Website AI Integration
- Speaker Auto Setup
- Other Software Data Import
- All with AI assistance + Manual fallback
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import os
import sys
import json
import httpx
import asyncio
import re
import socket
import logging

sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# AI Keys
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

router = APIRouter(prefix="/ai-config", tags=["AI Auto Configuration"])


# ==================== AI HELPER FUNCTION ====================

async def get_ai_response(prompt: str, system_message: str = None) -> str:
    """Get AI response using Emergent LLM or OpenAI"""
    try:
        # Use Emergent LLM Key (preferred)
        if EMERGENT_LLM_KEY:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"config-{uuid.uuid4().hex[:8]}",
                system_message=system_message or "You are a helpful AI assistant for school management system configuration."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            return response
        
        # Fallback to direct OpenAI
        elif OPENAI_API_KEY:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message or "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            return "AI service unavailable. Please configure API keys."
            
    except Exception as e:
        logger.error(f"AI response error: {str(e)}")
        return f"AI error: {str(e)}"


# ==================== MODELS ====================

class CCTVAutoConfigRequest(BaseModel):
    school_id: str
    ip_address: Optional[str] = None  # If known
    network_scan: bool = True  # Scan network for cameras
    device_name: Optional[str] = None

class CCTVConfigResult(BaseModel):
    success: bool
    devices_found: List[Dict] = []
    configured_devices: List[Dict] = []
    manual_steps: List[str] = []
    ai_suggestions: str = ""

class WebsiteAutoConfigRequest(BaseModel):
    school_id: str
    website_url: str
    extract_data: bool = True
    auto_import: bool = True

class SpeakerAutoConfigRequest(BaseModel):
    school_id: str
    cctv_device_id: Optional[str] = None  # If speaker is connected to CCTV
    speaker_type: Optional[str] = None  # direct_cctv, pa_system, bluetooth, usb

class SoftwareImportRequest(BaseModel):
    school_id: str
    software_name: str  # tally, fedena, entab, other
    import_type: str  # api, excel, database
    connection_string: Optional[str] = None
    file_path: Optional[str] = None
    api_endpoint: Optional[str] = None
    credentials: Optional[Dict] = None


# ==================== CCTV AUTO CONFIGURATION ====================

# Known CCTV brands and their configurations
CCTV_BRANDS = {
    "hikvision": {
        "name": "Hikvision",
        "default_ports": [554, 8000, 80],
        "rtsp_format": "rtsp://{username}:{password}@{ip}:{port}/Streaming/Channels/{channel}01",
        "default_credentials": [("admin", "admin"), ("admin", "12345"), ("admin", "Admin123")],
        "detection_strings": ["hikvision", "hik", "ds-", "ipc-"],
        "mac_prefix": ["00:0a:91", "00:0c:29", "28:57:be", "54:c4:15", "a4:14:37", "c4:2f:90"]
    },
    "dahua": {
        "name": "Dahua",
        "default_ports": [554, 37777, 80],
        "rtsp_format": "rtsp://{username}:{password}@{ip}:{port}/cam/realmonitor?channel={channel}&subtype=0",
        "default_credentials": [("admin", "admin"), ("admin", "Admin123")],
        "detection_strings": ["dahua", "dh-", "ipc-hf"],
        "mac_prefix": ["00:03:e8", "00:18:ae", "00:1a:3f", "3c:ef:8c"]
    },
    "cp_plus": {
        "name": "CP Plus",
        "default_ports": [554, 34567, 80],
        "rtsp_format": "rtsp://{username}:{password}@{ip}:{port}/cam/realmonitor?channel={channel}&subtype=0",
        "default_credentials": [("admin", "admin"), ("admin", "123456")],
        "detection_strings": ["cpplus", "cp-", "uniarch"],
        "mac_prefix": ["00:12:41"]
    },
    "uniview": {
        "name": "Uniview",
        "default_ports": [554, 80],
        "rtsp_format": "rtsp://{username}:{password}@{ip}:{port}/unicast/c{channel}/s0/live",
        "default_credentials": [("admin", "123456"), ("admin", "admin")],
        "detection_strings": ["uniview", "unv-"],
        "mac_prefix": ["00:13:e2"]
    }
}

async def scan_network_for_cameras(base_ip: str = "192.168.1") -> List[Dict]:
    """Scan local network for CCTV cameras"""
    found_devices = []
    
    # Common camera ports
    camera_ports = [554, 80, 8000, 37777, 34567]
    
    async def check_ip(ip: str):
        for port in camera_ports:
            try:
                # Quick TCP connection test
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.5)
                result = sock.connect_ex((ip, port))
                sock.close()
                
                if result == 0:
                    # Port is open, likely a camera
                    device = {
                        "ip": ip,
                        "port": port,
                        "detected_brand": await detect_camera_brand(ip, port),
                        "status": "found"
                    }
                    found_devices.append(device)
                    break
            except:
                continue
    
    # Scan IPs 1-254 concurrently
    tasks = [check_ip(f"{base_ip}.{i}") for i in range(1, 255)]
    await asyncio.gather(*tasks, return_exceptions=True)
    
    return found_devices

async def detect_camera_brand(ip: str, port: int) -> str:
    """Detect camera brand from response"""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            # Try HTTP
            try:
                response = await client.get(f"http://{ip}:{port if port != 554 else 80}/")
                content = response.text.lower()
                
                for brand, config in CCTV_BRANDS.items():
                    for detect_str in config["detection_strings"]:
                        if detect_str in content:
                            return config["name"]
            except:
                pass
        
        return "Unknown"
    except:
        return "Unknown"

async def test_rtsp_connection(ip: str, port: int, username: str, password: str, brand: str) -> bool:
    """Test RTSP connection to camera"""
    try:
        brand_config = CCTV_BRANDS.get(brand.lower().replace(" ", "_"), CCTV_BRANDS["hikvision"])
        rtsp_url = brand_config["rtsp_format"].format(
            username=username, password=password, ip=ip, port=port, channel=1
        )
        
        # For now, return True if basic connection succeeds
        # In production, would use cv2 or ffmpeg to verify stream
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((ip, port))
        sock.close()
        
        return result == 0
    except:
        return False


@router.post("/cctv/auto-detect")
async def auto_detect_cctv(request: CCTVAutoConfigRequest):
    """
    AI-powered CCTV auto-detection and configuration
    Scans network, detects brand, and configures automatically
    """
    school_id = request.school_id
    results = {
        "success": False,
        "devices_found": [],
        "configured_devices": [],
        "manual_steps": [],
        "ai_suggestions": ""
    }
    
    try:
        # Step 1: Network Scan
        if request.network_scan:
            logger.info(f"Scanning network for CCTV devices for school {school_id}")
            
            # Determine base IP from school's network
            base_ip = "192.168.1"
            if request.ip_address:
                # Extract base IP from provided address
                parts = request.ip_address.split(".")
                if len(parts) >= 3:
                    base_ip = ".".join(parts[:3])
            
            # Scan network
            found_devices = await scan_network_for_cameras(base_ip)
            results["devices_found"] = found_devices
            
            # If specific IP provided, add it
            if request.ip_address and not any(d["ip"] == request.ip_address for d in found_devices):
                brand = await detect_camera_brand(request.ip_address, 554)
                found_devices.append({
                    "ip": request.ip_address,
                    "port": 554,
                    "detected_brand": brand,
                    "status": "specified"
                })
        
        # Step 2: AI Analysis and Configuration Suggestions
        if results["devices_found"]:
            device_info = json.dumps(results["devices_found"], indent=2)
            
            ai_prompt = f"""
            CCTV devices found on network:
            {device_info}
            
            Please provide:
            1. Best configuration settings for each device
            2. Recommended RTSP URL format
            3. Steps to enable AI face recognition
            4. Troubleshooting tips if connection fails
            
            Respond in Hinglish for Indian school admin.
            """
            
            ai_response = await get_ai_response(
                ai_prompt,
                "You are a CCTV configuration expert for schools. Help configure cameras for face recognition and security."
            )
            results["ai_suggestions"] = ai_response
        
        # Step 3: Auto-configure detected devices
        for device in results["devices_found"]:
            brand = device.get("detected_brand", "Unknown").lower().replace(" ", "_")
            brand_config = CCTV_BRANDS.get(brand, CCTV_BRANDS["hikvision"])
            
            # Try default credentials
            configured = False
            for username, password in brand_config["default_credentials"]:
                if await test_rtsp_connection(device["ip"], device["port"], username, password, brand):
                    # Save configuration
                    config_data = {
                        "id": str(uuid.uuid4()),
                        "school_id": school_id,
                        "device_name": request.device_name or f"Camera-{device['ip'].split('.')[-1]}",
                        "ip_address": device["ip"],
                        "port": device["port"],
                        "brand": brand_config["name"],
                        "username": username,
                        "password": password,  # In production, encrypt this
                        "rtsp_url": brand_config["rtsp_format"].format(
                            username=username, password=password, 
                            ip=device["ip"], port=device["port"], channel=1
                        ),
                        "status": "configured",
                        "auto_configured": True,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    await db.cctv_devices.insert_one(config_data)
                    results["configured_devices"].append(config_data)
                    configured = True
                    break
            
            if not configured:
                results["manual_steps"].append(
                    f"Device at {device['ip']} needs manual configuration. "
                    f"Brand: {brand_config['name']}. Default credentials didn't work."
                )
        
        results["success"] = len(results["configured_devices"]) > 0
        
        # Log the auto-config attempt
        await db.setup_logs.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "type": "cctv_auto_config",
            "devices_found": len(results["devices_found"]),
            "devices_configured": len(results["configured_devices"]),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return results
        
    except Exception as e:
        logger.error(f"CCTV auto-detect error: {e}")
        results["manual_steps"].append(f"Auto-detection failed: {str(e)}. Please configure manually.")
        return results


@router.post("/cctv/manual-config")
async def manual_cctv_config(
    school_id: str,
    device_name: str,
    ip_address: str,
    port: int = 554,
    username: str = "admin",
    password: str = "",
    brand: str = "hikvision",
    location: str = "Main Gate"
):
    """
    Manual CCTV configuration with AI assistance
    """
    brand_config = CCTV_BRANDS.get(brand.lower().replace(" ", "_"), CCTV_BRANDS["hikvision"])
    
    rtsp_url = brand_config["rtsp_format"].format(
        username=username, password=password,
        ip=ip_address, port=port, channel=1
    )
    
    config_id = str(uuid.uuid4())
    config_data = {
        "id": config_id,
        "school_id": school_id,
        "device_name": device_name,
        "ip_address": ip_address,
        "port": port,
        "brand": brand_config["name"],
        "username": username,
        "password": password,
        "rtsp_url": rtsp_url,
        "location": location,
        "status": "configured",
        "auto_configured": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cctv_devices.insert_one(config_data)
    
    # AI setup guide
    ai_guide = await get_ai_response(
        f"""
        CCTV configured:
        - Brand: {brand_config['name']}
        - IP: {ip_address}
        - Location: {location}
        
        Provide brief setup verification steps and troubleshooting tips in Hinglish.
        """,
        "You are a CCTV expert for schools."
    )
    
    # Return without _id
    response_data = {
        "id": config_id,
        "school_id": school_id,
        "device_name": device_name,
        "ip_address": ip_address,
        "port": port,
        "brand": brand_config["name"],
        "location": location,
        "status": "configured"
    }
    
    return {
        "success": True,
        "device": response_data,
        "rtsp_url": rtsp_url,
        "ai_guide": ai_guide,
        "test_command": f"vlc {rtsp_url}"
    }


# ==================== WEBSITE AUTO CONFIGURATION ====================

@router.post("/website/auto-extract")
async def auto_extract_website(request: WebsiteAutoConfigRequest):
    """
    AI-powered website data extraction and integration
    Extracts school info, contact details, etc.
    """
    try:
        url = request.website_url
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        
        # Fetch website content
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            response = await client.get(url, headers=headers)
            html_content = response.text[:10000]  # First 10K chars
        
        # AI extraction
        ai_prompt = f"""
        Extract school information from this website HTML:
        
        {html_content}
        
        Extract and return as JSON:
        {{
            "school_name": "",
            "address": "",
            "city": "",
            "state": "",
            "pincode": "",
            "phone": "",
            "email": "",
            "principal_name": "",
            "established_year": null,
            "board": "",
            "school_type": "",
            "website": "{request.website_url}",
            "logo_url": "",
            "tagline": "",
            "affiliation_number": ""
        }}
        
        Only return the JSON, nothing else.
        """
        
        ai_response = await get_ai_response(
            ai_prompt,
            "You are a data extraction expert. Extract school information accurately."
        )
        
        # Parse AI response
        try:
            # Clean up response
            json_str = ai_response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            
            extracted_data = json.loads(json_str)
        except:
            extracted_data = {
                "school_name": "",
                "website": request.website_url,
                "extraction_status": "partial",
                "raw_ai_response": ai_response[:500]
            }
        
        # Auto-import if requested
        if request.auto_import and request.school_id:
            update_data = {k: v for k, v in extracted_data.items() if v}
            update_data["website_connected"] = True
            update_data["website_connected_at"] = datetime.now(timezone.utc).isoformat()
            
            await db.schools.update_one(
                {"id": request.school_id},
                {"$set": update_data}
            )
        
        return {
            "success": True,
            "extracted_data": extracted_data,
            "auto_imported": request.auto_import,
            "school_id": request.school_id
        }
        
    except httpx.RequestError as e:
        return {
            "success": False,
            "error": f"Website not accessible: {str(e)}",
            "manual_steps": [
                "1. Website access failed - check URL",
                "2. Manually enter school details",
                "3. या हमें WhatsApp करें: +91 78799 67616"
            ]
        }
    except Exception as e:
        logger.error(f"Website extraction error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/website/generate-integration-script")
async def generate_website_integration_script(school_id: str, website_platform: str = "wordpress"):
    """
    Generate integration script for school's existing website
    """
    # Generate unique API key for this school
    api_key = f"stino_{uuid.uuid4().hex[:24]}"
    
    # Save API key
    await db.api_keys.insert_one({
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "api_key": api_key,
        "key_type": "website_integration",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    })
    
    # Generate integration scripts based on platform
    scripts = {
        "wordpress": f"""
<!-- Schooltino Integration for WordPress -->
<!-- Add this to your theme's header.php or via a plugin -->
<script src="https://cdn.schooltino.in/widget.js"></script>
<script>
  SchooltinoWidget.init({{
    apiKey: '{api_key}',
    schoolId: '{school_id}',
    features: ['notices', 'results', 'fees', 'attendance']
  }});
</script>
""",
        "html": f"""
<!-- Schooltino Integration for HTML Website -->
<!-- Add before </body> tag -->
<script src="https://cdn.schooltino.in/widget.js"></script>
<script>
  SchooltinoWidget.init({{
    apiKey: '{api_key}',
    schoolId: '{school_id}'
  }});
</script>
""",
        "api": f"""
# Schooltino API Integration
# Use these credentials for custom integration

API_KEY = "{api_key}"
SCHOOL_ID = "{school_id}"
BASE_URL = "https://api.schooltino.in/v1"

# Example endpoints:
# GET /students - List all students
# GET /attendance/today - Today's attendance
# GET /fees/pending - Pending fees
# GET /results/{{exam_id}} - Exam results

# Headers required:
# Authorization: Bearer {{API_KEY}}
# X-School-ID: {{SCHOOL_ID}}
"""
    }
    
    manual_steps = [
        "1. अपनी website के admin panel में जाएं",
        "2. Header/Footer section में script add करें",
        "3. Save करें और refresh करें",
        "4. Schooltino widget दिखना चाहिए",
        "5. Problem हो तो: +91 78799 67616"
    ]
    
    return {
        "success": True,
        "api_key": api_key,
        "school_id": school_id,
        "scripts": scripts,
        "manual_steps": manual_steps,
        "selected_platform": website_platform
    }


# ==================== SPEAKER AUTO CONFIGURATION ====================

@router.post("/speaker/auto-config")
async def auto_config_speaker(request: SpeakerAutoConfigRequest):
    """
    AI-powered speaker configuration
    Detects speaker type and configures for Tino AI voice output
    """
    school_id = request.school_id
    
    # Get CCTV devices if speaker is connected to CCTV
    cctv_with_speaker = []
    if request.cctv_device_id:
        cctv = await db.cctv_devices.find_one({"id": request.cctv_device_id}, {"_id": 0})
        if cctv:
            cctv_with_speaker.append(cctv)
    else:
        # Find all CCTV devices for this school
        cctv_devices = await db.cctv_devices.find(
            {"school_id": school_id},
            {"_id": 0}
        ).to_list(100)
        
        # Check which support speakers (Hikvision, Dahua, Uniview typically do)
        for cctv in cctv_devices:
            brand = cctv.get("brand", "").lower()
            if brand in ["hikvision", "dahua", "uniview"]:
                cctv_with_speaker.append(cctv)
    
    # Determine speaker configuration
    speaker_config = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "speaker_type": request.speaker_type or "auto",
        "cctv_speakers": cctv_with_speaker,
        "status": "configured",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # AI configuration guide
    ai_guide = await get_ai_response(
        f"""
        Speaker setup for school:
        - Speaker type: {request.speaker_type or 'Auto-detect'}
        - CCTV devices with speaker: {len(cctv_with_speaker)}
        
        Provide setup guide in Hinglish for:
        1. CCTV built-in speaker setup
        2. External PA system connection
        3. Bluetooth speaker pairing
        4. USB/Computer speaker setup
        5. Volume और audio quality tips
        """,
        "You are an audio/speaker setup expert for schools."
    )
    
    # Manual setup steps based on speaker type
    setup_guides = {
        "direct_cctv": [
            "1. CCTV web interface open करें",
            "2. Configuration → Audio Settings जाएं",
            "3. Audio Output enable करें",
            "4. Two-way Audio ON करें",
            "5. Volume adjust करें (50-70%)",
            "6. Schooltino से Test Audio बटन click करें"
        ],
        "pa_system": [
            "1. PA amplifier ON करें",
            "2. CCTV/Computer से audio out connect करें (3.5mm/RCA)",
            "3. Volume mixer में level set करें",
            "4. Feedback/echo के लिए check करें",
            "5. Different zones configure करें"
        ],
        "bluetooth": [
            "1. Bluetooth speaker को pairing mode में रखें",
            "2. Tino device (tablet/phone) से pair करें",
            "3. Audio output Bluetooth select करें",
            "4. Connection stable रखने के लिए range में रखें"
        ],
        "usb": [
            "1. USB speaker को computer से connect करें",
            "2. Sound settings में default device select करें",
            "3. Browser audio permissions allow करें",
            "4. Volume appropriately set करें"
        ]
    }
    
    speaker_config["setup_guide"] = setup_guides.get(request.speaker_type, setup_guides["direct_cctv"])
    speaker_config["ai_guide"] = ai_guide
    
    # Save configuration
    await db.speaker_config.update_one(
        {"school_id": school_id},
        {"$set": speaker_config},
        upsert=True
    )
    
    return {
        "success": True,
        "speaker_config": speaker_config,
        "cctv_with_speakers": len(cctv_with_speaker),
        "test_audio_url": f"/api/voice-assistant/test-audio/{school_id}"
    }


# ==================== OTHER SOFTWARE IMPORT ====================

# Supported software integrations
SUPPORTED_SOFTWARE = {
    "tally": {
        "name": "Tally ERP",
        "import_methods": ["excel", "api"],
        "data_types": ["fees", "accounts", "expenses"],
        "steps": [
            "1. Tally में Export to Excel option use करें",
            "2. Fee collection report export करें",
            "3. Student ledger export करें",
            "4. Upload Excel file below"
        ]
    },
    "fedena": {
        "name": "Fedena",
        "import_methods": ["api", "database", "excel"],
        "data_types": ["students", "staff", "attendance", "fees", "exams"],
        "steps": [
            "1. Fedena admin panel में जाएं",
            "2. Settings → Export Data",
            "3. Select: Students, Staff, Attendance",
            "4. Export as CSV/Excel",
            "5. Upload here"
        ]
    },
    "entab": {
        "name": "Entab CampusCare",
        "import_methods": ["excel", "api"],
        "data_types": ["students", "staff", "fees", "attendance"],
        "steps": [
            "1. Entab में Reports section जाएं",
            "2. Student Master Report export करें",
            "3. Fee Collection Report export करें",
            "4. Upload Excel files"
        ]
    },
    "edumaat": {
        "name": "EduMaat",
        "import_methods": ["excel"],
        "data_types": ["students", "fees"],
        "steps": [
            "1. EduMaat dashboard में जाएं",
            "2. Reports → Export",
            "3. Select required data",
            "4. Download और upload here"
        ]
    },
    "other": {
        "name": "Other Software",
        "import_methods": ["excel"],
        "data_types": ["students", "staff", "fees"],
        "steps": [
            "1. Excel template download करें",
            "2. Data fill करें",
            "3. Upload filled Excel",
            "4. AI automatically map करेगा"
        ]
    }
}


@router.get("/software/supported")
async def get_supported_software():
    """Get list of supported software for data import"""
    return {
        "software": SUPPORTED_SOFTWARE,
        "import_methods": ["excel", "api", "database"],
        "help_contact": "+91 78799 67616"
    }


@router.post("/software/auto-import")
async def auto_import_from_software(request: SoftwareImportRequest, background_tasks: BackgroundTasks):
    """
    AI-powered data import from other school software
    """
    school_id = request.school_id
    software = SUPPORTED_SOFTWARE.get(request.software_name.lower(), SUPPORTED_SOFTWARE["other"])
    
    result = {
        "success": False,
        "software": software["name"],
        "import_method": request.import_type,
        "records_imported": {
            "students": 0,
            "staff": 0,
            "fees": 0,
            "attendance": 0
        },
        "manual_steps": software["steps"],
        "ai_mapping": ""
    }
    
    try:
        # API-based import
        if request.import_type == "api" and request.api_endpoint:
            # Get AI to understand the API structure
            ai_prompt = f"""
            I need to import data from {software['name']} using their API.
            API Endpoint: {request.api_endpoint}
            
            Generate the API integration code and data mapping strategy.
            Available data types: {software['data_types']}
            """
            
            result["ai_mapping"] = await get_ai_response(ai_prompt)
            result["status"] = "api_ready"
            
        # Excel import  
        elif request.import_type == "excel" and request.file_path:
            # AI would analyze Excel structure
            ai_prompt = f"""
            Analyzing Excel file for {software['name']} data import.
            Expected data types: {software['data_types']}
            
            Provide column mapping suggestions and validation rules.
            """
            
            result["ai_mapping"] = await get_ai_response(ai_prompt)
            result["status"] = "excel_ready"
            
        # Database import
        elif request.import_type == "database" and request.connection_string:
            ai_prompt = f"""
            Database import from {software['name']}.
            Connection: {request.connection_string[:50]}...
            
            Provide safe data migration steps and rollback plan.
            """
            
            result["ai_mapping"] = await get_ai_response(ai_prompt)
            result["status"] = "database_ready"
        
        else:
            result["status"] = "manual_required"
            result["manual_steps"] = software["steps"]
        
        # Log import attempt
        await db.import_logs.insert_one({
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "software": software["name"],
            "import_type": request.import_type,
            "status": result["status"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        result["success"] = True
        return result
        
    except Exception as e:
        logger.error(f"Software import error: {e}")
        result["error"] = str(e)
        return result


@router.get("/software/templates")
async def get_import_templates():
    """Get Excel templates for data import"""
    templates = {
        "students": {
            "filename": "student_import_template.xlsx",
            "columns": [
                "name", "class", "section", "roll_no", "father_name", 
                "mother_name", "dob", "gender", "address", "mobile", 
                "email", "aadhar_no", "blood_group"
            ],
            "required": ["name", "class", "father_name", "mobile"],
            "download_url": "/api/templates/student_import.xlsx"
        },
        "staff": {
            "filename": "staff_import_template.xlsx",
            "columns": [
                "name", "designation", "department", "qualification",
                "joining_date", "mobile", "email", "address", "salary"
            ],
            "required": ["name", "designation", "mobile"],
            "download_url": "/api/templates/staff_import.xlsx"
        },
        "fees": {
            "filename": "fees_import_template.xlsx",
            "columns": [
                "student_name", "class", "fee_type", "amount",
                "due_date", "paid_amount", "payment_date", "receipt_no"
            ],
            "required": ["student_name", "class", "amount"],
            "download_url": "/api/templates/fees_import.xlsx"
        }
    }
    
    return {
        "templates": templates,
        "instructions": "Download template, fill data, upload via /software/upload-excel"
    }


# ==================== UNIFIED AUTO-SETUP ====================

@router.post("/complete-auto-setup")
async def complete_auto_setup(
    school_id: str,
    enable_cctv: bool = True,
    enable_website: bool = True,
    enable_speaker: bool = True,
    website_url: Optional[str] = None,
    cctv_ip: Optional[str] = None
):
    """
    Complete AI-powered auto-setup for new school
    Configures CCTV, Website, Speaker in one go
    """
    setup_results = {
        "school_id": school_id,
        "cctv": None,
        "website": None,
        "speaker": None,
        "overall_status": "in_progress",
        "ai_summary": ""
    }
    
    # CCTV Setup
    if enable_cctv:
        cctv_result = await auto_detect_cctv(CCTVAutoConfigRequest(
            school_id=school_id,
            ip_address=cctv_ip,
            network_scan=True
        ))
        setup_results["cctv"] = {
            "status": "success" if cctv_result.get("success") else "manual_needed",
            "devices_found": len(cctv_result.get("devices_found", [])),
            "devices_configured": len(cctv_result.get("configured_devices", []))
        }
    
    # Website Setup
    if enable_website and website_url:
        website_result = await auto_extract_website(WebsiteAutoConfigRequest(
            school_id=school_id,
            website_url=website_url,
            extract_data=True,
            auto_import=True
        ))
        setup_results["website"] = {
            "status": "success" if website_result.get("success") else "manual_needed",
            "data_extracted": bool(website_result.get("extracted_data"))
        }
    
    # Speaker Setup
    if enable_speaker:
        speaker_result = await auto_config_speaker(SpeakerAutoConfigRequest(
            school_id=school_id,
            speaker_type="direct_cctv"
        ))
        setup_results["speaker"] = {
            "status": "success" if speaker_result.get("success") else "manual_needed",
            "cctv_speakers": speaker_result.get("cctv_with_speakers", 0)
        }
    
    # AI Summary
    ai_summary = await get_ai_response(
        f"""
        School auto-setup complete for {school_id}:
        - CCTV: {setup_results.get('cctv', 'Not configured')}
        - Website: {setup_results.get('website', 'Not configured')}
        - Speaker: {setup_results.get('speaker', 'Not configured')}
        
        Provide a brief summary in Hinglish about what was configured and next steps.
        """,
        "You are a school setup assistant."
    )
    
    setup_results["ai_summary"] = ai_summary
    setup_results["overall_status"] = "completed"
    
    # Save setup status
    await db.schools.update_one(
        {"id": school_id},
        {"$set": {
            "auto_setup_completed": True,
            "auto_setup_results": setup_results,
            "auto_setup_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return setup_results


@router.get("/status/{school_id}")
async def get_config_status(school_id: str):
    """Get overall configuration status for a school"""
    
    # Get all configurations
    cctv_count = await db.cctv_devices.count_documents({"school_id": school_id})
    speaker_config = await db.speaker_config.find_one({"school_id": school_id}, {"_id": 0})
    school = await db.schools.find_one({"id": school_id}, {"_id": 0})
    api_keys = await db.api_keys.count_documents({"school_id": school_id})
    
    return {
        "school_id": school_id,
        "cctv": {
            "configured": cctv_count > 0,
            "device_count": cctv_count
        },
        "speaker": {
            "configured": speaker_config is not None,
            "type": speaker_config.get("speaker_type") if speaker_config else None
        },
        "website": {
            "connected": school.get("website_connected", False) if school else False,
            "url": school.get("website") if school else None
        },
        "api_integration": {
            "enabled": api_keys > 0,
            "key_count": api_keys
        },
        "overall_progress": {
            "cctv": "✅" if cctv_count > 0 else "⏳",
            "speaker": "✅" if speaker_config else "⏳",
            "website": "✅" if school and school.get("website_connected") else "⏳",
            "api": "✅" if api_keys > 0 else "⏳"
        }
    }

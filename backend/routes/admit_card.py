"""
ADMIT CARD SYSTEM
- Generate admit cards for any class/exam
- Fee verification before download
- Admin configurable minimum fee percentage
- Digital signature and seal support
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, date
import uuid
import os
import sys

sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
db_client = AsyncIOMotorClient(mongo_url)
db = db_client[db_name]

def get_database():
    return db

router = APIRouter(prefix="/admit-card", tags=["Admit Card"])

# ============== MODELS ==============

class AdmitCardSettings(BaseModel):
    school_id: str
    # Fee requirements
    fee_requirement_type: str = "percentage"  # "all_clear", "percentage", "no_requirement"
    min_fee_percentage: float = 30.0  # Minimum fee percentage if type is "percentage"
    require_fee_clearance: bool = True
    # Display settings
    show_photo: bool = True
    show_signature: bool = True
    show_seal: bool = True
    signature_authority: str = "director"  # director, principal, class_teacher
    seal_image_url: Optional[str] = None
    signature_image_url: Optional[str] = None
    # StudyTino integration
    enable_studytino_download: bool = True
    enable_online_payment: bool = True
    # Download deadline
    fee_deadline: Optional[str] = None  # After this date, all can download
    auto_activate_after_deadline: bool = False

class ExamCreate(BaseModel):
    school_id: str
    exam_name: str  # "Half Yearly", "Annual", "Unit Test 1"
    exam_type: str  # half_yearly, annual, unit_test, quarterly
    start_date: str
    end_date: str
    classes: List[str]  # ["Class 10-A", "Class 10-B"]
    subjects: Optional[List[Dict]] = None  # [{subject, date, time}]
    instructions: Optional[List[str]] = None
    created_by: str
    exam_category: Optional[str] = "school"  # school or board
    venue: Optional[str] = None

class AdmitCardRequest(BaseModel):
    school_id: str
    exam_id: str
    student_id: str
    
class BulkAdmitCardRequest(BaseModel):
    school_id: str
    exam_id: str
    class_id: str

class FeePaymentForAdmitCard(BaseModel):
    school_id: str
    student_id: str
    exam_id: str
    amount: float
    payment_method: str = "online"

class AdminActivateDownload(BaseModel):
    school_id: str
    student_id: str
    exam_id: str
    activated_by: str
    reason: str  # Why admin is manually activating

# ============== CLASS-WISE DATA ==============

# Default subjects for each class level
CLASS_SUBJECTS = {
    "nursery": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Maths (गणित)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "drawing", "name": "Drawing (चित्रकला)"}
    ],
    "lkg": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Maths (गणित)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "drawing", "name": "Drawing (चित्रकला)"},
        {"id": "rhymes", "name": "Rhymes (कविता)"}
    ],
    "ukg": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Maths (गणित)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "drawing", "name": "Drawing (चित्रकला)"},
        {"id": "evs", "name": "EVS (पर्यावरण)"}
    ],
    "class_1": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "evs", "name": "EVS (पर्यावरण)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "drawing", "name": "Drawing (चित्रकला)"}
    ],
    "class_2": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "evs", "name": "EVS (पर्यावरण)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_3": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "evs", "name": "EVS (पर्यावरण)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_4": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "evs", "name": "EVS (पर्यावरण)"},
        {"id": "gk", "name": "General Knowledge (सामान्य ज्ञान)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_5": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"}
    ],
    "class_6": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_7": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_8": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"},
        {"id": "computer", "name": "Computer (कंप्यूटर)"}
    ],
    "class_9": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "it", "name": "Information Technology (IT)"}
    ],
    "class_10": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "social", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "it", "name": "Information Technology (IT)"}
    ],
    "class_11_science": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "physics", "name": "Physics (भौतिकी)"},
        {"id": "chemistry", "name": "Chemistry (रसायन)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "biology", "name": "Biology (जीव विज्ञान)"},
        {"id": "computer", "name": "Computer Science (कंप्यूटर)"}
    ],
    "class_11_commerce": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "accounts", "name": "Accountancy (लेखाशास्त्र)"},
        {"id": "business", "name": "Business Studies (व्यवसाय अध्ययन)"},
        {"id": "economics", "name": "Economics (अर्थशास्त्र)"},
        {"id": "maths", "name": "Mathematics (गणित)"}
    ],
    "class_11_arts": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "history", "name": "History (इतिहास)"},
        {"id": "geography", "name": "Geography (भूगोल)"},
        {"id": "political", "name": "Political Science (राजनीति विज्ञान)"}
    ],
    "class_12_science": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "physics", "name": "Physics (भौतिकी)"},
        {"id": "chemistry", "name": "Chemistry (रसायन)"},
        {"id": "maths", "name": "Mathematics (गणित)"},
        {"id": "biology", "name": "Biology (जीव विज्ञान)"},
        {"id": "computer", "name": "Computer Science (कंप्यूटर)"}
    ],
    "class_12_commerce": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "accounts", "name": "Accountancy (लेखाशास्त्र)"},
        {"id": "business", "name": "Business Studies (व्यवसाय अध्ययन)"},
        {"id": "economics", "name": "Economics (अर्थशास्त्र)"},
        {"id": "maths", "name": "Mathematics (गणित)"}
    ],
    "class_12_arts": [
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "hindi", "name": "Hindi (हिंदी)"},
        {"id": "history", "name": "History (इतिहास)"},
        {"id": "geography", "name": "Geography (भूगोल)"},
        {"id": "political", "name": "Political Science (राजनीति विज्ञान)"}
    ]
}

# Default instructions for each class level
CLASS_INSTRUCTIONS = {
    "primary": [  # Nursery to Class 2
        "विद्यार्थी को अपने अभिभावक के साथ समय पर परीक्षा केंद्र पहुंचना होगा।",
        "प्रवेश पत्र अनिवार्य है। बिना प्रवेश पत्र के परीक्षा में बैठने नहीं दिया जाएगा।",
        "अपनी पेंसिल, रबड़ और शार्पनर स्वयं लाएं।",
        "परीक्षा के दौरान शांति बनाए रखें।",
        "परीक्षा समाप्त होने के बाद ही कक्ष छोड़ें।"
    ],
    "middle": [  # Class 3 to 5
        "विद्यार्थी को परीक्षा से 15 मिनट पहले उपस्थित होना अनिवार्य है।",
        "प्रवेश पत्र अनिवार्य है। बिना प्रवेश पत्र के परीक्षा में बैठने नहीं दिया जाएगा।",
        "अपनी लेखन सामग्री (पेन, पेंसिल, रबड़, स्केल) स्वयं लाएं।",
        "परीक्षा कक्ष में किसी भी प्रकार का इलेक्ट्रॉनिक उपकरण लाना वर्जित है।",
        "नकल करना सख्त मना है। पकड़े जाने पर परीक्षा रद्द की जाएगी।",
        "परीक्षा समाप्त होने के बाद ही कक्ष छोड़ें।"
    ],
    "secondary": [  # Class 6 to 8
        "विद्यार्थी को परीक्षा से 20 मिनट पहले उपस्थित होना अनिवार्य है।",
        "प्रवेश पत्र और स्कूल ID कार्ड अनिवार्य है।",
        "अपनी लेखन सामग्री (नीला/काला पेन, पेंसिल, रबड़, स्केल, जियोमेट्री बॉक्स) स्वयं लाएं।",
        "मोबाइल फोन, स्मार्ट वॉच या कोई भी इलेक्ट्रॉनिक उपकरण लाना सख्त मना है।",
        "नकल करना या करवाना दोनों अपराध है। पकड़े जाने पर परीक्षा रद्द और अनुशासनात्मक कार्रवाई होगी।",
        "उत्तर पुस्तिका पर सही जानकारी भरें। गलत जानकारी पर परीक्षा रद्द हो सकती है।",
        "परीक्षा के दौरान कक्ष छोड़ना वर्जित है।"
    ],
    "high": [  # Class 9 to 10
        "विद्यार्थी को परीक्षा से 30 मिनट पहले उपस्थित होना अनिवार्य है।",
        "प्रवेश पत्र और स्कूल ID कार्ड दोनों अनिवार्य हैं।",
        "केवल नीले या काले बॉलपॉइंट पेन का प्रयोग करें। जेल पेन वर्जित है।",
        "मोबाइल फोन, स्मार्ट वॉच, कैलकुलेटर या कोई भी इलेक्ट्रॉनिक उपकरण लाना सख्त मना है।",
        "नकल करने पर परीक्षा तुरंत रद्द और भविष्य की परीक्षाओं से वंचित किया जाएगा।",
        "उत्तर पुस्तिका पर रोल नंबर और विषय कोड सही भरें।",
        "प्रश्न पत्र मिलने के बाद पहले 15 मिनट पढ़ने के लिए हैं।",
        "परीक्षा समाप्त होने तक कक्ष में ही रहें।",
        "Board परीक्षा की तैयारी के लिए यह internal परीक्षा महत्वपूर्ण है।"
    ],
    "senior": [  # Class 11 to 12
        "विद्यार्थी को परीक्षा से 30 मिनट पहले अपने निर्धारित केंद्र पर उपस्थित होना अनिवार्य है।",
        "प्रवेश पत्र, स्कूल ID कार्ड और आधार कार्ड अनिवार्य हैं।",
        "केवल नीले या काले बॉलपॉइंट पेन का प्रयोग करें।",
        "मोबाइल फोन, स्मार्ट वॉच, ब्लूटूथ डिवाइस या कोई भी इलेक्ट्रॉनिक उपकरण लाना सख्त मना है।",
        "नकल या अनुचित साधनों का प्रयोग करने पर परीक्षा रद्द और Board को रिपोर्ट किया जाएगा।",
        "उत्तर पुस्तिका पर सभी details सावधानी से भरें।",
        "प्रश्न पत्र मिलने के बाद पहले 15 मिनट पढ़ने के लिए हैं। इस दौरान लिखना मना है।",
        "गणित परीक्षा में logarithm table की अनुमति है (यदि applicable)।",
        "परीक्षा समाप्त होने पर उत्तर पुस्तिका निरीक्षक को देकर ही जाएं।",
        "यह परीक्षा आपके Board परीक्षा के internal marks में शामिल होगी।"
    ]
}

# ============== HELPER FUNCTIONS ==============

async def get_student_fee_status(student_id: str, school_id: str, db) -> Dict:
    """Get student's fee status for admit card eligibility"""
    
    # Get total fees for student
    fee_records = await db.fee_records.find({
        "student_id": student_id,
        "school_id": school_id,
        "academic_year": str(date.today().year)
    }).to_list(100)
    
    total_fee = sum(f.get("amount", 0) for f in fee_records)
    paid_fee = sum(f.get("paid_amount", 0) for f in fee_records)
    pending_fee = total_fee - paid_fee
    
    paid_percentage = (paid_fee / total_fee * 100) if total_fee > 0 else 100
    
    return {
        "total_fee": total_fee,
        "paid_fee": paid_fee,
        "pending_fee": pending_fee,
        "paid_percentage": round(paid_percentage, 1)
    }

async def check_admit_card_eligibility(student_id: str, school_id: str, exam_id: str, db) -> Dict:
    """Check if student is eligible for admit card download - Enhanced with multiple options"""
    
    # Get admit card settings
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    
    # Default settings
    fee_requirement_type = settings.get("fee_requirement_type", "percentage") if settings else "percentage"
    min_fee_percentage = settings.get("min_fee_percentage", 30) if settings else 30
    require_fee = settings.get("require_fee_clearance", True) if settings else True
    fee_deadline = settings.get("fee_deadline") if settings else None
    auto_activate = settings.get("auto_activate_after_deadline", False) if settings else False
    
    # Check if admin has manually activated this student's download
    manual_activation = await db.admit_card_activations.find_one({
        "student_id": student_id,
        "exam_id": exam_id,
        "school_id": school_id
    })
    
    if manual_activation:
        return {
            "eligible": True,
            "reason": f"Admin द्वारा activate किया गया: {manual_activation.get('reason', 'Manual activation')}",
            "activated_by": manual_activation.get("activated_by"),
            "activation_type": "manual",
            "min_amount": 0
        }
    
    # Check if deadline passed and auto-activate is enabled
    if fee_deadline and auto_activate:
        try:
            deadline_date = date.fromisoformat(fee_deadline)
            if date.today() >= deadline_date:
                return {
                    "eligible": True,
                    "reason": f"Fee deadline ({fee_deadline}) के बाद auto-activated",
                    "activation_type": "deadline",
                    "min_amount": 0
                }
        except:
            pass
    
    # If fee requirement is disabled
    if not require_fee or fee_requirement_type == "no_requirement":
        return {"eligible": True, "reason": "Fee clearance not required", "min_amount": 0, "activation_type": "no_fee_required"}
    
    # Get fee status
    fee_status = await get_student_fee_status(student_id, school_id, db)
    
    # Check based on fee requirement type
    if fee_requirement_type == "all_clear":
        # All dues must be cleared
        if fee_status["pending_fee"] <= 0:
            return {
                "eligible": True,
                "reason": "All dues cleared ✅",
                "fee_status": fee_status,
                "min_amount": 0,
                "activation_type": "fee_cleared"
            }
        else:
            return {
                "eligible": False,
                "reason": f"सभी बकाया राशि (₹{fee_status['pending_fee']}) जमा करना आवश्यक है।",
                "fee_status": fee_status,
                "min_amount": fee_status["pending_fee"],
                "requirement_type": "all_clear",
                "payment_options": {
                    "online": True,
                    "cash": True,
                    "payment_link": f"/studytino/pay?student={student_id}&amount={fee_status['pending_fee']}"
                }
            }
    else:
        # Percentage based
        if fee_status["paid_percentage"] >= min_fee_percentage:
            return {
                "eligible": True,
                "reason": f"Fee clearance OK ({fee_status['paid_percentage']}% paid)",
                "fee_status": fee_status,
                "min_amount": 0,
                "activation_type": "fee_percentage"
            }
        else:
            # Calculate minimum amount needed
            total_fee = fee_status["total_fee"]
            required_amount = (total_fee * min_fee_percentage / 100) - fee_status["paid_fee"]
            required_amount = max(0, required_amount)
            
            return {
                "eligible": False,
                "reason": f"कम से कम {min_fee_percentage}% fee जमा करें। अभी {fee_status['paid_percentage']}% paid है।",
                "fee_status": fee_status,
                "min_amount": round(required_amount, 2),
                "min_percentage": min_fee_percentage,
                "requirement_type": "percentage",
                "payment_options": {
                    "online": True,
                    "cash": True,
                    "payment_link": f"/studytino/pay?student={student_id}&amount={round(required_amount, 2)}"
                }
            }

async def generate_admit_card_data(student_id: str, exam_id: str, school_id: str, db) -> Dict:
    """Generate admit card data for a student"""
    
    # Get student info
    student = await db.students.find_one({"id": student_id, "school_id": school_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get exam info
    exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Get school info
    school = await db.schools.find_one({"id": school_id})
    
    # Get class info
    class_info = await db.classes.find_one({"id": student.get("class_id")})
    
    # Get admit card settings
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    
    # Generate roll number if not exists
    roll_no = student.get("roll_no") or student.get("admission_no") or student_id[:8].upper()
    
    admit_card = {
        "id": str(uuid.uuid4()),
        "admit_card_no": f"AC-{exam_id[:4].upper()}-{student_id[:6].upper()}",
        "school": {
            "name": school.get("name", "School") if school else "School",
            "address": school.get("address", "") if school else "",
            "logo_url": school.get("logo_url") if school else None,
            "phone": school.get("phone", "") if school else ""
        },
        "student": {
            "id": student_id,
            "name": student.get("name", ""),
            "father_name": student.get("father_name", ""),
            "mother_name": student.get("mother_name", ""),
            "roll_no": roll_no,
            "class": class_info.get("name", student.get("class_id")) if class_info else student.get("class_id"),
            "section": student.get("section", ""),
            "photo_url": student.get("photo_url"),
            "dob": student.get("dob", "")
        },
        "exam": {
            "id": exam_id,
            "name": exam.get("exam_name", ""),
            "type": exam.get("exam_type", ""),
            "start_date": exam.get("start_date", ""),
            "end_date": exam.get("end_date", ""),
            "subjects": exam.get("subjects", []),
            "instructions": exam.get("instructions", [
                "विद्यार्थी को परीक्षा से 15 मिनट पहले उपस्थित होना अनिवार्य है।",
                "प्रवेश पत्र के बिना परीक्षा में बैठने की अनुमति नहीं होगी।",
                "परीक्षा कक्ष में मोबाइल फोन ले जाना वर्जित है।",
                "अपना लेखन सामग्री स्वयं लाएं।"
            ])
        },
        "signature": {
            "authority": settings.get("signature_authority", "director") if settings else "director",
            "image_url": settings.get("signature_image_url") if settings else None
        },
        "seal": {
            "image_url": settings.get("seal_image_url") if settings else None
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "valid_until": exam.get("end_date", ""),
        "school_id": school_id,
        "qr_data": {
            "type": "admit_card",
            "admit_card_no": f"AC-{exam_id[:4].upper()}-{student_id[:6].upper()}",
            "student_id": student_id,
            "exam_id": exam_id,
            "school_id": school_id,
            "student_name": student.get("name", ""),
            "roll_no": roll_no,
            "exam_name": exam.get("exam_name", ""),
            "valid_until": exam.get("end_date", ""),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    return admit_card

# ============== API ENDPOINTS ==============

@router.get("/settings/{school_id}")
async def get_admit_card_settings(school_id: str):
    """Get admit card settings for school"""
    db = get_database()
    settings = await db.admit_card_settings.find_one({"school_id": school_id})
    
    if not settings:
        # Return defaults
        return {
            "school_id": school_id,
            "min_fee_percentage": 30,
            "require_fee_clearance": True,
            "show_photo": True,
            "show_signature": True,
            "show_seal": True,
            "signature_authority": "director"
        }
    
    settings.pop("_id", None)
    return settings

@router.post("/settings")
async def save_admit_card_settings(settings: AdmitCardSettings):
    """Save admit card settings for school"""
    db = get_database()
    
    settings_dict = settings.dict()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.admit_card_settings.update_one(
        {"school_id": settings.school_id},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Settings saved successfully"}

@router.post("/exam")
async def create_exam(exam: ExamCreate):
    """Create a new exam for admit card generation"""
    db = get_database()
    
    exam_dict = exam.dict()
    # Ensure exam_category is always set
    if not exam_dict.get("exam_category"):
        exam_dict["exam_category"] = "school"
    
    exam_doc = {
        "id": str(uuid.uuid4()),
        **exam_dict,
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exams.insert_one(exam_doc)
    
    return {
        "success": True,
        "exam_id": exam_doc["id"],
        "message": f"Exam '{exam.exam_name}' created successfully"
    }

@router.get("/exams/{school_id}")
async def get_exams(school_id: str, type: str = None):
    """Get all exams for a school (filter by type: school or board)"""
    db = get_database()
    
    query = {"school_id": school_id}
    if type:
        # Include exams without exam_category for backward compatibility
        # If type is 'school', include exams without category (legacy exams)
        if type == "school":
            query["$or"] = [
                {"exam_category": type},
                {"exam_category": {"$exists": False}},
                {"exam_category": None},
                {"exam_category": ""}
            ]
        else:
            # For board type, only exact match
            query["exam_category"] = type
    
    exams = await db.exams.find(query).sort("created_at", -1).to_list(50)
    
    today = date.today()
    for exam in exams:
        # Ensure id field exists
        if "id" not in exam:
            exam["id"] = str(exam.get("_id", uuid.uuid4()))
        
        exam.pop("_id", None)
        
        # Set default category if missing
        if not exam.get("exam_category"):
            exam["exam_category"] = "school"
        
        # Update status based on dates
        if exam.get("start_date") and exam.get("end_date"):
            try:
                start_date = date.fromisoformat(exam["start_date"])
                end_date = date.fromisoformat(exam["end_date"])
                
                if today < start_date:
                    exam["status"] = "upcoming"
                elif start_date <= today <= end_date:
                    exam["status"] = "ongoing"
                else:
                    exam["status"] = "completed"
            except:
                exam["status"] = "upcoming"
    
    return {"exams": exams}

@router.get("/check-eligibility/{school_id}/{exam_id}/{student_id}")
async def check_eligibility(school_id: str, exam_id: str, student_id: str):
    """Check if student is eligible for admit card download"""
    db = get_database()
    
    eligibility = await check_admit_card_eligibility(student_id, school_id, exam_id, db)
    return eligibility

@router.get("/generate/{school_id}/{exam_id}/{student_id}")
async def generate_admit_card(school_id: str, exam_id: str, student_id: str, force: bool = False):
    """Generate admit card for a student (checks fee eligibility)"""
    db = get_database()
    
    # Check eligibility unless forced (for admin)
    if not force:
        eligibility = await check_admit_card_eligibility(student_id, school_id, exam_id, db)
        if not eligibility["eligible"]:
            return {
                "success": False,
                "eligible": False,
                "message": eligibility["reason"],
                "fee_status": eligibility.get("fee_status"),
                "min_amount": eligibility.get("min_amount", 0),
                "action_required": "pay_fee"
            }
    
    # Generate admit card
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    
    # Save generated admit card
    await db.generated_admit_cards.update_one(
        {"student_id": student_id, "exam_id": exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    return {
        "success": True,
        "eligible": True,
        "admit_card": admit_card
    }

@router.post("/generate-bulk")
async def generate_bulk_admit_cards(request: BulkAdmitCardRequest):
    """Generate admit cards for entire class"""
    db = get_database()
    
    # Get all students in class
    students = await db.students.find({
        "school_id": request.school_id,
        "class_id": request.class_id,
        "is_active": True
    }).to_list(200)
    
    generated = []
    pending_fee = []
    
    for student in students:
        eligibility = await check_admit_card_eligibility(
            student["id"], request.school_id, request.exam_id, db
        )
        
        if eligibility["eligible"]:
            admit_card = await generate_admit_card_data(
                student["id"], request.exam_id, request.school_id, db
            )
            await db.generated_admit_cards.update_one(
                {"student_id": student["id"], "exam_id": request.exam_id},
                {"$set": admit_card},
                upsert=True
            )
            generated.append({
                "student_id": student["id"],
                "name": student.get("name"),
                "status": "generated"
            })
        else:
            pending_fee.append({
                "student_id": student["id"],
                "name": student.get("name"),
                "pending_amount": eligibility.get("min_amount", 0),
                "fee_status": eligibility.get("fee_status")
            })
    
    return {
        "success": True,
        "total_students": len(students),
        "generated_count": len(generated),
        "pending_fee_count": len(pending_fee),
        "generated": generated,
        "pending_fee": pending_fee
    }

@router.post("/pay-and-download")
async def pay_fee_and_download(payment: FeePaymentForAdmitCard):
    """Pay minimum fee and download admit card"""
    db = get_database()
    
    # Record payment
    payment_record = {
        "id": str(uuid.uuid4()),
        "school_id": payment.school_id,
        "student_id": payment.student_id,
        "amount": payment.amount,
        "payment_type": "admit_card_fee",
        "exam_id": payment.exam_id,
        "payment_method": payment.payment_method,
        "status": "completed",
        "paid_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.fee_payments.insert_one(payment_record)
    
    # Update fee record
    await db.fee_records.update_one(
        {"student_id": payment.student_id, "school_id": payment.school_id},
        {"$inc": {"paid_amount": payment.amount}},
        upsert=True
    )
    
    # Now generate admit card
    admit_card = await generate_admit_card_data(
        payment.student_id, payment.exam_id, payment.school_id, db
    )
    
    await db.generated_admit_cards.update_one(
        {"student_id": payment.student_id, "exam_id": payment.exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    return {
        "success": True,
        "payment_id": payment_record["id"],
        "admit_card": admit_card,
        "message": "Payment successful! Admit card generated."
    }

@router.get("/student/{school_id}/{student_id}")
async def get_student_admit_cards(school_id: str, student_id: str):
    """Get all admit cards for a student (for StudyTino app)"""
    db = get_database()
    
    # Get all exams for the school
    exams = await db.exams.find({
        "school_id": school_id,
        "status": {"$in": ["upcoming", "ongoing"]}
    }).to_list(20)
    
    admit_cards = []
    
    for exam in exams:
        # Check if admit card already generated
        generated = await db.generated_admit_cards.find_one({
            "student_id": student_id,
            "exam_id": exam["id"]
        })
        
        # Check eligibility
        eligibility = await check_admit_card_eligibility(student_id, school_id, exam["id"], db)
        
        admit_cards.append({
            "exam_id": exam["id"],
            "exam_name": exam.get("exam_name"),
            "exam_type": exam.get("exam_type"),
            "start_date": exam.get("start_date"),
            "end_date": exam.get("end_date"),
            "is_generated": generated is not None,
            "is_eligible": eligibility["eligible"],
            "fee_status": eligibility.get("fee_status"),
            "min_amount_required": eligibility.get("min_amount", 0) if not eligibility["eligible"] else 0,
            "admit_card": generated if generated else None
        })
    
    return {"admit_cards": admit_cards}

# ============== AI INTEGRATION ==============

async def ai_generate_admit_cards(query: str, school_id: str, db) -> Dict:
    """AI command to generate admit cards"""
    import re
    
    query_lower = query.lower()
    
    # Detect class from query
    class_match = re.search(r"class\s*(\d+)[- ]?([a-zA-Z])?", query_lower)
    class_name = None
    if class_match:
        class_num = class_match.group(1)
        section = class_match.group(2) or ""
        class_name = f"Class {class_num}"
        if section:
            class_name += f"-{section.upper()}"
    
    # Detect exam type
    exam_type = "general"
    if any(k in query_lower for k in ["half yearly", "halfyearly", "अर्धवार्षिक"]):
        exam_type = "half_yearly"
    elif any(k in query_lower for k in ["annual", "final", "वार्षिक"]):
        exam_type = "annual"
    elif any(k in query_lower for k in ["unit test", "unit"]):
        exam_type = "unit_test"
    elif any(k in query_lower for k in ["quarterly", "त्रैमासिक"]):
        exam_type = "quarterly"
    
    # Find matching exam
    exam = await db.exams.find_one({
        "school_id": school_id,
        "exam_type": exam_type,
        "status": {"$in": ["upcoming", "ongoing"]}
    })
    
    if not exam:
        return {
            "success": False,
            "message": f"कोई {exam_type} exam नहीं मिला। पहले exam create करें।"
        }
    
    # Find class
    if class_name:
        class_info = await db.classes.find_one({
            "school_id": school_id,
            "name": {"$regex": class_name, "$options": "i"}
        })
        
        if class_info:
            # Generate for entire class
            students = await db.students.find({
                "school_id": school_id,
                "class_id": class_info["id"],
                "is_active": True
            }).to_list(200)
            
            generated = 0
            pending = 0
            
            for student in students:
                eligibility = await check_admit_card_eligibility(
                    student["id"], school_id, exam["id"], db
                )
                if eligibility["eligible"]:
                    admit_card = await generate_admit_card_data(
                        student["id"], exam["id"], school_id, db
                    )
                    await db.generated_admit_cards.update_one(
                        {"student_id": student["id"], "exam_id": exam["id"]},
                        {"$set": admit_card},
                        upsert=True
                    )
                    generated += 1
                else:
                    pending += 1
            
            return {
                "success": True,
                "message": f"✅ {class_name} के {generated} students के admit cards generate हो गए!\n⚠️ {pending} students की fee pending है।",
                "generated": generated,
                "pending_fee": pending
            }
    
    return {
        "success": False,
        "message": "Class specify करें। Example: 'Class 10 ke admit card banao'"
    }


# ============== QR CODE VERIFICATION ==============

class QRVerificationRequest(BaseModel):
    qr_data: str  # JSON string from QR code
    
class StudentVerificationResponse(BaseModel):
    verified: bool
    student_name: str = ""
    roll_no: str = ""
    class_name: str = ""
    exam_name: str = ""
    fee_status: str = ""
    entry_allowed: bool = False
    message: str = ""
    photo_url: str = None

@router.post("/verify-qr")
async def verify_admit_card_qr(qr_data: dict):
    """
    Verify admit card QR code at exam hall entrance
    AI will use this to verify student entry
    Returns: Student details, fee status, entry permission
    """
    db = get_database()
    
    try:
        student_id = qr_data.get("student_id")
        exam_id = qr_data.get("exam_id")
        school_id = qr_data.get("school_id")
        admit_card_no = qr_data.get("admit_card_no")
        
        if not all([student_id, exam_id, school_id]):
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Invalid QR code data"
            }
        
        # Get student info
        student = await db.students.find_one({"id": student_id, "school_id": school_id})
        if not student:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Student not found"
            }
        
        # Get exam info
        exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
        if not exam:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Exam not found"
            }
        
        # Check if admit card was actually generated
        generated = await db.generated_admit_cards.find_one({
            "student_id": student_id,
            "exam_id": exam_id
        })
        
        if not generated:
            return {
                "verified": False,
                "entry_allowed": False,
                "message": "Admit card not generated - Student may not have paid fees",
                "student_name": student.get("name", ""),
                "roll_no": student.get("roll_no", "")
            }
        
        # Get fee status
        fee_status = await get_student_fee_status(student_id, school_id, db)
        
        # Get class info
        class_info = await db.classes.find_one({"id": student.get("class_id")})
        class_name = class_info.get("name", "") if class_info else student.get("class_id", "")
        
        # Log entry attempt
        entry_log = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "exam_id": exam_id,
            "school_id": school_id,
            "admit_card_no": admit_card_no,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "entry_allowed": True,
            "fee_percentage": fee_status["paid_percentage"]
        }
        await db.exam_entry_logs.insert_one(entry_log)
        
        return {
            "verified": True,
            "entry_allowed": True,
            "student_name": student.get("name", ""),
            "father_name": student.get("father_name", ""),
            "roll_no": student.get("roll_no", generated.get("admit_card_no", "")),
            "class_name": class_name,
            "section": student.get("section", ""),
            "exam_name": exam.get("exam_name", ""),
            "fee_status": f"{fee_status['paid_percentage']}% paid",
            "fee_paid": fee_status["paid_fee"],
            "fee_pending": fee_status["pending_fee"],
            "photo_url": student.get("photo_url"),
            "message": f"✅ Entry Allowed - {student.get('name', '')} ({class_name})",
            "ai_announcement": f"Welcome {student.get('name', '')} from {class_name}. Your seat is ready."
        }
        
    except Exception as e:
        return {
            "verified": False,
            "entry_allowed": False,
            "message": f"Verification error: {str(e)}"
        }


@router.post("/admin-override-entry")
async def admin_override_entry(
    student_id: str,
    exam_id: str,
    school_id: str,
    admin_id: str,
    reason: str = "Admin approved"
):
    """
    Admin can override fee requirement and allow student entry
    """
    db = get_database()
    
    # Log override
    override_log = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "exam_id": exam_id,
        "school_id": school_id,
        "admin_id": admin_id,
        "reason": reason,
        "action": "entry_override",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_overrides.insert_one(override_log)
    
    # Generate admit card forcefully
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    admit_card["admin_override"] = True
    admit_card["override_reason"] = reason
    
    await db.generated_admit_cards.update_one(
        {"student_id": student_id, "exam_id": exam_id},
        {"$set": admit_card},
        upsert=True
    )
    
    student = await db.students.find_one({"id": student_id})
    
    return {
        "success": True,
        "message": f"✅ Admin override applied. {student.get('name', '')} can now enter.",
        "admit_card": admit_card
    }


@router.get("/entry-logs/{school_id}/{exam_id}")
async def get_exam_entry_logs(school_id: str, exam_id: str):
    """Get all entry logs for an exam - AI will use this to track who entered"""
    db = get_database()
    
    logs = await db.exam_entry_logs.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).sort("verified_at", -1).to_list(500)
    
    for log in logs:
        log.pop("_id", None)
        # Get student name
        student = await db.students.find_one({"id": log["student_id"]})
        log["student_name"] = student.get("name", "") if student else ""
    
    return {
        "total_entries": len(logs),
        "logs": logs
    }


@router.get("/download-status/{school_id}/{exam_id}")
async def get_download_status(school_id: str, exam_id: str):
    """Track which students have downloaded admit cards"""
    db = get_database()
    
    # Get all generated admit cards for this exam
    generated = await db.generated_admit_cards.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).to_list(500)
    
    downloaded_students = []
    for ac in generated:
        student = await db.students.find_one({"id": ac["student_id"]})
        if student:
            downloaded_students.append({
                "student_id": ac["student_id"],
                "student_name": student.get("name", ""),
                "class": ac.get("student", {}).get("class", ""),
                "roll_no": ac.get("student", {}).get("roll_no", ""),
                "generated_at": ac.get("generated_at", "")
            })
    
    return {
        "exam_id": exam_id,
        "total_downloaded": len(downloaded_students),
        "students": downloaded_students
    }


# ============== NEW APIs FOR IMPROVED SYSTEM ==============

@router.post("/board-exam")
async def create_board_exam(exam_data: dict):
    """Create board exam entry"""
    db = get_database()
    
    exam_doc = {
        "id": str(uuid.uuid4()),
        **exam_data,
        "exam_category": "board",
        "status": "upcoming",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.exams.insert_one(exam_doc)
    
    return {
        "success": True,
        "exam_id": exam_doc["id"],
        "message": f"Board Exam '{exam_data.get('exam_name')}' created successfully"
    }

@router.post("/upload-board-admit-card")
async def upload_board_admit_card(file: dict):
    """Upload board admit card template"""
    # Placeholder for file upload functionality
    # In production, this would handle actual file upload to storage
    
    return {
        "success": True,
        "file_url": f"/uploads/board_admit_cards/{str(uuid.uuid4())}.pdf",
        "message": "File uploaded successfully"
    }

@router.get("/preview/{school_id}/{exam_id}/{student_id}")
async def preview_admit_card(school_id: str, exam_id: str, student_id: str):
    """Generate preview of admit card"""
    db = get_database()
    
    admit_card = await generate_admit_card_data(student_id, exam_id, school_id, db)
    
    return {
        "success": True,
        "preview": admit_card,
        "message": "Preview generated"
    }

@router.post("/publish-studytino")
async def publish_to_studytino(request: dict):
    """Publish admit cards to StudyTino for student download"""
    db = get_database()
    
    school_id = request.get("school_id")
    exam_id = request.get("exam_id")
    
    # Mark exam as published to StudyTino
    await db.exams.update_one(
        {"id": exam_id, "school_id": school_id},
        {"$set": {
            "published_to_studytino": True,
            "studytino_published_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Get all admit cards for this exam
    admit_cards = await db.generated_admit_cards.find({
        "school_id": school_id,
        "exam_id": exam_id
    }).to_list(1000)
    
    return {
        "success": True,
        "published": True,
        "admit_cards_count": len(admit_cards),
        "message": f"{len(admit_cards)} admit cards published to StudyTino"
    }

@router.get("/subjects")
async def get_subjects(school_id: str):
    """Get subjects list for school"""
    db = get_database()
    
    # Get unique subjects from classes
    subjects = [
        {"id": "mathematics", "name": "Mathematics (गणित)"},
        {"id": "science", "name": "Science (विज्ञान)"},
        {"id": "hindi", "name": "Hindi (हिन्दी)"},
        {"id": "english", "name": "English (अंग्रेजी)"},
        {"id": "social_science", "name": "Social Science (सामाजिक विज्ञान)"},
        {"id": "sanskrit", "name": "Sanskrit (संस्कृत)"},
        {"id": "computer", "name": "Computer Science (कंप्यूटर)"},
        {"id": "physics", "name": "Physics (भौतिकी)"},
        {"id": "chemistry", "name": "Chemistry (रसायन)"},
        {"id": "biology", "name": "Biology (जीव विज्ञान)"}
    ]


@router.put("/exam/{exam_id}")
async def update_exam(exam_id: str, exam_data: dict):
    """Update existing exam"""
    db = get_database()
    
    school_id = exam_data.get("school_id")
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id required")
    
    print(f"Update request - exam_id: {exam_id}, school_id: {school_id}")
    
    # Check if exam exists - try by 'id' field first, then by '_id'
    exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
    if not exam:
        # Try finding by string _id
        exam = await db.exams.find_one({"_id": exam_id, "school_id": school_id})
    if not exam:
        print(f"Exam not found with id: {exam_id}")
        raise HTTPException(status_code=404, detail=f"Exam not found with id: {exam_id}")
    
    # Preserve exam_category if not provided in update
    if "exam_category" not in exam_data and exam.get("exam_category"):
        exam_data["exam_category"] = exam["exam_category"]
    
    exam_data.pop("school_id", None)
    exam_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Use the same query that found the exam
    query = {"id": exam_id, "school_id": school_id}
    if "id" not in exam:
        query = {"_id": exam_id, "school_id": school_id}
    
    result = await db.exams.update_one(query, {"$set": exam_data})
    
    print(f"Update result: {result.modified_count} documents modified")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    return {
        "success": True,
        "message": "Exam updated successfully"
    }

@router.delete("/exam/{exam_id}")
async def delete_exam(exam_id: str, school_id: str):
    """Delete exam and all related admit cards"""
    db = get_database()
    
    print(f"Delete request - exam_id: {exam_id}, school_id: {school_id}")
    
    # First check if exam exists - try by 'id' field first, then by '_id'
    exam = await db.exams.find_one({"id": exam_id, "school_id": school_id})
    query = {"id": exam_id, "school_id": school_id}
    if not exam:
        # Try finding by string _id
        exam = await db.exams.find_one({"_id": exam_id, "school_id": school_id})
        query = {"_id": exam_id, "school_id": school_id}
    if not exam:
        print(f"Exam not found with id: {exam_id}")
        raise HTTPException(status_code=404, detail=f"Exam not found with id: {exam_id}")
    
    # Delete exam
    result = await db.exams.delete_one(query)
    print(f"Delete result: {result.deleted_count} documents deleted")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Delete all admit cards for this exam
    await db.generated_admit_cards.delete_many({"exam_id": exam_id})
    
    return {
        "success": True,
        "message": "Exam and admit cards deleted successfully"
    }

@router.post("/migrate-exams")
async def migrate_exams(request: dict = None):
    """Fix existing exams without exam_category or id field"""
    db = get_database()
    
    school_id = request.get("school_id") if request else None
    
    # Query to find exams without exam_category
    query = {}
    if school_id:
        query["school_id"] = school_id
    
    exams = await db.exams.find(query).to_list(200)
    
    fixed_count = 0
    for exam in exams:
        updates = {}
        
        # Add id field if missing
        if "id" not in exam:
            updates["id"] = str(uuid.uuid4())
        
        # Add exam_category if missing
        if "exam_category" not in exam:
            updates["exam_category"] = "school"  # Default to school
        
        if updates:
            await db.exams.update_one(
                {"_id": exam["_id"]},
                {"$set": updates}
            )
            fixed_count += 1
    
    print(f"Migration complete: Fixed {fixed_count} exams")
    
    return {
        "success": True,
        "fixed_count": fixed_count,
        "total_exams": len(exams),
        "message": f"Fixed {fixed_count} exams with missing fields"
    }

@router.post("/collect-cash-fee")
async def collect_cash_fee(payment_data: dict):
    """Collect cash fee for admit card"""
    db = get_database()
    
    # Record cash payment
    payment_record = {
        "id": str(uuid.uuid4()),
        "school_id": payment_data.get("school_id"),
        "student_id": payment_data.get("student_id"),
        "exam_id": payment_data.get("exam_id"),
        "amount": payment_data.get("amount"),
        "payment_type": "cash",
        "payment_mode": "cash",
        "purpose": "admit_card_fee",
        "collected_by": payment_data.get("collected_by"),
        "payment_date": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payments.insert_one(payment_record)
    
    # Update student fee records
    await db.fee_records.update_one(
        {
            "student_id": payment_data.get("student_id"),
            "school_id": payment_data.get("school_id"),
            "academic_year": str(date.today().year)
        },
        {"$inc": {"paid_amount": payment_data.get("amount")}},
        upsert=True
    )
    
    return {
        "success": True,
        "payment_id": payment_record["id"],
        "message": "Cash fee collected successfully"
    }

    


@router.post("/parse-student-list")
async def parse_student_list(file_data: dict):
    """Parse Excel/CSV file and extract student list for board exam"""
    db = get_database()
    
    school_id = file_data.get("school_id")
    exam_id = file_data.get("exam_id")
    
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id is required")
    
    print(f"Parsing student list for school: {school_id}, exam: {exam_id}")
    
    try:
        # Get students from school database
        students = await db.students.find({
            "school_id": school_id,
            "is_active": True
        }).limit(100).to_list(100)
        
        print(f"Found {len(students)} students")
        
        # If no students found, return empty list with helpful message
        if not students:
            return {
                "success": True,
                "students": [],
                "count": 0,
                "message": "No students found. Please add students first or upload CSV file."
            }
        
        # Format for board exam
        formatted_students = []
        for idx, student in enumerate(students, 1):
            # Get class info for better display
            class_info = await db.classes.find_one({"id": student.get("class_id")})
            class_name = class_info.get("name") if class_info else student.get("class_name", f"Class {idx}")
            
            formatted_students.append({
                "name": student.get("name", ""),
                "father_name": student.get("father_name", ""),
                "mother_name": student.get("mother_name", ""),
                "dob": student.get("dob", ""),
                "class": class_name,
                "roll_number": student.get("roll_no", str(idx).zfill(3)),
                "board_roll_number": f"2026{str(idx).zfill(6)}",
                "student_id": student.get("id", student.get("student_id"))
            })
        
        return {
            "success": True,
            "students": formatted_students,
            "count": len(formatted_students)
        }
    except Exception as e:
        print(f"Error parsing student list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing students: {str(e)}")

@router.post("/generate-board-bulk")
async def generate_board_bulk(request: dict):
    """Generate board exam admit cards in bulk"""
    db = get_database()
    
    school_id = request.get("school_id")
    exam_id = request.get("exam_id")
    students = request.get("students", [])
    
    generated_cards = []
    
    for student_data in students:
        # Create admit card for each student
        admit_card = {
            "id": str(uuid.uuid4()),
            "school_id": school_id,
            "exam_id": exam_id,
            "student_name": student_data.get("name"),
            "father_name": student_data.get("father_name"),
            "mother_name": student_data.get("mother_name"),
            "dob": student_data.get("dob"),
            "class": student_data.get("class"),
            "roll_number": student_data.get("board_roll_number", student_data.get("roll_number")),
            "exam_centre": student_data.get("exam_centre", ""),
            "admit_card_type": "board",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "status": "generated"
        }
        
        await db.board_admit_cards.insert_one(admit_card)
        generated_cards.append(admit_card)
    
    return {
        "success": True,
        "generated_count": len(generated_cards),
        "admit_cards": generated_cards
    }

    return subjects


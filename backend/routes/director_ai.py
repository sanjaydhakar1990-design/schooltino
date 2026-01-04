"""
Director AI - The Big Boss of School Management
- Central command center for school monitoring
- AI-powered insights and recommendations
- Proactive alerts and orders
- Performance monitoring across all departments
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import random

load_dotenv()

router = APIRouter(prefix="/director-ai", tags=["Director AI"])

# Database connection
def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

db = None
def get_database():
    global db
    if db is None:
        db = get_db()
    return db

# Director AI Personality
DIRECTOR_GREETINGS = [
    "Namaste! Main aapka AI Director hoon. Aaj school ki poori report ready hai.",
    "Good morning! Director AI reporting. Sab kuch control mein hai.",
    "Welcome back! Maine sab monitor kar liya hai. Yahan important updates hain.",
]

PRIORITY_LABELS = {
    "critical": "🔴 CRITICAL",
    "high": "🟠 HIGH",
    "medium": "🟡 MEDIUM",
    "low": "🟢 LOW"
}

@router.get("/dashboard")
async def get_director_dashboard(school_id: str):
    """Get the main Director AI dashboard with all insights"""
    db = get_database()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Gather all school data
    total_students = await db.students.count_documents({"school_id": school_id, "status": "active"})
    total_teachers = await db.users.count_documents({"school_id": school_id, "role": "teacher"})
    total_staff = await db.users.count_documents({"school_id": school_id, "role": {"$in": ["staff", "accountant"]}})
    
    # Today's attendance
    today_attendance = await db.attendance.count_documents({
        "school_id": school_id,
        "date": today,
        "status": "present"
    })
    
    # Pending fees
    pending_fees_pipeline = [
        {"$match": {"school_id": school_id, "status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    pending_result = await db.fee_payments.aggregate(pending_fees_pipeline).to_list(1)
    pending_fees = pending_result[0]["total"] if pending_result else 0
    
    # Today's fee collection
    today_collection_pipeline = [
        {"$match": {"school_id": school_id, "payment_date": {"$regex": f"^{today}"}, "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    today_result = await db.fee_payments.aggregate(today_collection_pipeline).to_list(1)
    today_collection = today_result[0]["total"] if today_result else 0
    
    # Calculate attendance percentage
    attendance_pct = round((today_attendance / max(total_students, 1)) * 100, 1)
    
    # Generate AI insights
    insights = await generate_director_insights(db, school_id, {
        "total_students": total_students,
        "attendance_pct": attendance_pct,
        "pending_fees": pending_fees,
        "today_collection": today_collection
    })
    
    # Generate orders/priorities for the day
    orders = await generate_daily_orders(db, school_id, insights)
    
    return {
        "greeting": random.choice(DIRECTOR_GREETINGS),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "school_pulse": {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_staff": total_staff,
            "today_attendance": today_attendance,
            "attendance_percentage": attendance_pct,
            "pending_fees": pending_fees,
            "today_collection": today_collection
        },
        "health_score": calculate_school_health(attendance_pct, pending_fees, total_students),
        "insights": insights,
        "daily_orders": orders,
        "alerts": await get_critical_alerts(db, school_id)
    }

async def generate_director_insights(db, school_id: str, metrics: dict):
    """Generate AI-powered insights based on school data"""
    insights = []
    
    # Attendance insight
    if metrics["attendance_pct"] < 80:
        insights.append({
            "category": "attendance",
            "priority": "high",
            "title": "Attendance Concern",
            "message": f"Aaj attendance sirf {metrics['attendance_pct']}% hai. Normal se kam hai. Classes check karein.",
            "action": "View absent students list",
            "action_link": "/app/attendance"
        })
    elif metrics["attendance_pct"] >= 95:
        insights.append({
            "category": "attendance",
            "priority": "low",
            "title": "Excellent Attendance!",
            "message": f"Bahut badhiya! {metrics['attendance_pct']}% attendance hai aaj. Keep it up!",
            "action": None,
            "action_link": None
        })
    
    # Fee collection insight
    if metrics["pending_fees"] > 100000:
        insights.append({
            "category": "fees",
            "priority": "critical",
            "title": "High Pending Fees",
            "message": f"₹{metrics['pending_fees']:,.0f} fees pending hain. Immediate action required.",
            "action": "Send fee reminders",
            "action_link": "/app/fees"
        })
    
    if metrics["today_collection"] > 0:
        insights.append({
            "category": "fees",
            "priority": "low",
            "title": "Today's Collection",
            "message": f"Aaj ₹{metrics['today_collection']:,.0f} collect hua hai. Good progress!",
            "action": "View details",
            "action_link": "/app/fees"
        })
    
    # Get low performing classes
    low_performers = await db.exam_results.aggregate([
        {"$match": {"school_id": school_id}},
        {"$group": {
            "_id": "$class_id",
            "avg_score": {"$avg": "$percentage"}
        }},
        {"$match": {"avg_score": {"$lt": 50}}},
        {"$limit": 3}
    ]).to_list(3)
    
    if low_performers:
        insights.append({
            "category": "academics",
            "priority": "high",
            "title": "Academic Attention Needed",
            "message": f"{len(low_performers)} classes mein average marks 50% se kam hain. Remedial classes schedule karein.",
            "action": "View weak classes",
            "action_link": "/app/exams"
        })
    
    # Check for upcoming events
    upcoming_events = await db.notices.count_documents({
        "school_id": school_id,
        "event_date": {"$gte": today, "$lte": (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')}
    })
    
    if upcoming_events > 0:
        insights.append({
            "category": "events",
            "priority": "medium",
            "title": "Upcoming Events",
            "message": f"Is week {upcoming_events} events hain. Preparations check karein.",
            "action": "View calendar",
            "action_link": "/app/notices"
        })
    
    return insights

async def generate_daily_orders(db, school_id: str, insights: list):
    """Generate priority orders for the day based on insights"""
    orders = []
    
    # Sort insights by priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_insights = sorted(insights, key=lambda x: priority_order.get(x["priority"], 4))
    
    for i, insight in enumerate(sorted_insights[:5], 1):
        if insight["action"]:
            orders.append({
                "order_no": i,
                "priority": insight["priority"],
                "priority_label": PRIORITY_LABELS.get(insight["priority"], ""),
                "command": insight["action"],
                "reason": insight["message"],
                "department": insight["category"],
                "action_link": insight["action_link"]
            })
    
    # Add standard daily tasks
    orders.append({
        "order_no": len(orders) + 1,
        "priority": "medium",
        "priority_label": PRIORITY_LABELS["medium"],
        "command": "Daily attendance report review karein",
        "reason": "Ensure all classes have marked attendance",
        "department": "attendance",
        "action_link": "/app/attendance"
    })
    
    return orders

async def get_critical_alerts(db, school_id: str):
    """Get critical alerts that need immediate attention"""
    alerts = []
    
    # Check for students with very low attendance (< 60%)
    # This would need attendance aggregation - simplified for now
    
    # Check for overdue fees > 90 days
    overdue_count = await db.fee_payments.count_documents({
        "school_id": school_id,
        "status": "pending",
        "due_date": {"$lt": (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')}
    })
    
    if overdue_count > 0:
        alerts.append({
            "type": "fee_overdue",
            "severity": "critical",
            "title": f"{overdue_count} students ki fees 90 din se zyada overdue",
            "action": "Immediate follow-up required"
        })
    
    # Check for medical incidents today
    today = datetime.now().strftime('%Y-%m-%d')
    incidents = await db.medical_incidents.count_documents({
        "school_id": school_id,
        "created_at": {"$regex": f"^{today}"},
        "severity": {"$in": ["high", "emergency"]}
    })
    
    if incidents > 0:
        alerts.append({
            "type": "medical",
            "severity": "high",
            "title": f"Aaj {incidents} serious medical incident(s) report hui",
            "action": "Health module check karein"
        })
    
    return alerts

def calculate_school_health(attendance_pct: float, pending_fees: float, total_students: int):
    """Calculate overall school health score (0-100)"""
    # Attendance contributes 40%
    attendance_score = min(attendance_pct, 100) * 0.4
    
    # Fee collection contributes 30%
    if total_students > 0:
        avg_pending_per_student = pending_fees / total_students
        # Assume ₹5000 per student is acceptable pending
        fee_score = max(0, (1 - (avg_pending_per_student / 5000))) * 30
    else:
        fee_score = 30
    
    # Base score 30% for system being operational
    base_score = 30
    
    total_score = min(100, attendance_score + fee_score + base_score)
    
    if total_score >= 80:
        status = "Excellent"
        color = "green"
    elif total_score >= 60:
        status = "Good"
        color = "blue"
    elif total_score >= 40:
        status = "Needs Attention"
        color = "yellow"
    else:
        status = "Critical"
        color = "red"
    
    return {
        "score": round(total_score, 1),
        "status": status,
        "color": color
    }

@router.get("/quick-stats")
async def get_quick_stats(school_id: str):
    """Get quick stats for the Director AI widget"""
    db = get_database()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Quick counts
    present_today = await db.attendance.count_documents({
        "school_id": school_id,
        "date": today,
        "status": "present"
    })
    
    absent_today = await db.attendance.count_documents({
        "school_id": school_id,
        "date": today,
        "status": "absent"
    })
    
    visitors_today = await db.visitors.count_documents({
        "school_id": school_id,
        "checkin_time": {"$regex": f"^{today}"}
    })
    
    incidents_today = await db.medical_incidents.count_documents({
        "school_id": school_id,
        "created_at": {"$regex": f"^{today}"}
    })
    
    return {
        "students_present": present_today,
        "students_absent": absent_today,
        "visitors_today": visitors_today,
        "incidents_today": incidents_today,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@router.get("/voice-briefing")
async def get_voice_briefing(school_id: str):
    """Get text for AI voice briefing"""
    db = get_database()
    
    dashboard = await get_director_dashboard(school_id)
    
    # Generate voice script
    pulse = dashboard["school_pulse"]
    health = dashboard["health_score"]
    
    briefing = f"""
    Namaste Director sahab! Main aapka AI Director hoon. Aaj ki report suniye:
    
    School ki health {health['status']} hai, score {health['score']} percent.
    
    Aaj {pulse['today_attendance']} students present hain, jo {pulse['attendance_percentage']} percent hai.
    
    Fee collection mein aaj {pulse['today_collection']} rupees collect hue hain.
    Pending fees abhi {pulse['pending_fees']} rupees hain.
    """
    
    # Add priority orders
    if dashboard["daily_orders"]:
        briefing += "\n\nAaj ki priority tasks:"
        for order in dashboard["daily_orders"][:3]:
            briefing += f"\n{order['order_no']}. {order['command']}"
    
    # Add alerts
    if dashboard["alerts"]:
        briefing += "\n\nImportant alerts:"
        for alert in dashboard["alerts"]:
            briefing += f"\n- {alert['title']}"
    
    briefing += "\n\nYeh thi aaj ki report. Koi sawal ho to poochiye!"
    
    return {
        "briefing_text": briefing.strip(),
        "can_speak": True,
        "language": "hi-IN"
    }

@router.post("/ask")
async def ask_director_ai(question: str, school_id: str):
    """Ask the Director AI a question"""
    db = get_database()
    
    question_lower = question.lower()
    
    # Simple intent detection
    if any(word in question_lower for word in ["attendance", "present", "absent", "hajri"]):
        today = datetime.now().strftime('%Y-%m-%d')
        present = await db.attendance.count_documents({
            "school_id": school_id,
            "date": today,
            "status": "present"
        })
        total = await db.students.count_documents({"school_id": school_id, "status": "active"})
        
        return {
            "response": f"Aaj {present} students present hain, total {total} mein se. Attendance {round((present/max(total,1))*100, 1)}% hai.",
            "data": {"present": present, "total": total},
            "action_suggestion": "Absent students ki list dekhein?"
        }
    
    elif any(word in question_lower for word in ["fee", "fees", "paisa", "collection", "pending"]):
        pipeline = [
            {"$match": {"school_id": school_id, "status": "pending"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]
        result = await db.fee_payments.aggregate(pipeline).to_list(1)
        pending = result[0] if result else {"total": 0, "count": 0}
        
        return {
            "response": f"Abhi {pending.get('count', 0)} students ki fees pending hain, total ₹{pending.get('total', 0):,.0f}. Reminders bhejein?",
            "data": pending,
            "action_suggestion": "Fee reminders send karein?"
        }
    
    elif any(word in question_lower for word in ["teacher", "staff", "employee"]):
        teachers = await db.users.count_documents({"school_id": school_id, "role": "teacher"})
        staff = await db.users.count_documents({"school_id": school_id, "role": {"$in": ["staff", "accountant"]}})
        
        return {
            "response": f"School mein {teachers} teachers aur {staff} staff members hain. Kisi specific teacher ke baare mein jaanna hai?",
            "data": {"teachers": teachers, "staff": staff},
            "action_suggestion": None
        }
    
    elif any(word in question_lower for word in ["student", "bachche", "admission"]):
        total = await db.students.count_documents({"school_id": school_id, "status": "active"})
        
        return {
            "response": f"School mein total {total} students enrolled hain. Class-wise breakdown chahiye?",
            "data": {"total_students": total},
            "action_suggestion": "Class-wise report dekhein?"
        }
    
    else:
        return {
            "response": "Main aapki madad kar sakta hoon attendance, fees, students, ya teachers ke baare mein. Kya jaanna chahte hain?",
            "data": None,
            "action_suggestion": "Dashboard dekhein full overview ke liye"
        }

@router.get("/department-status")
async def get_department_status(school_id: str):
    """Get status of all departments"""
    db = get_database()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    departments = [
        {
            "name": "Attendance",
            "icon": "clipboard-check",
            "status": "active",
            "metric": await db.attendance.count_documents({"school_id": school_id, "date": today}),
            "metric_label": "marked today"
        },
        {
            "name": "Fee Collection",
            "icon": "wallet",
            "status": "active",
            "metric": await db.fee_payments.count_documents({"school_id": school_id, "status": "paid", "payment_date": {"$regex": f"^{today}"}}),
            "metric_label": "payments today"
        },
        {
            "name": "Front Office",
            "icon": "door-open",
            "status": "active",
            "metric": await db.visitors.count_documents({"school_id": school_id, "checkin_time": {"$regex": f"^{today}"}}),
            "metric_label": "visitors today"
        },
        {
            "name": "Transport",
            "icon": "bus",
            "status": "active",
            "metric": await db.vehicles.count_documents({"school_id": school_id, "status": "active"}),
            "metric_label": "vehicles active"
        },
        {
            "name": "Health",
            "icon": "heart",
            "status": "active",
            "metric": await db.medical_incidents.count_documents({"school_id": school_id, "created_at": {"$regex": f"^{today}"}}),
            "metric_label": "incidents today"
        },
        {
            "name": "Biometric",
            "icon": "fingerprint",
            "status": "active",
            "metric": await db.biometric_punches.count_documents({"school_id": school_id, "date": today}),
            "metric_label": "punches today"
        }
    ]
    
    return {
        "departments": departments,
        "all_systems_operational": all(d["status"] == "active" for d in departments)
    }

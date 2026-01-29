# ./routes/ai_accountant.py
"""
AI Accountant Dashboard
- Student fee management
- Teacher/Staff salary management
- School expenses tracking
- AI-powered financial insights
- One-click AI reports
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
import uuid
import os
import sys
import sys; from pathlib import Path; sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient

# Emergent LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Database connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

router = APIRouter(prefix="/ai-accountant", tags=["AI Accountant"])


# ==================== MODELS ====================

class ExpenseCreate(BaseModel):
    school_id: str
    category: str  # salary, maintenance, utilities, supplies, transport, events, other
    amount: float
    description: str
    vendor_name: Optional[str] = None
    payment_method: str = "bank_transfer"  # cash, bank_transfer, cheque, upi
    reference_number: Optional[str] = None
    date: Optional[str] = None

class SalaryRecord(BaseModel):
    school_id: str
    employee_id: str
    employee_name: str
    employee_type: str  # teacher, staff, admin
    designation: str
    base_salary: float
    allowances: float = 0
    deductions: float = 0
    month: str  # e.g., "2024-12"

class AIAnalysisRequest(BaseModel):
    school_id: str
    analysis_type: str  # fee_collection, salary_summary, expense_analysis, monthly_report, yearly_report
    month: Optional[str] = None
    year: Optional[str] = None


# ==================== DASHBOARD OVERVIEW ====================

@router.get("/dashboard/{school_id}")
async def get_accountant_dashboard(school_id: str):
    """
    Get complete financial dashboard for school
    AI-powered insights included
    """
    current_month = datetime.now().strftime('%Y-%m')
    current_year = datetime.now().strftime('%Y')
    
    # Fee Collection Stats
    total_fee_collected_month = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    total_fee_collected_year = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{current_year}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    pending_fees = await db.fee_invoices.aggregate([
        {"$match": {"school_id": school_id, "status": {"$in": ["pending", "partial", "overdue"]}}},
        {"$group": {"_id": None, "total": {"$sum": {"$subtract": ["$final_amount", {"$ifNull": ["$paid_amount", 0]}]}}}}
    ]).to_list(1)
    
    # Salary Stats
    total_salary_month = await db.salary_payments.aggregate([
        {"$match": {"school_id": school_id, "month": current_month, "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$net_salary"}}}
    ]).to_list(1)
    
    pending_salaries = await db.salary_payments.aggregate([
        {"$match": {"school_id": school_id, "month": current_month, "status": "pending"}},
        {"$group": {"_id": None, "total": {"$sum": "$net_salary"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    
    # Expense Stats
    total_expenses_month = await db.expenses.aggregate([
        {"$match": {"school_id": school_id, "date": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    expenses_by_category = await db.expenses.aggregate([
        {"$match": {"school_id": school_id, "date": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}}
    ]).to_list(20)
    
    # Student count for per-student calculations
    total_students = await db.students.count_documents({"school_id": school_id, "status": "active"})
    total_staff = await db.users.count_documents({"school_id": school_id, "is_active": True})
    
    # Recent transactions
    recent_payments = await db.fee_payments.find(
        {"school_id": school_id, "status": "success"},
        {"_id": 0, "id": 1, "student_name": 1, "amount": 1, "fee_type": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    recent_expenses = await db.expenses.find(
        {"school_id": school_id},
        {"_id": 0, "id": 1, "category": 1, "amount": 1, "description": 1, "date": 1}
    ).sort("date", -1).limit(5).to_list(5)
    
    return {
        "school_id": school_id,
        "month": current_month,
        "overview": {
            "fee_collected_this_month": total_fee_collected_month[0]["total"] if total_fee_collected_month else 0,
            "fee_collected_this_year": total_fee_collected_year[0]["total"] if total_fee_collected_year else 0,
            "pending_fees": pending_fees[0]["total"] if pending_fees else 0,
            "salary_paid_this_month": total_salary_month[0]["total"] if total_salary_month else 0,
            "pending_salaries": {
                "amount": pending_salaries[0]["total"] if pending_salaries else 0,
                "count": pending_salaries[0]["count"] if pending_salaries else 0
            },
            "expenses_this_month": total_expenses_month[0]["total"] if total_expenses_month else 0
        },
        "metrics": {
            "total_students": total_students,
            "total_staff": total_staff,
            "avg_fee_per_student": (total_fee_collected_month[0]["total"] / total_students) if total_fee_collected_month and total_students > 0 else 0
        },
        "expenses_by_category": [{"category": e["_id"], "amount": e["total"]} for e in expenses_by_category],
        "recent_transactions": {
            "payments": recent_payments,
            "expenses": recent_expenses
        }
    }


# ==================== FEE MANAGEMENT ====================

@router.get("/fees/defaulters/{school_id}")
async def get_fee_defaulters(school_id: str, month: Optional[str] = None):
    """
    Get list of students with pending/overdue fees
    """
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    # Get students with pending invoices
    defaulters = await db.fee_invoices.aggregate([
        {"$match": {
            "school_id": school_id,
            "status": {"$in": ["pending", "overdue"]},
            "month": {"$lte": month}
        }},
        {"$group": {
            "_id": "$student_id",
            "total_pending": {"$sum": {"$subtract": ["$final_amount", {"$ifNull": ["$paid_amount", 0]}]}},
            "months_pending": {"$sum": 1}
        }},
        {"$sort": {"total_pending": -1}}
    ]).to_list(100)
    
    # Get student details
    for d in defaulters:
        student = await db.students.find_one({"id": d["_id"]}, {"_id": 0, "name": 1, "class_id": 1, "mobile": 1, "father_name": 1})
        if student:
            d["student_name"] = student.get("name")
            d["class_id"] = student.get("class_id")
            d["mobile"] = student.get("mobile")
            d["father_name"] = student.get("father_name")
    
    return {
        "month": month,
        "total_defaulters": len(defaulters),
        "total_pending_amount": sum(d["total_pending"] for d in defaulters),
        "defaulters": defaulters
    }


@router.get("/fees/collection-report/{school_id}")
async def get_fee_collection_report(school_id: str, month: Optional[str] = None):
    """
    Detailed fee collection report
    """
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    # Daily collection
    daily_collection = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{month}"}}},
        {"$project": {
            "date": {"$substr": ["$created_at", 0, 10]},
            "amount": 1,
            "fee_type": 1
        }},
        {"$group": {
            "_id": {"date": "$date", "fee_type": "$fee_type"},
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}}
    ]).to_list(100)
    
    # By fee type
    by_fee_type = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{month}"}}},
        {"$group": {"_id": "$fee_type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}}
    ]).to_list(20)
    
    # By payment method
    by_method = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{month}"}}},
        {"$group": {"_id": "$payment_method", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}}
    ]).to_list(10)
    
    total_collected = sum(ft["total"] for ft in by_fee_type)
    total_transactions = sum(ft["count"] for ft in by_fee_type)
    
    return {
        "month": month,
        "summary": {
            "total_collected": total_collected,
            "total_transactions": total_transactions,
            "avg_transaction": total_collected / total_transactions if total_transactions > 0 else 0
        },
        "by_fee_type": [{"fee_type": ft["_id"], "amount": ft["total"], "count": ft["count"]} for ft in by_fee_type],
        "by_payment_method": [{"method": m["_id"], "amount": m["total"], "count": m["count"]} for m in by_method],
        "daily_collection": daily_collection
    }


# ==================== SALARY MANAGEMENT ====================

@router.get("/salaries/{school_id}")
async def get_salary_overview(school_id: str, month: Optional[str] = None):
    """
    Get salary overview for all staff
    """
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    # Get all salary records for the month
    salaries = await db.salary_payments.find(
        {"school_id": school_id, "month": month},
        {"_id": 0}
    ).sort("employee_name", 1).to_list(200)
    
    if not salaries:
        # Generate salary records from staff list
        staff = await db.users.find(
            {"school_id": school_id, "is_active": True},
            {"_id": 0, "id": 1, "name": 1, "role": 1}
        ).to_list(200)
        
        salaries = []
        for s in staff:
            # Default salaries based on role
            base_salary = {
                "director": 50000,
                "principal": 45000,
                "vice_principal": 40000,
                "teacher": 25000,
                "accountant": 20000,
                "clerk": 15000,
                "staff": 12000
            }.get(s.get("role", "staff"), 15000)
            
            salaries.append({
                "id": str(uuid.uuid4()),
                "school_id": school_id,
                "employee_id": s["id"],
                "employee_name": s["name"],
                "employee_type": s.get("role", "staff"),
                "designation": s.get("role", "staff").title(),
                "base_salary": base_salary,
                "allowances": base_salary * 0.1,  # 10% allowance
                "deductions": base_salary * 0.05,  # 5% deductions (PF, etc.)
                "net_salary": base_salary + (base_salary * 0.1) - (base_salary * 0.05),
                "month": month,
                "status": "pending"
            })
    
    # Calculate totals
    total_base = sum(s.get("base_salary", 0) for s in salaries)
    total_allowances = sum(s.get("allowances", 0) for s in salaries)
    total_deductions = sum(s.get("deductions", 0) for s in salaries)
    total_net = sum(s.get("net_salary", 0) for s in salaries)
    
    paid_count = sum(1 for s in salaries if s.get("status") == "paid")
    pending_count = len(salaries) - paid_count
    
    return {
        "month": month,
        "school_id": school_id,
        "summary": {
            "total_employees": len(salaries),
            "total_base_salary": total_base,
            "total_allowances": total_allowances,
            "total_deductions": total_deductions,
            "total_net_salary": total_net,
            "paid_count": paid_count,
            "pending_count": pending_count
        },
        "salaries": salaries
    }


@router.post("/salaries/pay")
async def process_salary_payment(
    school_id: str,
    employee_id: str,
    month: str
):
    """
    Process salary payment for an employee
    """
    # Update or create salary record
    result = await db.salary_payments.update_one(
        {"school_id": school_id, "employee_id": employee_id, "month": month},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"Salary payment processed for {month}",
        "employee_id": employee_id
    }


@router.post("/salaries/pay-all")
async def process_all_salaries(school_id: str, month: str):
    """
    One-click pay all pending salaries
    """
    result = await db.salary_payments.update_many(
        {"school_id": school_id, "month": month, "status": "pending"},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": f"All salaries processed for {month}",
        "updated_count": result.modified_count
    }


# ==================== EXPENSE MANAGEMENT ====================

@router.post("/expenses/add")
async def add_expense(expense: ExpenseCreate):
    """
    Add a new expense record
    """
    expense_record = {
        "id": str(uuid.uuid4()),
        "school_id": expense.school_id,
        "category": expense.category,
        "amount": expense.amount,
        "description": expense.description,
        "vendor_name": expense.vendor_name,
        "payment_method": expense.payment_method,
        "reference_number": expense.reference_number,
        "date": expense.date or datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.expenses.insert_one(expense_record)
    
    return {
        "success": True,
        "message": "Expense added successfully",
        "expense": {k: v for k, v in expense_record.items() if k != "_id"}
    }


@router.get("/expenses/{school_id}")
async def get_expenses(school_id: str, month: Optional[str] = None, category: Optional[str] = None):
    """
    Get expense records
    """
    query = {"school_id": school_id}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    if category:
        query["category"] = category
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(200)
    
    total = sum(e["amount"] for e in expenses)
    
    return {
        "school_id": school_id,
        "month": month,
        "category": category,
        "total_expenses": total,
        "count": len(expenses),
        "expenses": expenses
    }


# ==================== AI ANALYSIS ====================

@router.post("/ai/analyze")
async def get_ai_analysis(request: AIAnalysisRequest):
    """
    AI-powered financial analysis
    """
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    month = request.month or datetime.now().strftime('%Y-%m')
    year = request.year or datetime.now().strftime('%Y')
    
    # Gather data based on analysis type
    context_data = {}
    
    if request.analysis_type in ["fee_collection", "monthly_report", "yearly_report"]:
        # Fee collection data
        fee_data = await db.fee_payments.aggregate([
            {"$match": {"school_id": request.school_id, "status": "success", "created_at": {"$regex": f"^{month if request.analysis_type != 'yearly_report' else year}"}}},
            {"$group": {"_id": "$fee_type", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]).to_list(20)
        context_data["fee_collection"] = fee_data
        
        # Pending fees
        pending = await db.fee_invoices.aggregate([
            {"$match": {"school_id": request.school_id, "status": {"$in": ["pending", "overdue"]}}},
            {"$group": {"_id": None, "total": {"$sum": {"$subtract": ["$final_amount", {"$ifNull": ["$paid_amount", 0]}]}}}}
        ]).to_list(1)
        context_data["pending_fees"] = pending[0]["total"] if pending else 0
    
    if request.analysis_type in ["salary_summary", "monthly_report", "yearly_report"]:
        # Salary data
        salary_data = await db.salary_payments.aggregate([
            {"$match": {"school_id": request.school_id, "month": {"$regex": f"^{year}"}, "status": "paid"}},
            {"$group": {"_id": "$month", "total": {"$sum": "$net_salary"}, "count": {"$sum": 1}}}
        ]).to_list(12)
        context_data["salary_data"] = salary_data
    
    if request.analysis_type in ["expense_analysis", "monthly_report", "yearly_report"]:
        # Expense data
        expense_data = await db.expenses.aggregate([
            {"$match": {"school_id": request.school_id, "date": {"$regex": f"^{month if request.analysis_type != 'yearly_report' else year}"}}},
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]).to_list(20)
        context_data["expenses"] = expense_data
    
    # Get student and staff count
    total_students = await db.students.count_documents({"school_id": request.school_id, "status": "active"})
    total_staff = await db.users.count_documents({"school_id": request.school_id, "is_active": True})
    context_data["total_students"] = total_students
    context_data["total_staff"] = total_staff
    
    # Build AI prompt
    prompt = f"""
आप एक expert school accountant और financial advisor हैं। नीचे दिए गए data का analysis करें और actionable insights दें।

Analysis Type: {request.analysis_type}
Period: {month if request.analysis_type != 'yearly_report' else year}

Financial Data:
{context_data}

Please provide analysis in Hinglish (Hindi + English mix) including:
1. 📊 Summary - Key numbers at a glance
2. 📈 Performance - How is collection/expense doing?
3. ⚠️ Alerts - Any concerns or red flags
4. 💡 Recommendations - What actions should be taken
5. 🎯 Goals - Targets for next period

Keep it concise, practical, and actionable. Use emojis for better readability.
"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"accountant-analysis-{request.school_id}",
            system_message="You are an expert school accountant providing financial analysis in Hinglish."
        ).with_model("openai", "gpt-4o-mini")
        
        user_msg = UserMessage(text=prompt)
        analysis = await chat.send_message(user_msg)
        
        return {
            "success": True,
            "analysis_type": request.analysis_type,
            "period": month if request.analysis_type != 'yearly_report' else year,
            "ai_analysis": analysis,
            "raw_data": context_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.get("/ai/quick-insight/{school_id}")
async def get_quick_ai_insight(school_id: str):
    """
    Quick AI insight for dashboard - runs automatically
    """
    if not EMERGENT_LLM_KEY:
        return {
            "insight": "AI insights not available. Configure EMERGENT_LLM_KEY for intelligent analysis.",
            "type": "info"
        }
    
    current_month = datetime.now().strftime('%Y-%m')
    
    # Quick stats
    fee_collected = await db.fee_payments.aggregate([
        {"$match": {"school_id": school_id, "status": "success", "created_at": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    pending_fees = await db.fee_invoices.aggregate([
        {"$match": {"school_id": school_id, "status": {"$in": ["pending", "overdue"]}}},
        {"$group": {"_id": None, "total": {"$sum": {"$subtract": ["$final_amount", {"$ifNull": ["$paid_amount", 0]}]}}}}
    ]).to_list(1)
    
    expenses = await db.expenses.aggregate([
        {"$match": {"school_id": school_id, "date": {"$regex": f"^{current_month}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    collected = fee_collected[0]["total"] if fee_collected else 0
    pending = pending_fees[0]["total"] if pending_fees else 0
    spent = expenses[0]["total"] if expenses else 0
    
    # Generate quick insight
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"quick-insight-{school_id}",
            system_message="You are a helpful financial assistant. Give very brief, actionable insights in Hinglish."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""
School Financial Snapshot:
- Fee Collected: ₹{collected:,.0f}
- Pending Fees: ₹{pending:,.0f}
- Expenses: ₹{spent:,.0f}
- Net: ₹{collected - spent:,.0f}

Give ONE short insight (max 2 sentences) in Hinglish. Be specific and actionable.
"""
        
        user_msg = UserMessage(text=prompt)
        insight = await chat.send_message(user_msg)
        
        # Determine type based on financial health
        insight_type = "success" if collected > pending and collected > spent else "warning" if pending > collected else "info"
        
        return {
            "insight": insight,
            "type": insight_type,
            "stats": {
                "collected": collected,
                "pending": pending,
                "expenses": spent,
                "net": collected - spent
            }
        }
        
    except Exception as e:
        return {
            "insight": f"Fee collected: ₹{collected:,.0f} | Pending: ₹{pending:,.0f} | Expenses: ₹{spent:,.0f}",
            "type": "info",
            "stats": {"collected": collected, "pending": pending, "expenses": spent}
        }

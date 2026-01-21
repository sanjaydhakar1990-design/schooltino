"""
Test Suite for Fee Payment System and AI Accountant Dashboard
Iteration 12 - New Features Testing

Features tested:
1. Fee Payment APIs - /api/fee-payment/*
2. AI Accountant APIs - /api/ai-accountant/*
3. AI Chapter Summarizer - /api/syllabus-progress/ai/summarize-chapter
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://schooltino-erp.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"
TEACHER_EMAIL = "teacher@schooltino.com"
TEACHER_PASSWORD = "teacher123"
STUDENT_ID = "STD-2026-285220"
STUDENT_PASSWORD = "KPbeHdZf"

# Test data
TEST_SCHOOL_ID = "school1"
TEST_CLASS_ID = "class1"


class TestFeePaymentAPIs:
    """Test Fee Payment System APIs"""
    
    def test_get_fee_structure(self):
        """Test GET /api/fee-payment/structure/{school_id}/{class_id}"""
        response = requests.get(f"{BASE_URL}/api/fee-payment/structure/{TEST_SCHOOL_ID}/{TEST_CLASS_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data
        assert "class_id" in data
        assert "fee_structure" in data
        assert isinstance(data["fee_structure"], list)
        assert len(data["fee_structure"]) > 0
        
        # Check fee structure has required fields
        fee = data["fee_structure"][0]
        assert "fee_type" in fee
        assert "amount" in fee
        print(f"✅ Fee structure returned {len(data['fee_structure'])} fee types")
        print(f"   Total monthly: ₹{data.get('total_monthly', 0)}")
    
    def test_get_student_fee_status(self):
        """Test GET /api/fee-payment/status/{student_id}"""
        response = requests.get(f"{BASE_URL}/api/fee-payment/status/{STUDENT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "student_id" in data
        assert "summary" in data
        assert "total_paid_this_year" in data["summary"]
        assert "total_pending" in data["summary"]
        print(f"✅ Student fee status: Paid ₹{data['summary']['total_paid_this_year']}, Pending ₹{data['summary']['total_pending']}")
    
    def test_get_student_fee_status_invalid_student(self):
        """Test GET /api/fee-payment/status/{student_id} with invalid student"""
        response = requests.get(f"{BASE_URL}/api/fee-payment/status/INVALID-STUDENT-ID")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Invalid student returns 404")
    
    def test_initiate_payment_upi(self):
        """Test POST /api/fee-payment/initiate with UPI method"""
        payload = {
            "student_id": STUDENT_ID,
            "school_id": TEST_SCHOOL_ID,
            "amount": 2500.0,
            "fee_type": "tuition",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "upi",
            "description": "Test Tuition Fee Payment"
        }
        
        response = requests.post(f"{BASE_URL}/api/fee-payment/initiate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "payment_id" in data
        assert "amount" in data
        assert "status" in data
        assert data["status"] == "initiated"
        assert "upi_url" in data  # UPI specific
        assert "upi_id" in data
        print(f"✅ UPI Payment initiated: {data['payment_id']}")
        return data["payment_id"]
    
    def test_initiate_payment_card(self):
        """Test POST /api/fee-payment/initiate with Card method"""
        payload = {
            "student_id": STUDENT_ID,
            "school_id": TEST_SCHOOL_ID,
            "amount": 1500.0,
            "fee_type": "transport",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "credit_card",
            "description": "Test Transport Fee Payment"
        }
        
        response = requests.post(f"{BASE_URL}/api/fee-payment/initiate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "payment_id" in data
        assert "razorpay_order_id" in data  # Card specific
        print(f"✅ Card Payment initiated: {data['payment_id']}, Razorpay Order: {data['razorpay_order_id']}")
        return data["payment_id"]
    
    def test_verify_payment_success(self):
        """Test POST /api/fee-payment/verify with success status"""
        # First initiate a payment
        init_payload = {
            "student_id": STUDENT_ID,
            "school_id": TEST_SCHOOL_ID,
            "amount": 500.0,
            "fee_type": "exam",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "upi",
            "description": "Test Exam Fee"
        }
        
        init_response = requests.post(f"{BASE_URL}/api/fee-payment/initiate", json=init_payload)
        assert init_response.status_code == 200
        payment_id = init_response.json()["payment_id"]
        
        # Now verify the payment
        verify_payload = {
            "payment_id": payment_id,
            "status": "success"
        }
        
        response = requests.post(f"{BASE_URL}/api/fee-payment/verify", json=verify_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "receipt_number" in data
        assert "receipt" in data
        print(f"✅ Payment verified successfully! Receipt: {data['receipt_number']}")
        return data["receipt_number"]
    
    def test_verify_payment_failed(self):
        """Test POST /api/fee-payment/verify with failed status"""
        # First initiate a payment
        init_payload = {
            "student_id": STUDENT_ID,
            "school_id": TEST_SCHOOL_ID,
            "amount": 100.0,
            "fee_type": "other",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "debit_card",
            "description": "Test Failed Payment"
        }
        
        init_response = requests.post(f"{BASE_URL}/api/fee-payment/initiate", json=init_payload)
        assert init_response.status_code == 200
        payment_id = init_response.json()["payment_id"]
        
        # Verify with failed status
        verify_payload = {
            "payment_id": payment_id,
            "status": "failed"
        }
        
        response = requests.post(f"{BASE_URL}/api/fee-payment/verify", json=verify_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == False
        print("✅ Failed payment handled correctly")
    
    def test_verify_payment_invalid_id(self):
        """Test POST /api/fee-payment/verify with invalid payment ID"""
        verify_payload = {
            "payment_id": "INVALID-PAYMENT-ID",
            "status": "success"
        }
        
        response = requests.post(f"{BASE_URL}/api/fee-payment/verify", json=verify_payload)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Invalid payment ID returns 404")
    
    def test_get_payment_history(self):
        """Test GET /api/fee-payment/history/{student_id}"""
        response = requests.get(f"{BASE_URL}/api/fee-payment/history/{STUDENT_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "student_id" in data
        assert "payments" in data
        assert isinstance(data["payments"], list)
        print(f"✅ Payment history: {len(data['payments'])} payments found")


class TestAIAccountantAPIs:
    """Test AI Accountant Dashboard APIs"""
    
    def test_get_accountant_dashboard(self):
        """Test GET /api/ai-accountant/dashboard/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/dashboard/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data
        assert "month" in data
        assert "overview" in data
        
        overview = data["overview"]
        assert "fee_collected_this_month" in overview
        assert "pending_fees" in overview
        assert "salary_paid_this_month" in overview
        assert "expenses_this_month" in overview
        
        print(f"✅ Dashboard loaded:")
        print(f"   Fee Collected: ₹{overview['fee_collected_this_month']}")
        print(f"   Pending Fees: ₹{overview['pending_fees']}")
        print(f"   Salaries Paid: ₹{overview['salary_paid_this_month']}")
        print(f"   Expenses: ₹{overview['expenses_this_month']}")
    
    def test_get_salary_overview(self):
        """Test GET /api/ai-accountant/salaries/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/salaries/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "month" in data
        assert "school_id" in data
        assert "summary" in data
        assert "salaries" in data
        
        summary = data["summary"]
        assert "total_employees" in summary
        assert "total_net_salary" in summary
        print(f"✅ Salary overview: {summary['total_employees']} employees, Total: ₹{summary['total_net_salary']}")
    
    def test_get_fee_defaulters(self):
        """Test GET /api/ai-accountant/fees/defaulters/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/fees/defaulters/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "month" in data
        assert "total_defaulters" in data
        assert "total_pending_amount" in data
        assert "defaulters" in data
        print(f"✅ Fee defaulters: {data['total_defaulters']} defaulters, Total pending: ₹{data['total_pending_amount']}")
    
    def test_add_expense(self):
        """Test POST /api/ai-accountant/expenses/add"""
        payload = {
            "school_id": TEST_SCHOOL_ID,
            "category": "maintenance",
            "amount": 5000.0,
            "description": "Test Maintenance Expense - AC Repair",
            "vendor_name": "Test Vendor",
            "payment_method": "bank_transfer"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-accountant/expenses/add", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "expense" in data
        assert data["expense"]["amount"] == 5000.0
        print(f"✅ Expense added: {data['expense']['description']} - ₹{data['expense']['amount']}")
    
    def test_get_expenses(self):
        """Test GET /api/ai-accountant/expenses/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/expenses/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data
        assert "total_expenses" in data
        assert "expenses" in data
        print(f"✅ Expenses: {data['count']} records, Total: ₹{data['total_expenses']}")
    
    def test_get_expenses_by_category(self):
        """Test GET /api/ai-accountant/expenses/{school_id}?category=maintenance"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/expenses/{TEST_SCHOOL_ID}?category=maintenance")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["category"] == "maintenance"
        print(f"✅ Maintenance expenses: {data['count']} records")
    
    def test_get_ai_quick_insight(self):
        """Test GET /api/ai-accountant/ai/quick-insight/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/ai/quick-insight/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "insight" in data
        assert "type" in data
        print(f"✅ AI Quick Insight: {data['type']}")
        print(f"   {data['insight'][:100]}...")
    
    def test_get_fee_collection_report(self):
        """Test GET /api/ai-accountant/fees/collection-report/{school_id}"""
        response = requests.get(f"{BASE_URL}/api/ai-accountant/fees/collection-report/{TEST_SCHOOL_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "month" in data
        assert "summary" in data
        assert "by_fee_type" in data
        print(f"✅ Fee collection report: Total ₹{data['summary']['total_collected']}, {data['summary']['total_transactions']} transactions")


class TestAIChapterSummarizer:
    """Test AI Chapter Summarizer API"""
    
    def test_summarize_chapter(self):
        """Test POST /api/syllabus-progress/ai/summarize-chapter"""
        payload = {
            "board": "NCERT",
            "class_num": "10",
            "subject": "Mathematics",
            "chapter_number": 4,
            "chapter_name": "Quadratic Equations",
            "language": "hinglish",
            "include_formulas": True,
            "include_key_points": True
        }
        
        response = requests.post(f"{BASE_URL}/api/syllabus-progress/ai/summarize-chapter", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "chapter" in data
        assert "summary" in data
        assert len(data["summary"]) > 100  # Should have substantial content
        print(f"✅ AI Chapter Summary generated for {data['chapter']['name']}")
        print(f"   Language: {data['language']}, Length: {len(data['summary'])} chars")


class TestSyllabusProgressAPIs:
    """Test Syllabus Progress APIs"""
    
    def test_get_class_progress(self):
        """Test GET /api/syllabus-progress/class/{school_id}/{class_id}"""
        response = requests.get(f"{BASE_URL}/api/syllabus-progress/class/{TEST_SCHOOL_ID}/{TEST_CLASS_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "school_id" in data
        assert "class_id" in data
        assert "subjects" in data
        print(f"✅ Class progress: {data['total_subjects']} subjects tracked")
    
    def test_get_student_syllabus_progress(self):
        """Test GET /api/syllabus-progress/student/{school_id}/{class_id}"""
        response = requests.get(f"{BASE_URL}/api/syllabus-progress/student/{TEST_SCHOOL_ID}/{TEST_CLASS_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "summary" in data
        print(f"✅ Student syllabus progress: {data['summary']}")


class TestIntegration:
    """Integration tests for complete flows"""
    
    def test_complete_payment_flow(self):
        """Test complete payment flow: initiate -> verify -> receipt"""
        # Step 1: Initiate payment
        init_payload = {
            "student_id": STUDENT_ID,
            "school_id": TEST_SCHOOL_ID,
            "amount": 1000.0,
            "fee_type": "books",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "upi",
            "description": "Integration Test - Books Fee"
        }
        
        init_response = requests.post(f"{BASE_URL}/api/fee-payment/initiate", json=init_payload)
        assert init_response.status_code == 200
        payment_id = init_response.json()["payment_id"]
        print(f"Step 1: Payment initiated - {payment_id}")
        
        # Step 2: Verify payment
        verify_payload = {
            "payment_id": payment_id,
            "status": "success"
        }
        
        verify_response = requests.post(f"{BASE_URL}/api/fee-payment/verify", json=verify_payload)
        assert verify_response.status_code == 200
        receipt_number = verify_response.json()["receipt_number"]
        print(f"Step 2: Payment verified - Receipt: {receipt_number}")
        
        # Step 3: Get receipt
        receipt_response = requests.get(f"{BASE_URL}/api/fee-payment/receipt/{receipt_number}")
        assert receipt_response.status_code == 200
        receipt = receipt_response.json()
        assert receipt["amount"] == 1000.0
        print(f"Step 3: Receipt retrieved - Amount: ₹{receipt['amount']}")
        
        # Step 4: Check payment history - Note: history only shows successful payments
        history_response = requests.get(f"{BASE_URL}/api/fee-payment/history/{STUDENT_ID}")
        assert history_response.status_code == 200
        # Payment should be in history now since we verified it as success
        print(f"Step 4: Payment history retrieved - {history_response.json()['total_count']} payments")
        
        print("✅ Complete payment flow successful!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

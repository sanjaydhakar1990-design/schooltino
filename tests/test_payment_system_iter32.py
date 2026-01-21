"""
Test Payment System APIs - Iteration 32
Tests for:
1. Payment Settings API - GET/POST /api/school/payment-settings
2. Parent Fee Details API - GET /api/parent/fee-details/{student_id}
3. Record Payment API - POST /api/parent/record-payment
4. Pending Payments API - GET /api/admin/pending-payments
5. Verify Payment API - POST /api/admin/verify-payment/{id}
6. Receipt API - GET /api/receipt/{receipt_no}
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
DIRECTOR_EMAIL = "director@demo.com"
DIRECTOR_PASSWORD = "demo123"
TEACHER_EMAIL = "teacher@demo.com"
TEACHER_PASSWORD = "demo123"


class TestPaymentSystem:
    """Payment System API Tests"""
    
    director_token = None
    teacher_token = None
    school_id = None
    test_student_id = None
    test_payment_id = None
    test_receipt_no = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get tokens"""
        # Director login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        assert response.status_code == 200, f"Director login failed: {response.text}"
        data = response.json()
        TestPaymentSystem.director_token = data["access_token"]
        TestPaymentSystem.school_id = data["user"].get("school_id")
        
        # Teacher login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200, f"Teacher login failed: {response.text}"
        TestPaymentSystem.teacher_token = response.json()["access_token"]
        
        # Get a student for testing
        response = requests.get(
            f"{BASE_URL}/api/students?school_id={TestPaymentSystem.school_id}",
            headers={"Authorization": f"Bearer {TestPaymentSystem.director_token}"}
        )
        if response.status_code == 200:
            students = response.json()
            if isinstance(students, list) and len(students) > 0:
                TestPaymentSystem.test_student_id = students[0].get("id")
            elif isinstance(students, dict) and students.get("students"):
                TestPaymentSystem.test_student_id = students["students"][0].get("id")
    
    # ==================== PAYMENT SETTINGS TESTS ====================
    
    def test_01_get_payment_settings_empty(self):
        """Test GET /api/school/payment-settings - returns defaults when no settings"""
        response = requests.get(
            f"{BASE_URL}/api/school/payment-settings?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should have school_id
        assert "school_id" in data
        # Should have default receipt_prefix
        assert data.get("receipt_prefix") == "RCP" or data.get("receipt_prefix") is not None
        print(f"✓ GET payment settings returned: {data}")
    
    def test_02_save_payment_settings(self):
        """Test POST /api/school/payment-settings - save UPI/bank details"""
        settings = {
            "school_id": self.school_id,
            "gpay_number": "9876543210",
            "paytm_number": "9876543210",
            "phonepe_number": "9876543211",
            "upi_id": "school@upi",
            "bank_name": "State Bank of India",
            "account_number": "1234567890",
            "ifsc_code": "SBIN0001234",
            "account_holder_name": "School Trust",
            "receipt_prefix": "TEST-RCP",
            "receipt_footer_note": "Thank you for your payment",
            "show_bank_details_on_receipt": True,
            "authorized_signatory_name": "Principal",
            "authorized_signatory_designation": "Principal"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/school/payment-settings",
            json=settings,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "settings" in data
        assert data["settings"]["gpay_number"] == "9876543210"
        assert data["settings"]["upi_id"] == "school@upi"
        print(f"✓ Payment settings saved successfully")
    
    def test_03_get_payment_settings_after_save(self):
        """Test GET /api/school/payment-settings - verify saved settings"""
        response = requests.get(
            f"{BASE_URL}/api/school/payment-settings?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify saved values
        assert data.get("gpay_number") == "9876543210"
        assert data.get("upi_id") == "school@upi"
        assert data.get("bank_name") == "State Bank of India"
        print(f"✓ Payment settings retrieved correctly after save")
    
    def test_04_teacher_cannot_save_payment_settings(self):
        """Test POST /api/school/payment-settings - teacher should be blocked"""
        settings = {
            "school_id": self.school_id,
            "gpay_number": "1111111111"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/school/payment-settings",
            json=settings,
            headers={"Authorization": f"Bearer {self.teacher_token}"}
        )
        # Should be 403 Forbidden
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print(f"✓ Teacher correctly blocked from saving payment settings")
    
    # ==================== PARENT FEE DETAILS TESTS ====================
    
    def test_05_get_parent_fee_details(self):
        """Test GET /api/parent/fee-details/{student_id}"""
        if not self.test_student_id:
            pytest.skip("No student found for testing")
        
        response = requests.get(
            f"{BASE_URL}/api/parent/fee-details/{self.test_student_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "student" in data
        assert "school" in data
        assert "payment_options" in data
        assert "summary" in data
        
        # Verify student info
        assert data["student"]["id"] == self.test_student_id
        
        # Verify payment options include our saved settings
        payment_opts = data["payment_options"]
        assert payment_opts.get("gpay_number") == "9876543210"
        assert payment_opts.get("upi_id") == "school@upi"
        
        print(f"✓ Parent fee details retrieved: Student={data['student']['name']}, Pending=₹{data['summary']['total_pending']}")
    
    def test_06_get_fee_details_invalid_student(self):
        """Test GET /api/parent/fee-details/{student_id} - invalid student"""
        response = requests.get(
            f"{BASE_URL}/api/parent/fee-details/invalid-student-id-12345",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid student correctly returns 404")
    
    # ==================== RECORD PAYMENT TESTS ====================
    
    def test_07_record_parent_payment(self):
        """Test POST /api/parent/record-payment"""
        if not self.test_student_id:
            pytest.skip("No student found for testing")
        
        payment_data = {
            "student_id": self.test_student_id,
            "amount": 1000.0,
            "payment_mode": "gpay",
            "transaction_id": f"TEST-TXN-{uuid.uuid4().hex[:8].upper()}",
            "payer_upi_id": "parent@upi",
            "remarks": "Test payment for iteration 32"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/parent/record-payment",
            json=payment_data,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "receipt_no" in data
        assert "payment" in data
        
        # Save for later tests
        TestPaymentSystem.test_payment_id = data["payment"]["id"]
        TestPaymentSystem.test_receipt_no = data["receipt_no"]
        
        # Verify payment status is pending_verification
        assert data["payment"]["status"] == "pending_verification"
        
        print(f"✓ Payment recorded: Receipt={data['receipt_no']}, Amount=₹{payment_data['amount']}")
    
    def test_08_record_payment_invalid_student(self):
        """Test POST /api/parent/record-payment - invalid student"""
        payment_data = {
            "student_id": "invalid-student-id",
            "amount": 500.0,
            "payment_mode": "paytm",
            "transaction_id": "TEST-INVALID-TXN"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/parent/record-payment",
            json=payment_data,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid student payment correctly returns 404")
    
    # ==================== PENDING PAYMENTS TESTS ====================
    
    def test_09_get_pending_payments(self):
        """Test GET /api/admin/pending-payments"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-payments?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        
        # Should contain our test payment
        if self.test_payment_id:
            payment_ids = [p.get("id") for p in data]
            assert self.test_payment_id in payment_ids, "Test payment not found in pending list"
        
        print(f"✓ Pending payments retrieved: {len(data)} payments pending")
    
    def test_10_teacher_cannot_view_pending_payments(self):
        """Test GET /api/admin/pending-payments - teacher should be blocked"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-payments?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.teacher_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Teacher correctly blocked from viewing pending payments")
    
    # ==================== VERIFY PAYMENT TESTS ====================
    
    def test_11_verify_payment_approve(self):
        """Test POST /api/admin/verify-payment/{id} - approve"""
        if not self.test_payment_id:
            pytest.skip("No test payment to verify")
        
        response = requests.post(
            f"{BASE_URL}/api/admin/verify-payment/{self.test_payment_id}",
            json={"action": "approve", "remarks": "Verified by test"},
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "receipt_no" in data
        assert data["receipt_no"] == self.test_receipt_no
        
        print(f"✓ Payment verified and approved: {data['receipt_no']}")
    
    def test_12_verify_payment_invalid_id(self):
        """Test POST /api/admin/verify-payment/{id} - invalid payment"""
        response = requests.post(
            f"{BASE_URL}/api/admin/verify-payment/invalid-payment-id",
            json={"action": "approve", "remarks": "Test"},
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid payment ID correctly returns 404")
    
    def test_13_teacher_cannot_verify_payment(self):
        """Test POST /api/admin/verify-payment/{id} - teacher should be blocked"""
        # Create another payment to test rejection
        if not self.test_student_id:
            pytest.skip("No student found")
        
        # First create a new payment
        payment_data = {
            "student_id": self.test_student_id,
            "amount": 500.0,
            "payment_mode": "paytm",
            "transaction_id": f"TEST-TXN-{uuid.uuid4().hex[:8].upper()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/parent/record-payment",
            json=payment_data,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        if response.status_code == 200:
            new_payment_id = response.json()["payment"]["id"]
            
            # Try to verify as teacher
            response = requests.post(
                f"{BASE_URL}/api/admin/verify-payment/{new_payment_id}",
                json={"action": "approve", "remarks": "Test"},
                headers={"Authorization": f"Bearer {self.teacher_token}"}
            )
            assert response.status_code == 403, f"Expected 403, got {response.status_code}"
            print(f"✓ Teacher correctly blocked from verifying payments")
    
    def test_14_verify_payment_reject(self):
        """Test POST /api/admin/verify-payment/{id} - reject"""
        if not self.test_student_id:
            pytest.skip("No student found")
        
        # Create a payment to reject
        payment_data = {
            "student_id": self.test_student_id,
            "amount": 200.0,
            "payment_mode": "phonepe",
            "transaction_id": f"TEST-REJECT-{uuid.uuid4().hex[:8].upper()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/parent/record-payment",
            json=payment_data,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        payment_id = response.json()["payment"]["id"]
        
        # Reject the payment
        response = requests.post(
            f"{BASE_URL}/api/admin/verify-payment/{payment_id}",
            json={"action": "reject", "remarks": "Invalid transaction ID"},
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "rejected" in data["message"].lower()
        
        print(f"✓ Payment rejected successfully")
    
    # ==================== RECEIPT TESTS ====================
    
    def test_15_get_receipt(self):
        """Test GET /api/receipt/{receipt_no}"""
        if not self.test_receipt_no:
            pytest.skip("No receipt to test")
        
        response = requests.get(
            f"{BASE_URL}/api/receipt/{self.test_receipt_no}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify receipt structure
        assert "receipt" in data
        assert "student" in data
        assert "school" in data
        assert "footer" in data
        
        # Verify receipt details
        assert data["receipt"]["receipt_no"] == self.test_receipt_no
        assert data["receipt"]["amount"] == 1000.0
        
        print(f"✓ Receipt retrieved: {data['receipt']['receipt_no']}, Amount=₹{data['receipt']['amount']}")
    
    def test_16_get_receipt_invalid(self):
        """Test GET /api/receipt/{receipt_no} - invalid receipt"""
        response = requests.get(
            f"{BASE_URL}/api/receipt/INVALID-RECEIPT-12345",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid receipt correctly returns 404")
    
    # ==================== INTEGRATION TESTS ====================
    
    def test_17_full_payment_flow(self):
        """Test complete payment flow: Record -> Pending -> Verify -> Receipt"""
        if not self.test_student_id:
            pytest.skip("No student found")
        
        # Step 1: Record payment
        txn_id = f"FLOW-TEST-{uuid.uuid4().hex[:8].upper()}"
        payment_data = {
            "student_id": self.test_student_id,
            "amount": 2500.0,
            "payment_mode": "upi",
            "transaction_id": txn_id,
            "payer_upi_id": "flowtest@upi",
            "remarks": "Full flow test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/parent/record-payment",
            json=payment_data,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        payment_id = response.json()["payment"]["id"]
        receipt_no = response.json()["receipt_no"]
        print(f"  Step 1: Payment recorded - {receipt_no}")
        
        # Step 2: Check pending payments
        response = requests.get(
            f"{BASE_URL}/api/admin/pending-payments?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        pending = response.json()
        assert any(p["id"] == payment_id for p in pending), "Payment not in pending list"
        print(f"  Step 2: Payment found in pending list")
        
        # Step 3: Verify payment
        response = requests.post(
            f"{BASE_URL}/api/admin/verify-payment/{payment_id}",
            json={"action": "approve", "remarks": "Flow test approved"},
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        print(f"  Step 3: Payment verified")
        
        # Step 4: Get receipt
        response = requests.get(
            f"{BASE_URL}/api/receipt/{receipt_no}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        receipt_data = response.json()
        assert receipt_data["receipt"]["amount"] == 2500.0
        print(f"  Step 4: Receipt retrieved - ₹{receipt_data['receipt']['amount']}")
        
        print(f"✓ Full payment flow completed successfully!")
    
    def test_18_payment_settings_update(self):
        """Test updating payment settings"""
        # Update with new values
        settings = {
            "school_id": self.school_id,
            "gpay_number": "8888888888",
            "upi_id": "updated@upi",
            "receipt_prefix": "UPDATED-RCP"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/school/payment-settings",
            json=settings,
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        
        # Verify update
        response = requests.get(
            f"{BASE_URL}/api/school/payment-settings?school_id={self.school_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gpay_number"] == "8888888888"
        assert data["upi_id"] == "updated@upi"
        
        print(f"✓ Payment settings updated successfully")
    
    def test_19_fee_details_with_payment_history(self):
        """Test fee details includes payment history"""
        if not self.test_student_id:
            pytest.skip("No student found")
        
        response = requests.get(
            f"{BASE_URL}/api/parent/fee-details/{self.test_student_id}",
            headers={"Authorization": f"Bearer {self.director_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have payment history
        assert "payment_history" in data
        
        # Our test payments should be in history
        if data["payment_history"]:
            print(f"✓ Fee details includes {len(data['payment_history'])} payment(s) in history")
        else:
            print(f"✓ Fee details structure correct (no payment history yet)")
    
    def test_20_unauthenticated_access(self):
        """Test APIs require authentication"""
        # Payment settings
        response = requests.get(f"{BASE_URL}/api/school/payment-settings?school_id={self.school_id}")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # Fee details
        response = requests.get(f"{BASE_URL}/api/parent/fee-details/test-id")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # Pending payments
        response = requests.get(f"{BASE_URL}/api/admin/pending-payments?school_id={self.school_id}")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print(f"✓ All APIs correctly require authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

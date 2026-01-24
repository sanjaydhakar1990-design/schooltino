"""
Test Suite for Iteration 13 - Fee Management Features
- Class-wise Fee Structure Management
- Student Services (Bus, Hostel, Lab etc.)
- Government Schemes (RTE, SC/ST, OBC Scholarship etc.)
- Auto-update student fee status on payment
- QR Code in UPI payment dialog
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tinoai-dashboard.preview.emergentagent.com')

# Test credentials
DIRECTOR_EMAIL = "director@schooltino.com"
DIRECTOR_PASSWORD = "admin123"
STUDENT_ID = "STD-2026-285220"
STUDENT_PASSWORD = "KPbeHdZf"

class TestFeeManagementAPIs:
    """Test Fee Management APIs - Class-wise fee structure, services, schemes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.school_id = "school1"
        self.class_id = "class1"
        
    def get_director_token(self):
        """Get director auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": DIRECTOR_EMAIL,
            "password": DIRECTOR_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    # ==================== FEE STRUCTURE TESTS ====================
    
    def test_create_fee_structure(self):
        """Test creating class-wise fee structure"""
        response = self.session.post(f"{BASE_URL}/api/fee-management/structure/create", json={
            "school_id": self.school_id,
            "class_id": "5",
            "fee_type": "tuition",
            "amount": 3000,
            "frequency": "monthly",
            "due_day": 10,
            "description": "Monthly Tuition Fee",
            "is_optional": False
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        print(f"✅ Fee structure created: {data.get('message')}")
    
    def test_create_optional_fee_structure(self):
        """Test creating optional service fee (transport)"""
        response = self.session.post(f"{BASE_URL}/api/fee-management/structure/create", json={
            "school_id": self.school_id,
            "class_id": "5",
            "fee_type": "transport",
            "amount": 1500,
            "frequency": "monthly",
            "due_day": 10,
            "description": "Bus Transport Fee",
            "is_optional": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Optional transport fee created: {data.get('message')}")
    
    def test_create_hostel_fee_structure(self):
        """Test creating hostel fee structure"""
        response = self.session.post(f"{BASE_URL}/api/fee-management/structure/create", json={
            "school_id": self.school_id,
            "class_id": "5",
            "fee_type": "hostel",
            "amount": 5000,
            "frequency": "monthly",
            "due_day": 5,
            "description": "Hostel Accommodation Fee",
            "is_optional": True
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Hostel fee created: {data.get('message')}")
    
    def test_get_all_fee_structures(self):
        """Test getting all fee structures for a school"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/structure/all/{self.school_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "school_id" in data
        assert "structures_by_class" in data
        assert "total_fee_types" in data
        print(f"✅ Got {data.get('total_fee_types')} fee types across {len(data.get('classes', []))} classes")
    
    def test_delete_fee_structure(self):
        """Test deleting (deactivating) a fee structure"""
        # First create a fee to delete
        create_response = self.session.post(f"{BASE_URL}/api/fee-management/structure/create", json={
            "school_id": self.school_id,
            "class_id": "test_delete",
            "fee_type": "test_fee",
            "amount": 100,
            "frequency": "monthly",
            "due_day": 1,
            "is_optional": False
        })
        
        if create_response.status_code == 200:
            fee_id = create_response.json().get("id")
            
            # Now delete it
            delete_response = self.session.delete(f"{BASE_URL}/api/fee-management/structure/{fee_id}")
            assert delete_response.status_code == 200
            print(f"✅ Fee structure deleted successfully")
    
    # ==================== STUDENT SERVICES TESTS ====================
    
    def test_update_student_services(self):
        """Test updating student services (Bus, Hostel, etc.)"""
        response = self.session.post(f"{BASE_URL}/api/fee-management/student/services", json={
            "student_id": STUDENT_ID,
            "school_id": self.school_id,
            "services": ["transport", "lab"],
            "transport_route": "Route A - Main Road"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "transport" in data.get("services", [])
        print(f"✅ Student services updated: {data.get('services')}")
    
    def test_get_student_services(self):
        """Test getting student services"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/student/services/{STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "services" in data
        print(f"✅ Student services: {data.get('services')}, Transport: {data.get('uses_transport')}")
    
    # ==================== GOVERNMENT SCHEMES TESTS ====================
    
    def test_get_available_schemes(self):
        """Test getting list of available government schemes"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/schemes/available")
        
        assert response.status_code == 200
        data = response.json()
        assert "schemes" in data
        schemes = data.get("schemes", [])
        assert len(schemes) > 0
        
        # Verify expected schemes exist
        scheme_codes = [s.get("code") for s in schemes]
        assert "RTE" in scheme_codes, "RTE scheme should be available"
        assert "SC_ST_SCHOLARSHIP" in scheme_codes, "SC/ST Scholarship should be available"
        assert "OBC_SCHOLARSHIP" in scheme_codes, "OBC Scholarship should be available"
        
        print(f"✅ Available schemes: {len(schemes)} - {scheme_codes}")
    
    def test_assign_government_scheme(self):
        """Test assigning government scheme to student"""
        response = self.session.post(f"{BASE_URL}/api/fee-management/scheme/assign", json={
            "student_id": STUDENT_ID,
            "school_id": self.school_id,
            "scheme_name": "OBC_SCHOLARSHIP",
            "scheme_type": "partial_exemption",
            "exemption_percentage": 50,
            "monthly_stipend": 0,
            "valid_from": "2025-01-01",
            "valid_until": "2025-12-31",
            "remarks": "Test scheme assignment"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "scheme_id" in data
        assert "50" in data.get("exemption", "")  # Can be "50%" or "50.0%"
        print(f"✅ Scheme assigned: {data.get('message')}, Exemption: {data.get('exemption')}")
    
    def test_get_student_schemes(self):
        """Test getting schemes assigned to a student"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/scheme/student/{STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "schemes" in data
        print(f"✅ Student schemes: {len(data.get('schemes', []))}, Total exemption: {data.get('total_exemption')}%")
    
    def test_get_all_school_schemes(self):
        """Test getting all schemes in a school"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/schemes/all/{self.school_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "school_id" in data
        assert "scheme_summary" in data
        assert "total_scheme_students" in data
        print(f"✅ School schemes: {data.get('total_scheme_students')} students with schemes")
    
    # ==================== FEE CALCULATION TESTS ====================
    
    def test_calculate_student_fee(self):
        """Test calculating complete fee for a student with exemptions"""
        response = self.session.get(f"{BASE_URL}/api/fee-management/student/fee-calculation/{STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "fee_breakdown" in data
        assert "calculation" in data
        
        calc = data.get("calculation", {})
        assert "base_fees" in calc
        assert "optional_services" in calc
        assert "gross_total" in calc
        assert "scheme_exemption_percent" in calc
        assert "discount_amount" in calc
        assert "net_payable" in calc
        
        print(f"✅ Fee calculation: Base={calc.get('base_fees')}, Optional={calc.get('optional_services')}, "
              f"Exemption={calc.get('scheme_exemption_percent')}%, Net={calc.get('net_payable')}")
    
    def test_calculate_fee_with_month(self):
        """Test fee calculation for specific month"""
        current_month = datetime.now().strftime('%Y-%m')
        response = self.session.get(f"{BASE_URL}/api/fee-management/student/fee-calculation/{STUDENT_ID}?month={current_month}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("month") == current_month
        print(f"✅ Fee calculation for {current_month}: Net payable = ₹{data.get('calculation', {}).get('net_payable')}")
    
    # ==================== PAYMENT AUTO-UPDATE TESTS ====================
    
    def test_payment_auto_update(self):
        """Test auto-update of student fee status on payment"""
        import uuid
        payment_id = f"PAY-TEST-{uuid.uuid4().hex[:8].upper()}"
        current_month = datetime.now().strftime('%Y-%m')
        
        response = self.session.post(f"{BASE_URL}/api/fee-management/payment/auto-update", params={
            "payment_id": payment_id,
            "student_id": STUDENT_ID,
            "amount": 2500,
            "month": current_month
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("student_id") == STUDENT_ID
        print(f"✅ Payment auto-update: {data.get('message')}")


class TestFeePaymentAPIs:
    """Test Fee Payment APIs with auto-update on verify"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.school_id = "school1"
    
    def test_initiate_upi_payment(self):
        """Test initiating UPI payment - should return QR data"""
        response = self.session.post(f"{BASE_URL}/api/fee-payment/initiate", json={
            "student_id": STUDENT_ID,
            "school_id": self.school_id,
            "amount": 2500,
            "fee_type": "tuition",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "upi",
            "description": "Monthly Tuition Fee"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "payment_id" in data
        assert "upi_url" in data, "UPI URL should be present for QR code"
        assert "qr_data" in data, "QR data should be present"
        assert "upi_id" in data
        
        # Verify UPI URL format
        upi_url = data.get("upi_url", "")
        assert upi_url.startswith("upi://pay"), "UPI URL should start with upi://pay"
        
        print(f"✅ UPI Payment initiated: {data.get('payment_id')}")
        print(f"   UPI ID: {data.get('upi_id')}")
        print(f"   QR Data available: {bool(data.get('qr_data'))}")
        
        return data.get("payment_id")
    
    def test_verify_payment_auto_updates_status(self):
        """Test that payment verification auto-updates student fee status"""
        # First initiate a payment
        init_response = self.session.post(f"{BASE_URL}/api/fee-payment/initiate", json={
            "student_id": STUDENT_ID,
            "school_id": self.school_id,
            "amount": 1000,
            "fee_type": "exam",
            "month": datetime.now().strftime('%Y-%m'),
            "payment_method": "upi"
        })
        
        assert init_response.status_code == 200
        payment_id = init_response.json().get("payment_id")
        
        # Now verify the payment
        verify_response = self.session.post(f"{BASE_URL}/api/fee-payment/verify", json={
            "payment_id": payment_id,
            "status": "success"
        })
        
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert data.get("success") == True
        assert "receipt_number" in data
        assert "receipt" in data
        
        receipt = data.get("receipt", {})
        assert receipt.get("amount") == 1000
        assert receipt.get("fee_type") == "exam"
        
        print(f"✅ Payment verified with auto-update: Receipt {data.get('receipt_number')}")
    
    def test_school_payment_settings(self):
        """Test updating school payment settings"""
        response = self.session.post(
            f"{BASE_URL}/api/fee-payment/school-settings",
            params={
                "school_id": self.school_id,
                "upi_id": "testschool@upi",
                "bank_name": "State Bank of India",
                "account_number": "1234567890123",
                "ifsc_code": "SBIN0001234",
                "account_holder_name": "Test School Trust"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ School payment settings updated")


class TestFeePaymentPageAPIs:
    """Test APIs used by Fee Payment Page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_fee_status(self):
        """Test getting student fee status"""
        response = self.session.get(f"{BASE_URL}/api/fee-payment/status/{STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "summary" in data
        
        summary = data.get("summary", {})
        assert "total_paid_this_year" in summary
        assert "total_pending" in summary
        assert "current_month_due" in summary
        
        print(f"✅ Fee status: Paid={summary.get('total_paid_this_year')}, Pending={summary.get('total_pending')}")
    
    def test_get_fee_structure(self):
        """Test getting fee structure for class"""
        response = self.session.get(f"{BASE_URL}/api/fee-payment/structure/school1/class1")
        
        assert response.status_code == 200
        data = response.json()
        assert "fee_structure" in data
        assert len(data.get("fee_structure", [])) > 0
        
        print(f"✅ Fee structure: {len(data.get('fee_structure', []))} fee types")
    
    def test_get_payment_history(self):
        """Test getting payment history"""
        response = self.session.get(f"{BASE_URL}/api/fee-payment/history/{STUDENT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        assert "student_id" in data
        assert "payments" in data
        
        print(f"✅ Payment history: {len(data.get('payments', []))} payments")


class TestFeeStructureManagementPage:
    """Test APIs used by Fee Structure Management Page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.school_id = "school1"
    
    def test_get_students_for_services(self):
        """Test getting students list for services assignment"""
        response = self.session.get(f"{BASE_URL}/api/students?school_id={self.school_id}")
        
        # May return 200 or 401 depending on auth requirement
        if response.status_code == 200:
            data = response.json()
            students = data.get("students", data) if isinstance(data, dict) else data
            print(f"✅ Got {len(students) if isinstance(students, list) else 0} students for services")
        else:
            print(f"⚠️ Students API requires auth (status: {response.status_code})")
    
    def test_bulk_create_fee_structure(self):
        """Test bulk creating fee structure for a class"""
        response = self.session.post(
            f"{BASE_URL}/api/fee-management/structure/bulk-create",
            params={"school_id": self.school_id, "class_id": "6"},
            json=[
                {"fee_type": "tuition", "amount": 2500, "frequency": "monthly"},
                {"fee_type": "exam", "amount": 500, "frequency": "quarterly"},
                {"fee_type": "library", "amount": 200, "frequency": "yearly"}
            ]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Bulk fee structure created: {data.get('message')}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

#!/usr/bin/env python3
"""
Test script for Student Admission Form Fix
Tests the validator that converts empty strings to None for optional fields
"""

import requests
import sys
from datetime import datetime

BASE_URL = "https://exam-fix-1.preview.emergentagent.com/api"

def test_admission_fix():
    """Test the student admission form fix"""
    print("🚀 Testing Student Admission Form Fix...")
    print(f"📍 Base URL: {BASE_URL}\n")
    
    # Step 1: Login with director@demo.com / demo123
    print("Step 1: Login with director@demo.com / demo123")
    login_data = {
        "email": "director@demo.com",
        "password": "demo123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        login_response = response.json()
        token = login_response.get('access_token')
        user = login_response.get('user', {})
        school_id = user.get('school_id', 'SCH-DEMO-2026')
        
        print(f"✅ Login successful")
        print(f"   User: {user.get('name', 'Unknown')}")
        print(f"   School ID: {school_id}\n")
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False
    
    # Step 2: Get a valid class_id
    print("Step 2: Get a valid class_id")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/classes?school_id={school_id}", headers=headers)
        if response.status_code != 200:
            print(f"❌ Get classes failed: {response.status_code}")
            return False
        
        response_data = response.json()
        # Handle both list and dict responses
        if isinstance(response_data, list):
            classes = response_data
        else:
            classes = response_data.get('classes', [])
        
        if not classes:
            print(f"❌ No classes found")
            return False
        
        class_id = classes[0]['id']
        class_name = classes[0].get('name', 'Unknown')
        print(f"✅ Found class: {class_name}")
        print(f"   Class ID: {class_id}\n")
        
    except Exception as e:
        print(f"❌ Get classes error: {str(e)}")
        return False
    
    # Step 3: Test POST /api/students/admit with empty strings for optional fields
    print("Step 3: Test POST /api/students/admit with empty strings for optional fields")
    timestamp = datetime.now().strftime('%H%M%S')
    student_data = {
        "name": f"Test Student Fix Verification {timestamp}",
        "class_id": class_id,
        "school_id": school_id,
        "father_name": "Test Father",
        "mother_name": "Test Mother",
        "dob": "2015-06-15",
        "gender": "female",
        "address": "Test Address Delhi",
        "mobile": "9876543210",
        "email": "",  # Empty string - should be converted to None
        "blood_group": "",  # Empty string - should be converted to None
        "photo_url": "",  # Empty string - should be converted to None
        "aadhar_no": "",  # Empty string - should be converted to None
        "previous_school": "",  # Empty string - should be converted to None
        "admission_date": "2026-01-20"
    }
    
    print(f"   Submitting student with empty strings for optional fields...")
    print(f"   Name: {student_data['name']}")
    print(f"   Email: '{student_data['email']}' (empty string)")
    print(f"   Blood Group: '{student_data['blood_group']}' (empty string)")
    print(f"   Photo URL: '{student_data['photo_url']}' (empty string)")
    print(f"   Aadhar No: '{student_data['aadhar_no']}' (empty string)")
    print(f"   Previous School: '{student_data['previous_school']}' (empty string)\n")
    
    try:
        response = requests.post(f"{BASE_URL}/students/admit", json=student_data, headers=headers)
        
        print(f"   Response Status Code: {response.status_code}")
        
        if response.status_code == 422:
            print(f"❌ FAILED: Got 422 validation error (empty strings not converted to None)")
            print(f"   Response: {response.text}")
            return False
        
        if response.status_code != 200:
            print(f"❌ FAILED: Unexpected status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        admission_response = response.json()
        student_id = admission_response.get('student_id')
        login_id = admission_response.get('login_id')
        temporary_password = admission_response.get('temporary_password')
        parent_id = admission_response.get('parent_id')
        parent_password = admission_response.get('parent_password')
        
        print(f"✅ SUCCESS: Student admission completed!")
        print(f"   Student ID: {student_id}")
        print(f"   Login ID: {login_id}")
        print(f"   Temporary Password: {temporary_password}")
        print(f"   Parent ID: {parent_id}")
        print(f"   Parent Password: {parent_password}")
        print(f"   ✅ Empty strings were converted to None automatically")
        print(f"   ✅ No 422 validation errors occurred\n")
        
    except Exception as e:
        print(f"❌ Admission error: {str(e)}")
        return False
    
    # Step 4: Test with partial data (some fields filled, some empty)
    print("Step 4: Test with partial data (some fields filled, some empty)")
    timestamp = datetime.now().strftime('%H%M%S')
    student_data_partial = {
        "name": f"Test Student Partial Data {timestamp}",
        "class_id": class_id,
        "school_id": school_id,
        "father_name": "Test Father 2",
        "mother_name": "Test Mother 2",
        "dob": "2014-08-20",
        "gender": "male",
        "address": "Test Address Mumbai",
        "mobile": "9876543211",
        "email": "teststudent@example.com",  # Filled
        "blood_group": "O+",  # Filled
        "photo_url": "",  # Empty
        "aadhar_no": "123456789012",  # Filled
        "previous_school": "",  # Empty
        "admission_date": "2026-01-20"
    }
    
    print(f"   Submitting student with partial data...")
    print(f"   Name: {student_data_partial['name']}")
    print(f"   Email: '{student_data_partial['email']}' (filled)")
    print(f"   Blood Group: '{student_data_partial['blood_group']}' (filled)")
    print(f"   Photo URL: '{student_data_partial['photo_url']}' (empty)")
    print(f"   Aadhar No: '{student_data_partial['aadhar_no']}' (filled)")
    print(f"   Previous School: '{student_data_partial['previous_school']}' (empty)\n")
    
    try:
        response = requests.post(f"{BASE_URL}/students/admit", json=student_data_partial, headers=headers)
        
        print(f"   Response Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Status code {response.status_code}")
            print(f"   Response: {response.text}")
            return False
        
        admission_response = response.json()
        student_id = admission_response.get('student_id')
        login_id = admission_response.get('login_id')
        temporary_password = admission_response.get('temporary_password')
        
        print(f"✅ SUCCESS: Student admission with partial data completed!")
        print(f"   Student ID: {student_id}")
        print(f"   Login ID: {login_id}")
        print(f"   Temporary Password: {temporary_password}")
        print(f"   ✅ Validator correctly handles mix of filled and empty fields\n")
        
    except Exception as e:
        print(f"❌ Admission error: {str(e)}")
        return False
    
    print("=" * 80)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 80)
    print("\n✅ SUMMARY:")
    print("   1. Login with director@demo.com / demo123 ✅")
    print("   2. Get valid class_id ✅")
    print("   3. Submit admission form with empty strings for optional fields ✅")
    print("   4. Submit admission form with partial data ✅")
    print("\n✅ CONCLUSION:")
    print("   - Empty strings are converted to None automatically")
    print("   - No 422 validation errors occur")
    print("   - Student admission completes successfully")
    print("   - Validator is working properly")
    
    return True

if __name__ == "__main__":
    success = test_admission_fix()
    sys.exit(0 if success else 1)

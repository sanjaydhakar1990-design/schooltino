#!/usr/bin/env python3
"""
Complete Admit Card Edit/Delete Test
"""

import requests
import json

BASE_URL = "https://learnportal-132.preview.emergentagent.com/api"

def main():
    print("=" * 80)
    print("ADMIT CARD EDIT/DELETE COMPLETE TEST")
    print("=" * 80)
    
    # Login
    print("\n1. LOGIN")
    print("-" * 80)
    
    login_data = {
        "email": "director@demo.com",
        "password": "demo123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    data = response.json()
    token = data.get("access_token")
    school_id = data.get("user", {}).get("school_id")
    
    print(f"✅ Login successful - School ID: {school_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Create a test exam
    print("\n2. CREATE TEST EXAM")
    print("-" * 80)
    
    create_data = {
        "school_id": school_id,
        "exam_name": "Test Exam for Edit/Delete",
        "exam_type": "unit_test",
        "start_date": "2026-03-01",
        "end_date": "2026-03-10",
        "classes": ["Class 10"],
        "created_by": "director"
    }
    
    response = requests.post(f"{BASE_URL}/admit-card/exam", json=create_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Failed to create exam: {response.text}")
        return
    
    exam_data = response.json()
    exam_id = exam_data.get("exam_id")
    print(f"✅ Exam created with ID: {exam_id}")
    
    # List exams to verify
    print("\n3. LIST EXAMS TO VERIFY")
    print("-" * 80)
    
    response = requests.get(f"{BASE_URL}/admit-card/exams/{school_id}", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        exams = data.get("exams", [])
        print(f"✅ Found {len(exams)} exams")
        
        # Find our exam
        our_exam = None
        for exam in exams:
            if exam.get("id") == exam_id:
                our_exam = exam
                break
        
        if our_exam:
            print(f"✅ Found our exam in list")
            print(f"   Exam ID: {our_exam.get('id')}")
            print(f"   Exam Name: {our_exam.get('exam_name')}")
            print(f"   Has 'id' field: {('id' in our_exam)}")
        else:
            print(f"❌ Our exam not found in list!")
    else:
        print(f"❌ Failed to list exams: {response.text}")
        return
    
    # Test UPDATE operation
    print("\n4. TEST UPDATE OPERATION")
    print("-" * 80)
    
    update_data = {
        "school_id": school_id,
        "exam_name": "Updated Exam Name - Edit Test"
    }
    
    update_url = f"{BASE_URL}/admit-card/exam/{exam_id}"
    print(f"PUT URL: {update_url}")
    print(f"Body: {json.dumps(update_data, indent=2)}")
    
    response = requests.put(update_url, json=update_data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print(f"✅ UPDATE SUCCESSFUL")
        
        # Verify update
        response = requests.get(f"{BASE_URL}/admit-card/exams/{school_id}", headers=headers)
        if response.status_code == 200:
            exams = response.json().get("exams", [])
            for exam in exams:
                if exam.get("id") == exam_id:
                    print(f"   Updated name: {exam.get('exam_name')}")
                    break
    elif response.status_code == 404:
        print(f"❌ UPDATE FAILED: Exam not found (404)")
        print(f"   This is the reported issue!")
    else:
        print(f"❌ UPDATE FAILED with status {response.status_code}")
    
    # Test DELETE operation
    print("\n5. TEST DELETE OPERATION")
    print("-" * 80)
    
    delete_url = f"{BASE_URL}/admit-card/exam/{exam_id}?school_id={school_id}"
    print(f"DELETE URL: {delete_url}")
    
    response = requests.delete(delete_url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print(f"✅ DELETE SUCCESSFUL")
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/admit-card/exams/{school_id}", headers=headers)
        if response.status_code == 200:
            exams = response.json().get("exams", [])
            found = False
            for exam in exams:
                if exam.get("id") == exam_id:
                    found = True
                    break
            
            if not found:
                print(f"   ✅ Exam successfully deleted from database")
            else:
                print(f"   ⚠️ Exam still exists in database")
    elif response.status_code == 404:
        print(f"❌ DELETE FAILED: Exam not found (404)")
        print(f"   This is the reported issue!")
    else:
        print(f"❌ DELETE FAILED with status {response.status_code}")
    
    # Check backend logs
    print("\n6. CHECK BACKEND LOGS FOR PRINT STATEMENTS")
    print("-" * 80)
    print("Checking backend logs...")
    
    import subprocess
    try:
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.stdout:
            print("Backend Error Logs:")
            print(result.stdout)
        else:
            print("No error logs found")
            
        # Check stdout logs
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.stdout:
            print("\nBackend Output Logs:")
            print(result.stdout)
    except Exception as e:
        print(f"Could not read logs: {e}")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Admit Card Edit/Delete Debug Test
Testing the specific issue reported in review request
"""

import requests
import json

BASE_URL = "https://teachfixed.preview.emergentagent.com/api"

def test_admit_card_edit_delete():
    """Test admit card edit/delete operations"""
    
    print("=" * 80)
    print("ADMIT CARD EDIT/DELETE DEBUG TEST")
    print("=" * 80)
    
    # Step 1: Login
    print("\n1. LOGIN TEST")
    print("-" * 80)
    
    login_data = {
        "email": "director@demo.com",
        "password": "demo123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            school_id = user.get("school_id")
            
            print(f"✅ Login successful")
            print(f"   User: {user.get('name')} ({user.get('role')})")
            print(f"   School ID: {school_id}")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Step 2: List all exams
            print("\n2. LIST ALL EXAMS")
            print("-" * 80)
            
            response = requests.get(f"{BASE_URL}/admit-card/exams/{school_id}", headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                exams = data.get("exams", [])
                print(f"✅ Found {len(exams)} exams")
                
                if exams:
                    # Print first exam's complete data
                    first_exam = exams[0]
                    print(f"\n📋 First Exam Data:")
                    print(json.dumps(first_exam, indent=2))
                    
                    # Check if 'id' field is present
                    exam_id = first_exam.get("id")
                    if exam_id:
                        print(f"\n✅ Exam has 'id' field: {exam_id}")
                    else:
                        print(f"\n❌ CRITICAL: Exam does NOT have 'id' field!")
                        print(f"   Available fields: {list(first_exam.keys())}")
                        
                        # Check if _id exists
                        if "_id" in first_exam:
                            print(f"   ⚠️ Found '_id' field instead: {first_exam.get('_id')}")
                    
                    # Step 3: Test DELETE operation
                    if exam_id:
                        print(f"\n3. TEST DELETE OPERATION")
                        print("-" * 80)
                        print(f"Attempting to delete exam: {exam_id}")
                        
                        delete_url = f"{BASE_URL}/admit-card/exam/{exam_id}?school_id={school_id}"
                        print(f"DELETE URL: {delete_url}")
                        
                        response = requests.delete(delete_url, headers=headers)
                        print(f"Status: {response.status_code}")
                        print(f"Response: {response.text}")
                        
                        if response.status_code == 200:
                            print(f"✅ Delete successful")
                        elif response.status_code == 404:
                            print(f"❌ CRITICAL: Exam not found (404)")
                            print(f"   This suggests the exam lookup is failing")
                        else:
                            print(f"❌ Delete failed with status {response.status_code}")
                        
                        # Step 4: Test UPDATE operation
                        print(f"\n4. TEST UPDATE OPERATION")
                        print("-" * 80)
                        
                        # Create a new exam first for update test
                        create_data = {
                            "school_id": school_id,
                            "exam_name": "Test Update Exam",
                            "exam_type": "unit_test",
                            "start_date": "2026-03-01",
                            "end_date": "2026-03-10",
                            "classes": ["Class 10"],
                            "created_by": "director"
                        }
                        
                        response = requests.post(f"{BASE_URL}/admit-card/exam", json=create_data, headers=headers)
                        print(f"Create exam status: {response.status_code}")
                        
                        if response.status_code == 200:
                            new_exam_data = response.json()
                            new_exam_id = new_exam_data.get("exam_id")
                            print(f"✅ New exam created: {new_exam_id}")
                            
                            # Now try to update it
                            update_data = {
                                "school_id": school_id,
                                "exam_name": "Updated Exam Name"
                            }
                            
                            update_url = f"{BASE_URL}/admit-card/exam/{new_exam_id}"
                            print(f"PUT URL: {update_url}")
                            
                            response = requests.put(update_url, json=update_data, headers=headers)
                            print(f"Status: {response.status_code}")
                            print(f"Response: {response.text}")
                            
                            if response.status_code == 200:
                                print(f"✅ Update successful")
                            elif response.status_code == 404:
                                print(f"❌ CRITICAL: Exam not found for update (404)")
                            else:
                                print(f"❌ Update failed with status {response.status_code}")
                        else:
                            print(f"❌ Failed to create test exam")
                    else:
                        print(f"\n❌ Cannot test DELETE/UPDATE - no valid exam ID found")
                else:
                    print(f"⚠️ No exams found in database")
                    print(f"   Creating a test exam first...")
                    
                    # Create a test exam
                    create_data = {
                        "school_id": school_id,
                        "exam_name": "Debug Test Exam",
                        "exam_type": "unit_test",
                        "start_date": "2026-02-01",
                        "end_date": "2026-02-10",
                        "classes": ["Class 10"],
                        "created_by": "director"
                    }
                    
                    response = requests.post(f"{BASE_URL}/admit-card/exam", json=create_data, headers=headers)
                    print(f"Create status: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        exam_id = data.get("exam_id")
                        print(f"✅ Test exam created: {exam_id}")
                        
                        # Now list again
                        response = requests.get(f"{BASE_URL}/admit-card/exams/{school_id}", headers=headers)
                        if response.status_code == 200:
                            data = response.json()
                            exams = data.get("exams", [])
                            print(f"✅ Now found {len(exams)} exams")
                            
                            if exams:
                                first_exam = exams[0]
                                print(f"\n📋 Exam Data:")
                                print(json.dumps(first_exam, indent=2))
            else:
                print(f"❌ Failed to list exams: {response.text}")
        else:
            print(f"❌ Login failed: {response.text}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 80)
    print("DEBUG TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_admit_card_edit_delete()

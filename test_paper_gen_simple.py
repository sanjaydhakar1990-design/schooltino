#!/usr/bin/env python3
"""
Simple Paper Generation Test
"""

import requests
import json

BASE_URL = "https://form-submit-fix-3.preview.emergentagent.com/api"
TEST_EMAIL = "director@test.com"
TEST_PASSWORD = "test1234"

# Login
print("🔐 Logging in...")
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
})

if response.status_code != 200:
    print(f"❌ Login failed")
    exit(1)

token = response.json()["access_token"]
print(f"✅ Login successful")

# Test paper generation with simpler request
print("\n📝 Testing paper generation...")
paper_request = {
    "subject": "Mathematics",
    "class_name": "Class 10",
    "chapter": "Real Numbers, Polynomials",
    "chapters": ["Real Numbers", "Polynomials"],
    "exam_name": "Unit Test 1",
    "difficulty": "medium",
    "question_types": ["mcq", "short"],
    "total_marks": 20,
    "time_duration": 45,
    "language": "english"
}

print(f"Request: {json.dumps(paper_request, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/ai/generate-paper",
        json=paper_request,
        headers={"Authorization": f"Bearer {token}"},
        timeout=90
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Paper generated successfully!")
        print(f"   Total marks: {data.get('total_marks')}")
        print(f"   Questions: {len(data.get('questions', []))}")
        print(f"   Exam name: {data.get('exam_name')}")
        
        # Check for professional prompt indicators
        questions = data.get('questions', [])
        if questions:
            print(f"\n📋 Sample Question:")
            q = questions[0]
            print(f"   Type: {q.get('type')}")
            print(f"   Question: {q.get('question', '')[:100]}...")
            print(f"   Marks: {q.get('marks')}")
            print(f"   Has Answer: {'✅' if q.get('answer') else '❌'}")
    else:
        print(f"❌ Paper generation failed")
        print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")

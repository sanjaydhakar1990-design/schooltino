import json
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
from datetime import datetime

async def import_data():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'schooltino')
    
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return
    
    print(f"Connecting to MongoDB: {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    with open('school_data_export.json', 'r') as f:
        data = json.load(f)
    
    school = data.get('school', {})
    if school:
        await db.schools.delete_many({"id": school["id"]})
        await db.schools.insert_one(school)
        print(f"Imported school: {school['name']}")
    
    users = data.get('users', [])
    default_password = bcrypt.hashpw("Test@123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    for user in users:
        await db.users.delete_many({"id": user["id"]})
        user['password'] = default_password
        await db.users.insert_one(user)
        print(f"Imported user: {user['name']} ({user['email']}) - role: {user['role']}")
    
    classes = data.get('classes', [])
    for cls in classes:
        await db.classes.delete_many({"id": cls["id"]})
        await db.classes.insert_one(cls)
        print(f"Imported class: {cls['name']}")
    
    students = data.get('students', [])
    for student in students:
        await db.students.delete_many({"id": student["id"]})
        await db.students.insert_one(student)
        print(f"Imported student: {student['name']}")
    
    subject_allocations = data.get('subject_allocations', [])
    for sa in subject_allocations:
        await db.subject_allocations.delete_many({"id": sa["id"]})
        await db.subject_allocations.insert_one(sa)
        print(f"Imported subject allocation: {sa.get('class_name', '')} - {sa.get('subject_name', '')}")
    
    timetables = data.get('timetables', [])
    for tt in timetables:
        await db.timetable.delete_many({"id": tt["id"]})
        await db.timetable.insert_one(tt)
        print(f"Imported timetable: {tt.get('class_name', '')} - {tt.get('day', '')} Period {tt.get('period', '')}")
    
    print("\n=== IMPORT COMPLETE ===")
    print(f"School: {school.get('name', 'N/A')}")
    print(f"Users: {len(users)}")
    print(f"Classes: {len(classes)}")
    print(f"Students: {len(students)}")
    print(f"Subject Allocations: {len(subject_allocations)}")
    print(f"Timetables: {len(timetables)}")
    print("\n=== LOGIN CREDENTIALS ===")
    print("All users password has been set to: Test@123")
    for user in users:
        print(f"  {user['role']}: {user['email']} / Test@123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_data())

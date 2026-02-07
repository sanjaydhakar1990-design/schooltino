import json
import os
import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def import_data():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'schooltino')
    
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return
    
    print(f"Connecting to MongoDB: {db_name}...")
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[db_name]
    
    try:
        await client.admin.command('ping')
        print("Connected successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
        return
    
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
    
    staff = data.get('staff', [])
    for s in staff:
        await db.staff.delete_many({"id": s["id"]})
        await db.staff.insert_one(s)
        print(f"Imported staff: {s.get('name', '')}")
    
    employees = data.get('employees', [])
    for emp in employees:
        await db.employees.delete_many({"id": emp["id"]})
        await db.employees.insert_one(emp)
        print(f"Imported employee: {emp.get('name', '')}")
    
    attendance = data.get('attendance_sample', [])
    for att in attendance:
        att_id = att.get('id', att.get('_id', ''))
        if att_id:
            await db.attendance.delete_many({"id": att_id})
        await db.attendance.insert_one(att)
        print(f"Imported attendance record")
    
    homework = data.get('homework', [])
    for hw in homework:
        hw_id = hw.get('id', hw.get('_id', ''))
        if hw_id:
            await db.homework.delete_many({"id": hw_id})
        await db.homework.insert_one(hw)
        print(f"Imported homework: {hw.get('title', hw.get('subject', ''))}")
    
    notices = data.get('notices', [])
    for notice in notices:
        n_id = notice.get('id', notice.get('_id', ''))
        if n_id:
            await db.notices.delete_many({"id": n_id})
        await db.notices.insert_one(notice)
        print(f"Imported notice: {notice.get('title', '')}")
    
    print("\n=== IMPORT COMPLETE ===")
    print(f"School: {school.get('name', 'N/A')}")
    print(f"Users: {len(users)}")
    print(f"Classes: {len(classes)}")
    print(f"Students: {len(students)}")
    print(f"Subject Allocations: {len(subject_allocations)}")
    print(f"Timetables: {len(timetables)}")
    print(f"Staff: {len(staff)}")
    print(f"Employees: {len(employees)}")
    print(f"Attendance: {len(attendance)}")
    print(f"Homework: {len(homework)}")
    print(f"Notices: {len(notices)}")
    print("\n=== LOGIN CREDENTIALS ===")
    print("All users password: Test@123")
    for user in users:
        print(f"  {user['role']}: {user['email']} / Test@123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_data())

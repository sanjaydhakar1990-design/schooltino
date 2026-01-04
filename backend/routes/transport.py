"""
Vehicle/Transport Management Module
- Bus routes and stops
- Vehicle tracking (GPS simulation for now)
- Driver management
- Student transport assignment
- Route optimization
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
import random

load_dotenv()

router = APIRouter(prefix="/transport", tags=["Transport Management"])

# Database connection
def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    return client[os.environ['DB_NAME']]

db = None
def get_database():
    global db
    if db is None:
        db = get_db()
    return db

# Models
class Vehicle(BaseModel):
    vehicle_number: str
    vehicle_type: str = "bus"  # bus, van, auto
    capacity: int
    driver_name: str
    driver_phone: str
    driver_license: Optional[str] = None
    conductor_name: Optional[str] = None
    conductor_phone: Optional[str] = None
    gps_device_id: Optional[str] = None
    insurance_expiry: Optional[str] = None
    fitness_expiry: Optional[str] = None

class BusRoute(BaseModel):
    route_name: str
    route_number: str
    vehicle_id: Optional[str] = None
    stops: List[dict]  # [{name, time, lat, lng}]
    morning_start_time: str
    evening_start_time: str
    monthly_fee: float = 0

class StudentTransport(BaseModel):
    student_id: str
    route_id: str
    pickup_stop: str
    drop_stop: str
    transport_type: str = "both"  # pickup, drop, both

# API Endpoints

@router.post("/vehicles")
async def add_vehicle(vehicle: Vehicle, school_id: str):
    """Add a new vehicle"""
    db = get_database()
    
    vehicle_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_type": vehicle.vehicle_type,
        "capacity": vehicle.capacity,
        "driver": {
            "name": vehicle.driver_name,
            "phone": vehicle.driver_phone,
            "license": vehicle.driver_license
        },
        "conductor": {
            "name": vehicle.conductor_name,
            "phone": vehicle.conductor_phone
        } if vehicle.conductor_name else None,
        "gps_device_id": vehicle.gps_device_id,
        "documents": {
            "insurance_expiry": vehicle.insurance_expiry,
            "fitness_expiry": vehicle.fitness_expiry
        },
        "status": "active",
        "current_location": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vehicles.insert_one(vehicle_doc)
    vehicle_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Vehicle {vehicle.vehicle_number} added",
        "vehicle": vehicle_doc
    }

@router.get("/vehicles")
async def get_vehicles(school_id: str):
    """Get all vehicles"""
    db = get_database()
    
    vehicles = await db.vehicles.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(length=100)
    
    return {
        "total": len(vehicles),
        "vehicles": vehicles
    }

@router.post("/routes")
async def create_route(route: BusRoute, school_id: str):
    """Create a bus route"""
    db = get_database()
    
    route_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "route_name": route.route_name,
        "route_number": route.route_number,
        "vehicle_id": route.vehicle_id,
        "stops": route.stops,
        "morning_start_time": route.morning_start_time,
        "evening_start_time": route.evening_start_time,
        "monthly_fee": route.monthly_fee,
        "total_students": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bus_routes.insert_one(route_doc)
    route_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Route {route.route_name} created",
        "route": route_doc
    }

@router.get("/routes")
async def get_routes(school_id: str):
    """Get all bus routes"""
    db = get_database()
    
    routes = await db.bus_routes.find(
        {"school_id": school_id},
        {"_id": 0}
    ).to_list(length=100)
    
    return {
        "total": len(routes),
        "routes": routes
    }

@router.get("/routes/{route_id}")
async def get_route_details(route_id: str, school_id: str):
    """Get route details with assigned students"""
    db = get_database()
    
    route = await db.bus_routes.find_one(
        {"id": route_id, "school_id": school_id},
        {"_id": 0}
    )
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Get students on this route
    assignments = await db.student_transport.find(
        {"route_id": route_id, "school_id": school_id},
        {"_id": 0}
    ).to_list(length=200)
    
    # Get vehicle details
    vehicle = None
    if route.get("vehicle_id"):
        vehicle = await db.vehicles.find_one(
            {"id": route["vehicle_id"]},
            {"_id": 0}
        )
    
    return {
        "route": route,
        "vehicle": vehicle,
        "students": assignments,
        "student_count": len(assignments)
    }

@router.post("/assign-student")
async def assign_student_transport(assignment: StudentTransport, school_id: str):
    """Assign student to a transport route"""
    db = get_database()
    
    # Verify student
    student = await db.students.find_one({
        "student_id": assignment.student_id,
        "school_id": school_id
    })
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Verify route
    route = await db.bus_routes.find_one({
        "id": assignment.route_id,
        "school_id": school_id
    })
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    assignment_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "student_id": assignment.student_id,
        "student_name": student.get("name"),
        "class_name": student.get("class_name"),
        "route_id": assignment.route_id,
        "route_name": route.get("route_name"),
        "pickup_stop": assignment.pickup_stop,
        "drop_stop": assignment.drop_stop,
        "transport_type": assignment.transport_type,
        "monthly_fee": route.get("monthly_fee", 0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove existing assignment if any
    await db.student_transport.delete_many({
        "student_id": assignment.student_id,
        "school_id": school_id
    })
    
    await db.student_transport.insert_one(assignment_doc)
    
    # Update route student count
    count = await db.student_transport.count_documents({"route_id": assignment.route_id})
    await db.bus_routes.update_one(
        {"id": assignment.route_id},
        {"$set": {"total_students": count}}
    )
    
    assignment_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Student assigned to {route.get('route_name')}",
        "assignment": assignment_doc
    }

@router.get("/track/{vehicle_id}")
async def track_vehicle(vehicle_id: str, school_id: str):
    """Get vehicle current location (simulated GPS)"""
    db = get_database()
    
    vehicle = await db.vehicles.find_one(
        {"id": vehicle_id, "school_id": school_id}
    )
    
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Simulated GPS data (in production, this would come from real GPS device)
    simulated_location = {
        "lat": 26.8467 + random.uniform(-0.01, 0.01),
        "lng": 80.9462 + random.uniform(-0.01, 0.01),
        "speed": random.randint(20, 45),
        "heading": random.randint(0, 360),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    return {
        "vehicle_number": vehicle.get("vehicle_number"),
        "driver": vehicle.get("driver"),
        "location": simulated_location,
        "note": "GPS tracking is SIMULATED. Real GPS integration pending."
    }

@router.get("/track-all")
async def track_all_vehicles(school_id: str):
    """Get all vehicles' current locations"""
    db = get_database()
    
    vehicles = await db.vehicles.find(
        {"school_id": school_id, "status": "active"},
        {"_id": 0}
    ).to_list(length=50)
    
    vehicle_locations = []
    for v in vehicles:
        vehicle_locations.append({
            "id": v.get("id"),
            "vehicle_number": v.get("vehicle_number"),
            "driver_name": v.get("driver", {}).get("name"),
            "driver_phone": v.get("driver", {}).get("phone"),
            "location": {
                "lat": 26.8467 + random.uniform(-0.02, 0.02),
                "lng": 80.9462 + random.uniform(-0.02, 0.02),
                "speed": random.randint(0, 50)
            },
            "status": "on_route" if random.random() > 0.3 else "stopped"
        })
    
    return {
        "total_vehicles": len(vehicle_locations),
        "vehicles": vehicle_locations,
        "note": "GPS tracking is SIMULATED. Real GPS integration pending."
    }

@router.get("/student/{student_id}")
async def get_student_transport(student_id: str, school_id: str):
    """Get student's transport details"""
    db = get_database()
    
    assignment = await db.student_transport.find_one(
        {"student_id": student_id, "school_id": school_id},
        {"_id": 0}
    )
    
    if not assignment:
        return {"assigned": False, "message": "No transport assigned"}
    
    # Get route details
    route = await db.bus_routes.find_one(
        {"id": assignment.get("route_id")},
        {"_id": 0}
    )
    
    # Get vehicle details
    vehicle = None
    if route and route.get("vehicle_id"):
        vehicle = await db.vehicles.find_one(
            {"id": route["vehicle_id"]},
            {"_id": 0}
        )
    
    return {
        "assigned": True,
        "assignment": assignment,
        "route": route,
        "vehicle": vehicle
    }

@router.get("/analytics")
async def get_transport_analytics(school_id: str):
    """Get transport module analytics"""
    db = get_database()
    
    total_vehicles = await db.vehicles.count_documents({"school_id": school_id})
    total_routes = await db.bus_routes.count_documents({"school_id": school_id})
    total_students = await db.student_transport.count_documents({"school_id": school_id})
    
    # Students per route
    route_stats = await db.bus_routes.find(
        {"school_id": school_id},
        {"route_name": 1, "total_students": 1, "_id": 0}
    ).to_list(length=50)
    
    # Vehicle capacity utilization
    vehicles = await db.vehicles.find(
        {"school_id": school_id},
        {"vehicle_number": 1, "capacity": 1, "id": 1, "_id": 0}
    ).to_list(length=50)
    
    return {
        "total_vehicles": total_vehicles,
        "total_routes": total_routes,
        "students_using_transport": total_students,
        "routes": route_stats,
        "vehicles": vehicles
    }

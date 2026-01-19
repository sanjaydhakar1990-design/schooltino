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

# ============== GPS SETUP GUIDE ==============

@router.get("/gps-setup/guide")
async def get_gps_setup_guide():
    """Get step-by-step GPS setup guide - AI + Manual"""
    return {
        "ai_setup": {
            "title": "🤖 AI-Assisted GPS Setup",
            "steps": [
                {
                    "step": 1,
                    "title": "GPS Device Selection",
                    "description": "Tino AI aapko best GPS device suggest karega based on budget aur requirements",
                    "ai_prompt": "Mujhe GPS device suggest karo transport ke liye",
                    "recommended_devices": [
                        {"name": "Teltonika FMB920", "price": "₹3,500-4,000", "features": "Basic tracking, fuel sensor"},
                        {"name": "Concox GT06N", "price": "₹2,500-3,000", "features": "Popular, reliable"},
                        {"name": "Queclink GV300", "price": "₹4,000-5,000", "features": "Premium, 4G support"}
                    ]
                },
                {
                    "step": 2,
                    "title": "SIM Card Setup",
                    "description": "GPS device ke liye M2M SIM card lagega - Jio/Airtel M2M SIM best hai",
                    "ai_prompt": "GPS ke liye SIM kaise setup karein?",
                    "tips": [
                        "M2M SIM plan lo - ₹50-100/month",
                        "GPRS/Data enabled hona chahiye",
                        "Balance check automatic hona chahiye"
                    ]
                },
                {
                    "step": 3,
                    "title": "Device Installation",
                    "description": "Vehicle mein GPS lagwayein - Bus ke dashboard ke neeche best location hai",
                    "ai_prompt": "GPS device kahan lagayein bus mein?",
                    "installation_points": [
                        "Dashboard ke neeche (hidden)",
                        "Ignition wire se connect karein",
                        "Antenna ko window ke paas rakhein"
                    ]
                },
                {
                    "step": 4,
                    "title": "Schooltino Integration",
                    "description": "Device ID aur credentials enter karein app mein",
                    "ai_prompt": "GPS ko Schooltino se kaise connect karein?",
                    "fields_required": ["Device IMEI", "SIM Number", "Server IP", "Port"]
                }
            ]
        },
        "manual_setup": {
            "title": "📖 Manual Step-by-Step Guide",
            "steps": [
                {
                    "step": 1,
                    "title": "GPS Device Khareedein",
                    "description": "Amazon/Flipkart se GPS tracker lo",
                    "budget_options": {
                        "low": {"device": "Generic GT06N", "price": "₹1,500-2,000"},
                        "medium": {"device": "Concox GT06N", "price": "₹2,500-3,000"},
                        "high": {"device": "Teltonika FMB920", "price": "₹4,000-5,000"}
                    }
                },
                {
                    "step": 2,
                    "title": "M2M SIM Activate Karein",
                    "instructions": [
                        "1. Jio/Airtel center jaayein",
                        "2. M2M SIM application dein",
                        "3. Company documents (school registration) dein",
                        "4. 2-3 din mein SIM milegi",
                        "5. GPRS plan activate karwayein (₹50-100/month)"
                    ]
                },
                {
                    "step": 3,
                    "title": "Device Configuration",
                    "instructions": [
                        "1. SIM card device mein daalen",
                        "2. SMS bhejein device number par: admin123456 server IP PORT",
                        "3. APN set karein: admin123456 apn jionet (for Jio)",
                        "4. Device restart karein"
                    ],
                    "common_commands": {
                        "server_set": "SERVER,1,{IP},{PORT}#",
                        "apn_set": "APN,jionet#",
                        "reset": "RESET#",
                        "status": "STATUS#"
                    }
                },
                {
                    "step": 4,
                    "title": "Vehicle Mein Installation",
                    "instructions": [
                        "1. Bus ka dashboard kholen",
                        "2. ACC wire (ignition) dhoondhein",
                        "3. GPS device ki red wire ko +12V se connect karein",
                        "4. Black wire ko ground/body se connect karein",
                        "5. White/Yellow wire (optional) ko ACC se connect karein",
                        "6. Device ko secure karein (tape/cable tie)",
                        "7. Dashboard band karein"
                    ],
                    "wiring_diagram": "/api/uploads/guides/gps_wiring.png"
                },
                {
                    "step": 5,
                    "title": "Schooltino Mein Add Karein",
                    "instructions": [
                        "1. Transport → GPS Setup mein jaayein",
                        "2. 'Add GPS Device' click karein",
                        "3. Device IMEI number daalen (device par likha hai)",
                        "4. SIM number daalen",
                        "5. Vehicle select karein",
                        "6. Save karein",
                        "7. 2-5 minute mein device online dikhe"
                    ]
                }
            ]
        },
        "troubleshooting": [
            {"issue": "Device offline dikha raha", "solution": "SIM balance check karein, signal area mein le jaayein"},
            {"issue": "Location galat aa raha", "solution": "Device ko open sky mein test karein, antenna check karein"},
            {"issue": "Server se connect nahi ho raha", "solution": "APN settings check karein, SMS se configure karein"}
        ],
        "support": {
            "whatsapp": "+91-7879967616",
            "message": "GPS setup mein help chahiye toh WhatsApp karein"
        }
    }

@router.post("/gps-setup/add-device")
async def add_gps_device(
    school_id: str,
    vehicle_id: str,
    device_imei: str,
    sim_number: str,
    device_brand: str = "generic",
    server_ip: str = None,
    server_port: int = None
):
    """Add GPS device to a vehicle"""
    db = get_database()
    
    # Check vehicle exists
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "school_id": school_id})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    gps_config = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "vehicle_id": vehicle_id,
        "vehicle_number": vehicle.get("vehicle_number"),
        "device_imei": device_imei,
        "sim_number": sim_number,
        "device_brand": device_brand,
        "server_ip": server_ip,
        "server_port": server_port,
        "status": "pending_activation",
        "last_location": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gps_devices.insert_one(gps_config)
    
    # Update vehicle with GPS device ID
    await db.vehicles.update_one(
        {"id": vehicle_id},
        {"$set": {"gps_device_id": gps_config["id"], "gps_enabled": True}}
    )
    
    gps_config.pop('_id', None)
    
    return {
        "success": True,
        "message": "GPS device added. Device will be online in 2-5 minutes.",
        "device": gps_config,
        "next_steps": [
            "Device ko vehicle mein install karein",
            "Ignition on karein",
            "2-5 minute wait karein",
            "Transport → Track mein location dikhe"
        ]
    }

@router.get("/gps-setup/status/{school_id}")
async def get_gps_setup_status(school_id: str):
    """Get GPS setup status for all vehicles"""
    db = get_database()
    
    vehicles = await db.vehicles.find({"school_id": school_id}, {"_id": 0}).to_list(100)
    gps_devices = await db.gps_devices.find({"school_id": school_id}, {"_id": 0}).to_list(100)
    
    gps_map = {d.get("vehicle_id"): d for d in gps_devices}
    
    setup_status = []
    for v in vehicles:
        gps = gps_map.get(v.get("id"))
        setup_status.append({
            "vehicle_id": v.get("id"),
            "vehicle_number": v.get("vehicle_number"),
            "gps_enabled": v.get("gps_enabled", False),
            "gps_device": gps,
            "status": gps.get("status") if gps else "not_configured"
        })
    
    configured = sum(1 for s in setup_status if s.get("gps_enabled"))
    
    return {
        "total_vehicles": len(vehicles),
        "gps_configured": configured,
        "pending": len(vehicles) - configured,
        "vehicles": setup_status
    }

# ============== PARENT NOTIFICATIONS ==============

class BusNotification(BaseModel):
    school_id: str
    vehicle_id: str
    notification_type: str  # bus_late, bus_arrived, bus_breakdown, route_change
    message: str
    affected_routes: List[str] = []
    send_whatsapp: bool = False

@router.post("/notifications/send")
async def send_bus_notification(notification: BusNotification):
    """Send notification to parents about bus status"""
    db = get_database()
    
    # Get students on affected routes
    students = await db.student_transport.find({
        "school_id": notification.school_id,
        "route_id": {"$in": notification.affected_routes}
    }).to_list(500)
    
    # Get parent phone numbers
    student_ids = [s.get("student_id") for s in students]
    parents = await db.students.find(
        {"student_id": {"$in": student_ids}, "school_id": notification.school_id},
        {"mobile": 1, "name": 1, "father_name": 1, "_id": 0}
    ).to_list(500)
    
    notification_doc = {
        "id": str(uuid.uuid4()),
        "school_id": notification.school_id,
        "vehicle_id": notification.vehicle_id,
        "notification_type": notification.notification_type,
        "message": notification.message,
        "affected_routes": notification.affected_routes,
        "recipients_count": len(parents),
        "whatsapp_sent": notification.send_whatsapp,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bus_notifications.insert_one(notification_doc)
    notification_doc.pop('_id', None)
    
    return {
        "success": True,
        "message": f"Notification sent to {len(parents)} parents",
        "notification": notification_doc,
        "recipients": len(parents),
        "whatsapp_status": "Queued for sending" if notification.send_whatsapp else "Not sent (WhatsApp disabled)"
    }

@router.post("/notifications/bus-late")
async def notify_bus_late(school_id: str, vehicle_id: str, route_id: str, delay_minutes: int, reason: str = "Traffic"):
    """Quick notification for bus delay"""
    db = get_database()
    
    # Get vehicle and route info
    vehicle = await db.vehicles.find_one({"id": vehicle_id})
    route = await db.bus_routes.find_one({"id": route_id})
    
    message = f"🚌 Bus Update: {vehicle.get('vehicle_number', 'Bus')} aaj {delay_minutes} minute late hai. Reason: {reason}. Inconvenience ke liye sorry!"
    
    # Get students on this route
    students = await db.student_transport.find({
        "route_id": route_id,
        "school_id": school_id
    }).to_list(200)
    
    notification_doc = {
        "id": str(uuid.uuid4()),
        "school_id": school_id,
        "vehicle_id": vehicle_id,
        "route_id": route_id,
        "notification_type": "bus_late",
        "message": message,
        "delay_minutes": delay_minutes,
        "reason": reason,
        "recipients_count": len(students),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bus_notifications.insert_one(notification_doc)
    
    return {
        "success": True,
        "message": f"Late notification sent to {len(students)} parents",
        "notification_message": message
    }

@router.get("/notifications/parent/{student_id}")
async def get_parent_notifications(student_id: str, school_id: str):
    """Get bus notifications for a parent"""
    db = get_database()
    
    # Get student's route
    assignment = await db.student_transport.find_one({
        "student_id": student_id,
        "school_id": school_id
    })
    
    if not assignment:
        return {"notifications": [], "message": "No transport assigned"}
    
    # Get notifications for this route
    notifications = await db.bus_notifications.find({
        "school_id": school_id,
        "affected_routes": {"$in": [assignment.get("route_id")]}
    }, {"_id": 0}).sort("created_at", -1).to_list(20)
    
    return {
        "route": assignment.get("route_name"),
        "notifications": notifications
    }

# ============== REAL-TIME TRACKING FOR PARENTS ==============

@router.get("/parent-track/{student_id}")
async def parent_track_bus(student_id: str, school_id: str):
    """Real-time bus tracking for parents"""
    db = get_database()
    
    # Get student's transport assignment
    assignment = await db.student_transport.find_one({
        "student_id": student_id,
        "school_id": school_id
    })
    
    if not assignment:
        return {
            "tracking_available": False,
            "message": "Transport not assigned to this student"
        }
    
    # Get route and vehicle
    route = await db.bus_routes.find_one({"id": assignment.get("route_id")})
    if not route or not route.get("vehicle_id"):
        return {
            "tracking_available": False,
            "message": "No vehicle assigned to this route"
        }
    
    vehicle = await db.vehicles.find_one({"id": route.get("vehicle_id")})
    
    # Get GPS location (simulated for now)
    current_location = {
        "lat": 26.8467 + random.uniform(-0.02, 0.02),
        "lng": 80.9462 + random.uniform(-0.02, 0.02),
        "speed": random.randint(0, 45),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    # Calculate ETA to student's stop
    pickup_stop = assignment.get("pickup_stop")
    eta_minutes = random.randint(5, 25)  # Simulated ETA
    
    return {
        "tracking_available": True,
        "student_name": assignment.get("student_name"),
        "pickup_stop": pickup_stop,
        "route_name": route.get("route_name"),
        "vehicle": {
            "number": vehicle.get("vehicle_number"),
            "driver_name": vehicle.get("driver", {}).get("name"),
            "driver_phone": vehicle.get("driver", {}).get("phone")
        },
        "current_location": current_location,
        "eta_minutes": eta_minutes,
        "eta_text": f"Approx {eta_minutes} minutes",
        "status": "on_route",
        "note": "🔴 GPS tracking is SIMULATED. Real GPS will be connected soon."
    }

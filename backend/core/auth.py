# ./core/auth.py
"""Authentication utilities"""

import jwt
import bcrypt
import os
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import db

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if it's a student login
        if payload.get("role") == "student":
            student = await db.students.find_one({"id": user_id}, {"_id": 0})
            if student:
                student["role"] = "student"
                return student
            raise HTTPException(status_code=401, detail="Student not found")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_staff(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == "student":
        raise HTTPException(status_code=403, detail="Access denied. Staff only.")
    return current_user

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") in ("student", "parent"):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    role = current_user.get("role", "")
    if role not in ("director", "admin", "principal", "vice_principal", "accountant", "clerk", "manager"):
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    return current_user

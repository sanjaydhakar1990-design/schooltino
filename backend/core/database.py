# /app/backend/core/database.py
"""Database connection module"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

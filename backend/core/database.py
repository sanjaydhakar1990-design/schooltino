# ./core/database.py
"""Database connection module"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import urllib.parse
import certifi
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

if MONGO_URL and MONGO_PASSWORD and '<db_password>' in MONGO_URL:
    encoded_password = urllib.parse.quote(MONGO_PASSWORD, safe='')
    MONGO_URL = MONGO_URL.replace('<db_password>', encoded_password)

client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client[DB_NAME]

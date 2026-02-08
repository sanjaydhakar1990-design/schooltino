# ./core/database.py
"""Database connection module"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import certifi
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get('MONGO_URL')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def create_mongo_client(url, password):
    if not url:
        raise ValueError("MONGO_URL environment variable is not set")

    if '://' in url:
        scheme_end = url.index('://') + 3
        rest = url[scheme_end:]
        last_at = rest.rfind('@')

        if last_at != -1:
            hostpath = rest[last_at + 1:]
            userinfo = rest[:last_at]
            first_colon = userinfo.find(':')
            if first_colon != -1:
                username = userinfo[:first_colon]
            else:
                username = userinfo

            scheme = url[:scheme_end]
            host_url = f"{scheme}{hostpath}"

            raw_password = password if password else (userinfo[first_colon + 1:] if first_colon != -1 else None)

            kwargs = {"tlsCAFile": certifi.where()}
            if username:
                kwargs["username"] = username
            if raw_password:
                kwargs["password"] = raw_password

            logger.info("Connecting to MongoDB with separate credentials")
            return AsyncIOMotorClient(host_url, **kwargs)

    return AsyncIOMotorClient(url, tlsCAFile=certifi.where())

client = create_mongo_client(MONGO_URL, MONGO_PASSWORD)
db = client[DB_NAME]

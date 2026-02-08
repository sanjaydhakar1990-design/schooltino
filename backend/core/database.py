# ./core/database.py
"""Database connection module"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import urllib.parse
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

    if password and '<db_password>' in url:
        url = url.replace('<db_password>', urllib.parse.quote_plus(password))
        return AsyncIOMotorClient(url, tlsCAFile=certifi.where())

    if password and '://' in url:
        scheme_end = url.index('://') + 3
        scheme = url[:scheme_end]
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

            encoded_user = urllib.parse.quote_plus(username)
            encoded_pass = urllib.parse.quote_plus(password)
            clean_url = f"{scheme}{encoded_user}:{encoded_pass}@{hostpath}"
            logger.info("MongoDB URL rebuilt with encoded credentials")
            return AsyncIOMotorClient(clean_url, tlsCAFile=certifi.where())

    return AsyncIOMotorClient(url, tlsCAFile=certifi.where())

client = create_mongo_client(MONGO_URL, MONGO_PASSWORD)
db = client[DB_NAME]

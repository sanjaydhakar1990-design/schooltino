# ./core/database.py
"""Database connection module"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
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

    if password:
        if '<db_password>' in url:
            url = url.replace('<db_password>', urllib.parse.quote_plus(password))
            return AsyncIOMotorClient(url, tlsCAFile=certifi.where())

        match = re.match(r'^(mongodb(?:\+srv)?://)([^:]*):.*?@(.+)$', url)
        if match:
            scheme = match.group(1)
            username = match.group(2)
            hostpath = match.group(3)
            encoded_user = urllib.parse.quote_plus(username)
            encoded_pass = urllib.parse.quote_plus(password)
            clean_url = f"{scheme}{encoded_user}:{encoded_pass}@{hostpath}"
            return AsyncIOMotorClient(clean_url, tlsCAFile=certifi.where())

        try:
            match_no_pass = re.match(r'^(mongodb(?:\+srv)?://)(.+)$', url)
            if match_no_pass:
                scheme = match_no_pass.group(1)
                rest = match_no_pass.group(2)
                if '@' in rest:
                    at_idx = rest.rfind('@')
                    hostpath = rest[at_idx + 1:]
                    userinfo = rest[:at_idx]
                    colon_idx = userinfo.find(':')
                    if colon_idx != -1:
                        username = userinfo[:colon_idx]
                    else:
                        username = userinfo
                    encoded_user = urllib.parse.quote_plus(username)
                    encoded_pass = urllib.parse.quote_plus(password)
                    clean_url = f"{scheme}{encoded_user}:{encoded_pass}@{hostpath}"
                    return AsyncIOMotorClient(clean_url, tlsCAFile=certifi.where())
        except Exception as e:
            logger.warning(f"Failed to parse MONGO_URL: {e}")

    return AsyncIOMotorClient(url, tlsCAFile=certifi.where())

client = create_mongo_client(MONGO_URL, MONGO_PASSWORD)
db = client[DB_NAME]

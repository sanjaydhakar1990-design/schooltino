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

import re

def build_mongo_url(url, password):
    if not url:
        return url
    if password and '<db_password>' in url:
        return url.replace('<db_password>', urllib.parse.quote_plus(password))
    if password:
        encoded_pass = urllib.parse.quote_plus(password)
        raw_pass_in_url = url.find(password)
        if raw_pass_in_url != -1:
            return url.replace(password, encoded_pass, 1)
        match = re.match(r'^(mongodb(?:\+srv)?://)([^:]+):(.+?)@(.+)$', url)
        if match:
            scheme, user, _, hostpath = match.groups()
            encoded_user = urllib.parse.quote_plus(user)
            return f"{scheme}{encoded_user}:{encoded_pass}@{hostpath}"
    return url

MONGO_URL = build_mongo_url(MONGO_URL, MONGO_PASSWORD)

client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client[DB_NAME]

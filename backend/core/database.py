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

def build_mongo_url(url, password):
    if not url:
        return url
    if password and '<db_password>' in url:
        return url.replace('<db_password>', urllib.parse.quote_plus(password))
    if password:
        try:
            parsed = urllib.parse.urlparse(url)
            if parsed.username:
                encoded_user = urllib.parse.quote_plus(parsed.username)
                encoded_pass = urllib.parse.quote_plus(password)
                netloc = f"{encoded_user}:{encoded_pass}@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return urllib.parse.urlunparse((
                    parsed.scheme, netloc, parsed.path,
                    parsed.params, parsed.query, parsed.fragment
                ))
        except Exception:
            pass
    try:
        urllib.parse.urlparse(url)
        return url
    except Exception:
        return url

MONGO_URL = build_mongo_url(MONGO_URL, MONGO_PASSWORD)

client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
db = client[DB_NAME]

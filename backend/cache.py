import redis
import json
import os
from datetime import timedelta

class Cache:
    def __init__(self):
        host = os.getenv('REDIS_HOST', 'localhost')
        port = int(os.getenv('REDIS_PORT', 6379))
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        print(f"[*] Connected to Redis at {host}:{port}")

    def get_json(self, key):
        """Retrieve a JSON object from cache."""
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            print(f"[!] Redis GET error: {e}")
            return None

    def set_json(self, key, value, ex=300):
        """Store an object as JSON in cache (default 5 min expiration)."""
        try:
            self.client.set(key, json.dumps(value), ex=ex)
            return True
        except Exception as e:
            print(f"[!] Redis SET error: {e}")
            return False

    def delete(self, key):
        """Remove a key from cache."""
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            print(f"[!] Redis DELETE error: {e}")
            return False

    def invalidate_user_tasks(self, email):
        """Helper to clear tasks cache for a specific user."""
        self.delete(f"tasks:{email}")

import redis
from config.settings import settings

def clear_redis_cache():
    print(f"Connecting to Redis at {settings.REDIS_URL}...")
    try:
        # Use standard connection for flushing
        r = redis.from_url(settings.REDIS_URL)
        r.flushall()
        print("✅ Redis cache cleared successfully!")
    except Exception as e:
        print(f"❌ Failed to clear Redis cache: {str(e)}")

if __name__ == "__main__":
    clear_redis_cache()

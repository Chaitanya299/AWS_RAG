import redis
from config.settings import settings
import urllib.parse

def test_redis_connection():
    # Mask password for safe logging
    parsed = urllib.parse.urlparse(settings.REDIS_URL)
    masked_url = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}{parsed.path}"

    print(f"Connecting to Redis at {masked_url}...")
    try:
        # Determine connection arguments based on the scheme
        kwargs = {"decode_responses": True}

        if parsed.scheme == "rediss":
            # For Cloud Redis with SSL, we often need to skip certificate verification
            # and hostname checking, especially if the environment's CA bundle is outdated.
            kwargs.update({
                "ssl_cert_reqs": None,
                "ssl_check_hostname": False
            })
            print("💡 Using SSL (rediss) connection parameters...")
        else:
            print("💡 Using standard (redis) connection parameters...")

        r = redis.from_url(settings.REDIS_URL, **kwargs)
        r.ping()
        print("✅ Redis connection successful!")
    except Exception as e:
        print(f"❌ Redis connection failed: {type(e).__name__} - {str(e)}")
        print("\nTroubleshooting Tips:")
        print(f"1. Current URL start: {settings.REDIS_URL[:10]}...")
        print("2. If '[SSL] record layer failure' persists, try changing 'rediss://' to 'redis://' in .env")
        print("   (The port 16296 might be configured for non-SSL traffic).")
        print("3. Check if your password in .env contains special characters; if so, URL-encode them.")

if __name__ == "__main__":
    test_redis_connection()

if __name__ == "__main__":
    test_redis_connection()

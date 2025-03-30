# app/utils/cache.py

from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize cache
cache = Cache()

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

def init_cache(app):
    # Configure cache
    cache_config = {
        "CACHE_TYPE": "RedisCache",
        "CACHE_REDIS_HOST": "localhost",
        "CACHE_REDIS_PORT": 6379,
        "CACHE_REDIS_DB": 0,
        "CACHE_DEFAULT_TIMEOUT": 300,  # 5 minutes
        "CACHE_KEY_PREFIX": "quizmaster_"
    }
    app.config.update(cache_config)
    cache.init_app(app)
    
    # Configure rate limiter
    limiter.init_app(app)

def clear_cache_by_pattern(pattern):
    """Clear all cache keys matching a pattern."""
    if hasattr(cache, 'cache') and hasattr(cache.cache, '_client'):
        redis_client = cache.cache._client
        for key in redis_client.scan_iter(f"*{pattern}*"):
            redis_client.delete(key)
from functools import wraps
import time
from flask import session, jsonify, redirect


def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "uid" not in session:
            return jsonify(
                {"status": "error", "message": "Authentication required"}
            ), 401
        return f(*args, **kwargs)

    return decorated_function


def rate_limit(max_requests=60, window=60):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "requests" not in session:
                session["requests"] = []

            now = int(time.time())
            session["requests"] = [r for r in session["requests"] if r > now - window]

            if len(session["requests"]) >= max_requests:
                return jsonify(
                    {"status": "error", "message": "Rate limit exceeded"}
                ), 429

            session["requests"].append(now)
            return f(*args, **kwargs)

        return decorated_function

    return decorator

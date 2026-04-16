"""
ASGI config for taxi service project.
"""

import os
import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from core.asgi_middleware import ASGIRequestLoggingMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.rides import routing as rides_routing

# Simple ASGI CORS middleware
class ASGICorsMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Handle CORS preflight
            headers = dict(scope.get('headers', []))
            
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    # Add CORS headers
                    cors_headers = [
                        (b"access-control-allow-origin", b"*"),
                        (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, OPTIONS"),
                        (b"access-control-allow-headers", b"Content-Type, Authorization"),
                        (b"access-control-allow-credentials", b"true"),
                    ]
                    message["headers"].extend(cors_headers)
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)

# Get Django ASGI application
django_asgi_app = get_asgi_application()

# Apply ASGI CORS middleware
django_asgi_app = ASGICorsMiddleware(django_asgi_app)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter([
                *rides_routing.websocket_urlpatterns,
            ])
        )
    ),
})

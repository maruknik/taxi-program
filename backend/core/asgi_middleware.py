"""
ASGI-compatible middleware for Django Channels.
"""

import logging
import time
from django.utils import timezone

logger = logging.getLogger('apps.api')

class ASGIRequestLoggingMiddleware:
    """
    ASGI-compatible middleware to log all HTTP requests and responses.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            # Skip non-HTTP requests (like WebSocket)
            await self.app(scope, receive, send)
            return
        
        # Store start time
        start_time = time.time()
        
        # Don't log static files and admin
        path = scope.get('path', '')
        if path.startswith('/static/') or path.startswith('/admin/'):
            await self.app(scope, receive, send)
            return
        
        # Get client IP and user info
        client_ip = self.get_client_ip(scope)
        
        logger.info(
            f"Request started: {scope['method']} {path}",
            extra={
                'method': scope['method'],
                'path': path,
                'ip': client_ip,
            }
        )
        
        # Intercept response
        status_code = None
        
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
            
            # Log completion
            if status_code and start_time:
                duration = time.time() - start_time
                logger.info(
                    f"Request completed: {scope['method']} {path} - {status_code}",
                    extra={
                        'method': scope['method'],
                        'path': path,
                        'status_code': status_code,
                        'duration': f"{duration:.3f}s",
                        'ip': client_ip,
                    }
                )
        except Exception as e:
            logger.error(
                f"Request exception: {scope['method']} {path}",
                extra={
                    'method': scope['method'],
                    'path': path,
                    'exception': str(e),
                    'exception_type': type(e).__name__,
                    'ip': client_ip,
                },
                exc_info=True
            )
            raise
    
    @staticmethod
    def get_client_ip(scope):
        """Get client IP address from ASGI scope."""
        # Try to get from headers first
        headers = dict(scope.get('headers', []))
        x_forwarded_for = headers.get(b'x-forwarded-for', b'').decode('utf-8')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        
        # Try from client
        client = scope.get('client')
        if client:
            return client[0]
        
        return 'unknown'

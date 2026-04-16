"""
Receipt views for payments app.
"""

from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.payments.receipt_service import ReceiptService


class ReceiptViewSet(viewsets.ViewSet):
    """ViewSet for receipt operations."""
    
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def receipt(self, request):
        """GET /api/v1/payments/receipt/?ride_id=xxx — Get receipt data."""
        
        ride_id = request.query_params.get('ride_id')
        if not ride_id:
            return Response({'error': 'ride_id is required'}, status=400)
        
        try:
            from apps.rides.models import Ride
            ride = Ride.objects.get(id=ride_id, user=request.user)
            
            receipt_data = ReceiptService.generate_ride_receipt(ride)
            return Response(receipt_data)
            
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def receipt_pdf(self, request):
        """GET /api/v1/payments/receipt-pdf/?ride_id=xxx — Download PDF receipt."""
        
        ride_id = request.query_params.get('ride_id')
        if not ride_id:
            return Response({'error': 'ride_id is required'}, status=400)
        
        try:
            from apps.rides.models import Ride
            ride = Ride.objects.get(id=ride_id, user=request.user)
            
            pdf_content = ReceiptService.generate_pdf_receipt(ride)
            receipt_data = ReceiptService.generate_ride_receipt(ride)
            
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="receipt_{receipt_data["receipt_id"]}.pdf"'
            return response
            
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def email_receipt(self, request):
        """POST /api/v1/payments/email-receipt/ — Send receipt via email."""
        
        ride_id = request.data.get('ride_id')
        email = request.data.get('email')
        
        if not ride_id:
            return Response({'error': 'ride_id is required'}, status=400)
        
        try:
            from apps.rides.models import Ride
            ride = Ride.objects.get(id=ride_id, user=request.user)
            
            success = ReceiptService.send_receipt_email(ride, email)
            
            if success:
                return Response({'status': 'sent'})
            else:
                return Response({'error': 'Failed to send email'}, status=500)
                
        except Ride.DoesNotExist:
            return Response({'error': 'Ride not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

"""
Receipt and invoice generation service.
"""

import logging
from io import BytesIO
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.utils import timezone
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

logger = logging.getLogger(__name__)


class ReceiptService:
    """Service for generating receipts and invoices."""
    
    @classmethod
    def generate_ride_receipt(cls, ride) -> Dict[str, Any]:
        """Generate receipt for completed ride."""
        
        receipt_data = {
            'receipt_id': f"R{ride.id.hex[:8].upper()}",
            'ride_id': str(ride.id),
            'date': ride.completed_at or ride.created_at,
            'user': {
                'name': f"{ride.user.first_name} {ride.user.last_name}" if ride.user.first_name else ride.user.email,
                'email': ride.user.email,
                'phone': getattr(ride.user, 'phone_number', ''),
            },
            'driver': {
                'name': f"{ride.driver.user.first_name} {ride.driver.user.last_name}".strip() or ride.driver.user.email,
                'phone': ride.driver.user.phone_number or '',
                'vehicle': f"{ride.driver.vehicle_color} {ride.driver.vehicle_make} {ride.driver.vehicle_model}".strip(),
                'plate': ride.driver.vehicle_plate or '',
            } if ride.driver else None,
            'route': {
                'pickup_address': ride.pickup_address,
                'dropoff_address': ride.dropoff_address,
                'distance_km': float(ride.final_distance or ride.estimated_distance or 0),
                'duration_minutes': ride.duration_minutes or 0,
            },
            'payment': {
                'method': ride.payment_method_display,
                'amount': float(ride.final_amount),
                'currency': 'UAH',
                'transaction_id': str(ride.id),
            },
            'company': {
                'name': 'Vard Taxi',
                'address': 'м. Хмельницький, вул. Проскурівська, 1',
                'phone': '+380 68 123 45 67',
                'email': 'info@vard.taxi',
                'website': 'vard.taxi',
            }
        }
        
        return receipt_data
    
    @classmethod
    def generate_pdf_receipt(cls, ride) -> bytes:
        """Generate PDF receipt."""
        
        receipt_data = cls.generate_ride_receipt(ride)
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Header
        story.append(Paragraph(f"Чек #{receipt_data['receipt_id']}", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Company info
        company_data = [
            ['Назва:', receipt_data['company']['name']],
            ['Адреса:', receipt_data['company']['address']],
            ['Телефон:', receipt_data['company']['phone']],
            ['Email:', receipt_data['company']['email']],
        ]
        
        company_table = Table(company_data, colWidths=[2*inch, 4*inch])
        company_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(company_table)
        story.append(Spacer(1, 20))
        
        # Customer info
        story.append(Paragraph("Інформація про клієнта:", styles['Heading2']))
        customer_data = [
            ['Ім\'я:', receipt_data['user']['name']],
            ['Email:', receipt_data['user']['email']],
            ['Телефон:', receipt_data['user']['phone']],
        ]
        
        customer_table = Table(customer_data, colWidths=[2*inch, 4*inch])
        customer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(customer_table)
        story.append(Spacer(1, 20))
        
        # Route info
        story.append(Paragraph("Інформація про поїздку:", styles['Heading2']))
        route_data = [
            ['Звідки:', receipt_data['route']['pickup_address']],
            ['Куди:', receipt_data['route']['dropoff_address']],
            ['Відстань:', f"{receipt_data['route']['distance_km']:.1f} км"],
            ['Тривалість:', f"{receipt_data['route']['duration_minutes']} хв"],
        ]
        
        route_table = Table(route_data, colWidths=[2*inch, 4*inch])
        route_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(route_table)
        story.append(Spacer(1, 20))
        
        # Payment info
        story.append(Paragraph("Інформація про оплату:", styles['Heading2']))
        payment_data = [
            ['Спосіб оплати:', receipt_data['payment']['method']],
            ['Сума:', f"{receipt_data['payment']['amount']} {receipt_data['payment']['currency']}"],
            ['ID транзакції:', receipt_data['payment']['transaction_id']],
        ]
        
        payment_table = Table(payment_data, colWidths=[2*inch, 4*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        
        story.append(payment_table)
        story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
    
    @classmethod
    def send_receipt_email(cls, ride, recipient_email: str = None) -> bool:
        """Send receipt via email."""
        try:
            receipt_data = cls.generate_ride_receipt(ride)
            pdf_content = cls.generate_pdf_receipt(ride)
            
            email = recipient_email or ride.user.email
            
            # Create email
            subject = f"Чек #{receipt_data['receipt_id']} - Vard Taxi"
            
            # Render HTML template
            html_content = render_to_string('emails/receipt.html', {
                'receipt_data': receipt_data,
                'ride': ride,
            })
            
            email_message = EmailMessage(
                subject=subject,
                body=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            
            # Attach PDF
            email_message.attach(
                f"receipt_{receipt_data['receipt_id']}.pdf",
                pdf_content,
                'application/pdf'
            )
            
            # Send email
            email_message.content_subtype = "html"
            email_message.send()
            
            logger.info(f"Receipt sent to {email} for ride {ride.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send receipt email: {e}")
            return False

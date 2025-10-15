import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending invitation emails."""
    
    def __init__(self):
        self.smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_username = os.environ.get('SMTP_USERNAME')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@collabcanvas.com')
        self.app_url = os.environ.get('APP_URL', 'https://gauntlet-collab-canvas-24hr.vercel.app')
        
    def send_invitation_email(self, invitation_data: dict) -> bool:
        """Send invitation email to user."""
        try:
            if not self._is_email_configured():
                logger.warning("Email not configured, skipping email send")
                return self._mock_email_send(invitation_data)
            
            # Create email content
            subject = f"You're invited to collaborate on '{invitation_data['canvas_title']}'"
            html_content = self._create_invitation_html(invitation_data)
            text_content = self._create_invitation_text(invitation_data)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = invitation_data['invitee_email']
            
            # Add content
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Invitation email sent to {invitation_data['invitee_email']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invitation email: {str(e)}")
            return False
    
    def _is_email_configured(self) -> bool:
        """Check if email is properly configured."""
        return all([
            self.smtp_username,
            self.smtp_password,
            self.smtp_host
        ])
    
    def _mock_email_send(self, invitation_data: dict) -> bool:
        """Mock email send for development/testing."""
        logger.info(f"MOCK EMAIL: Invitation sent to {invitation_data['invitee_email']}")
        logger.info(f"Canvas: {invitation_data['canvas_title']}")
        logger.info(f"Permission: {invitation_data['permission_type']}")
        logger.info(f"Invitation link: {invitation_data['invitation_link']}")
        return True
    
    def _create_invitation_html(self, invitation_data: dict) -> str:
        """Create HTML content for invitation email."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Canvas Collaboration Invitation</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎨 CollabCanvas Invitation</h1>
                </div>
                <div class="content">
                    <h2>You're invited to collaborate!</h2>
                    <p><strong>{invitation_data['inviter_name']}</strong> has invited you to collaborate on the canvas:</p>
                    <h3>"{invitation_data['canvas_title']}"</h3>
                    <p><strong>Permission Level:</strong> {invitation_data['permission_type'].title()}</p>
                    <p><strong>Canvas Description:</strong> {invitation_data.get('canvas_description', 'No description provided')}</p>
                    
                    <p>Click the button below to accept the invitation and start collaborating:</p>
                    <a href="{invitation_data['invitation_link']}" class="button">Accept Invitation</a>
                    
                    <p><small>This invitation will expire on {invitation_data['expires_at']}.</small></p>
                    
                    <hr style="margin: 30px 0;">
                    <p><small>If you can't click the button, copy and paste this link into your browser:</small></p>
                    <p><small style="word-break: break-all;">{invitation_data['invitation_link']}</small></p>
                </div>
                <div class="footer">
                    <p>This invitation was sent from CollabCanvas. If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_invitation_text(self, invitation_data: dict) -> str:
        """Create plain text content for invitation email."""
        return f"""
CollabCanvas Collaboration Invitation

You're invited to collaborate!

{invitation_data['inviter_name']} has invited you to collaborate on the canvas:
"{invitation_data['canvas_title']}"

Permission Level: {invitation_data['permission_type'].title()}
Canvas Description: {invitation_data.get('canvas_description', 'No description provided')}

To accept this invitation, visit:
{invitation_data['invitation_link']}

This invitation will expire on {invitation_data['expires_at']}.

If you didn't expect this invitation, you can safely ignore this email.

---
CollabCanvas Team
        """

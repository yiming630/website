"""
Notification Service - FastAPI
Handles email notifications, push notifications, and in-app notifications
"""
import os
import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, EmailStr, ValidationError
import uvicorn

# Import database connection
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "databases"))
try:
    from connection import query, transaction
except ImportError:
    # Fallback for development
    async def query(*args): return type('Result', (), {'rows': []})()
    async def transaction(callback): return await callback(None)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Notification Service...")
    
    try:
        # Test database connection
        await query("SELECT 1")
        logger.info("✅ Database connection established")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Notification Service...")

# Create FastAPI app
app = FastAPI(
    title="Translation Platform - Notification Service",
    description="Notification and communication service",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Pydantic models
class EmailNotification(BaseModel):
    to_email: EmailStr
    subject: str
    content: str
    content_type: str = "text/html"
    from_name: Optional[str] = None

class InAppNotification(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None

class BulkEmailNotification(BaseModel):
    user_ids: List[str]
    subject: str
    content: str
    content_type: str = "text/html"
    template: Optional[str] = None

class NotificationPreferences(BaseModel):
    user_id: str
    email_notifications: bool = True
    push_notifications: bool = True
    in_app_notifications: bool = True
    notification_types: Dict[str, bool] = {}

class NotificationResponse(BaseModel):
    success: bool
    message: str
    notification_id: Optional[str] = None

# Email templates
EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "Welcome to Translation Platform",
        "content": """
        <html>
        <body>
            <h2>Welcome to Translation Platform!</h2>
            <p>Dear {user_name},</p>
            <p>Thank you for joining our translation platform. You can now start translating documents and collaborating with others.</p>
            <p>Get started by uploading your first document or joining a project.</p>
            <p>Best regards,<br>Translation Platform Team</p>
        </body>
        </html>
        """
    },
    "document_ready": {
        "subject": "Your document translation is ready",
        "content": """
        <html>
        <body>
            <h2>Translation Complete</h2>
            <p>Dear {user_name},</p>
            <p>Your document "{document_title}" has been successfully translated.</p>
            <p><a href="{document_url}">View your translated document</a></p>
            <p>Best regards,<br>Translation Platform Team</p>
        </body>
        </html>
        """
    },
    "collaboration_invite": {
        "subject": "You've been invited to collaborate",
        "content": """
        <html>
        <body>
            <h2>Collaboration Invitation</h2>
            <p>Dear {user_name},</p>
            <p>{inviter_name} has invited you to collaborate on the document "{document_title}".</p>
            <p><a href="{document_url}">Accept invitation and start collaborating</a></p>
            <p>Best regards,<br>Translation Platform Team</p>
        </body>
        </html>
        """
    },
    "password_reset": {
        "subject": "Password Reset Request",
        "content": """
        <html>
        <body>
            <h2>Password Reset</h2>
            <p>Dear {user_name},</p>
            <p>You requested a password reset for your account.</p>
            <p><a href="{reset_url}">Click here to reset your password</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>Translation Platform Team</p>
        </body>
        </html>
        """
    }
}

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "notification-service",
        "timestamp": datetime.utcnow().isoformat()
    }

# Send email notification
@app.post("/api/notifications/email", response_model=NotificationResponse)
async def send_email_notification(
    notification: EmailNotification,
    background_tasks: BackgroundTasks
):
    """Send an email notification"""
    try:
        background_tasks.add_task(
            send_email_background,
            notification.to_email,
            notification.subject,
            notification.content,
            notification.content_type,
            notification.from_name
        )
        
        return NotificationResponse(
            success=True,
            message="Email notification queued for sending"
        )
        
    except Exception as e:
        logger.error(f"Failed to queue email notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Send in-app notification
@app.post("/api/notifications/in-app", response_model=NotificationResponse)
async def send_in_app_notification(notification: InAppNotification):
    """Send an in-app notification"""
    try:
        # Set default expiration if not provided
        if not notification.expires_at:
            notification.expires_at = datetime.utcnow() + timedelta(days=30)
        
        # Save notification to database
        result = await query(
            """INSERT INTO notifications 
               (user_id, title, message, type, action_url, expires_at, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
               RETURNING id""",
            [
                notification.user_id,
                notification.title,
                notification.message,
                notification.type,
                notification.action_url,
                notification.expires_at
            ]
        )
        
        notification_id = str(result.rows[0]['id']) if result.rows else None
        
        # TODO: Send real-time notification via WebSocket
        # This would integrate with the collaboration service
        
        return NotificationResponse(
            success=True,
            message="In-app notification sent",
            notification_id=notification_id
        )
        
    except Exception as e:
        logger.error(f"Failed to send in-app notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Send bulk email notifications
@app.post("/api/notifications/email/bulk", response_model=NotificationResponse)
async def send_bulk_email_notifications(
    notification: BulkEmailNotification,
    background_tasks: BackgroundTasks
):
    """Send bulk email notifications"""
    try:
        # Get user emails from database
        user_ids_str = ','.join([f"'{uid}'" for uid in notification.user_ids])
        result = await query(
            f"SELECT id, name, email FROM users WHERE id IN ({user_ids_str})"
        )
        
        users = result.rows
        
        if not users:
            raise HTTPException(status_code=404, detail="No valid users found")
        
        # Queue emails for sending
        for user in users:
            content = notification.content
            if notification.template and notification.template in EMAIL_TEMPLATES:
                template = EMAIL_TEMPLATES[notification.template]
                content = template["content"].format(
                    user_name=user['name'],
                    user_email=user['email'],
                    **notification.content if isinstance(notification.content, dict) else {}
                )
            
            background_tasks.add_task(
                send_email_background,
                user['email'],
                notification.subject,
                content,
                notification.content_type
            )
        
        return NotificationResponse(
            success=True,
            message=f"Bulk email notifications queued for {len(users)} recipients"
        )
        
    except Exception as e:
        logger.error(f"Failed to send bulk email notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Get user notifications
@app.get("/api/notifications/user/{user_id}")
async def get_user_notifications(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False
):
    """Get notifications for a specific user"""
    try:
        where_clause = "WHERE user_id = $1 AND expires_at > NOW()"
        params = [user_id]
        
        if unread_only:
            where_clause += " AND read_at IS NULL"
        
        result = await query(
            f"""SELECT * FROM notifications 
                {where_clause}
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3""",
            params + [limit, offset]
        )
        
        return {
            "notifications": result.rows,
            "total": len(result.rows),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get user notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Mark notification as read
@app.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        result = await query(
            "UPDATE notifications SET read_at = NOW() WHERE id = $1 RETURNING id",
            [notification_id]
        )
        
        if not result.rows:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"success": True, "message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update notification preferences
@app.put("/api/notifications/preferences")
async def update_notification_preferences(preferences: NotificationPreferences):
    """Update user notification preferences"""
    try:
        # Update user preferences in database
        await query(
            """UPDATE users SET preferences = preferences || $1 WHERE id = $2""",
            [
                {
                    "notifications": {
                        "email": preferences.email_notifications,
                        "push": preferences.push_notifications,
                        "in_app": preferences.in_app_notifications,
                        "types": preferences.notification_types
                    }
                },
                preferences.user_id
            ]
        )
        
        return {"success": True, "message": "Notification preferences updated"}
        
    except Exception as e:
        logger.error(f"Failed to update notification preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Template-based notifications
@app.post("/api/notifications/template/{template_name}")
async def send_template_notification(
    template_name: str,
    data: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Send notification using predefined template"""
    try:
        if template_name not in EMAIL_TEMPLATES:
            raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found")
        
        template = EMAIL_TEMPLATES[template_name]
        
        # Format template content
        subject = template["subject"].format(**data)
        content = template["content"].format(**data)
        
        background_tasks.add_task(
            send_email_background,
            data.get("to_email"),
            subject,
            content,
            "text/html"
        )
        
        return NotificationResponse(
            success=True,
            message=f"Template notification '{template_name}' queued for sending"
        )
        
    except Exception as e:
        logger.error(f"Failed to send template notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background email sending function
async def send_email_background(
    to_email: str,
    subject: str,
    content: str,
    content_type: str = "text/html",
    from_name: str = None
):
    """Background task for sending emails"""
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "localhost")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        from_email = os.getenv("FROM_EMAIL", "noreply@translationplatform.com")
        
        if not from_name:
            from_name = "Translation Platform"
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add content
        msg.attach(MIMEText(content, content_type))
        
        # Send email
        if smtp_username and smtp_password:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
                
            logger.info(f"Email sent successfully to {to_email}")
        else:
            logger.warning(f"Email sending skipped (no SMTP credentials): {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )

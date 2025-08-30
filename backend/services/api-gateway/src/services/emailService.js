const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { query } = require('../utils/database');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
        this.templates = {};
        this.loadTemplates();
    }

    initializeTransporter() {
        // Initialize email transporter based on environment
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
            // Use MailHog for development (if available) or console logging
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'localhost',
                port: process.env.SMTP_PORT || 1025,
                secure: false,
                auth: false,
                logger: true,
                debug: true
            });
            console.log('📧 Email service initialized for development (MailHog/Console)');
        } else {
            // Production configuration
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });
            console.log('📧 Email service initialized for production');
        }
    }

    loadTemplates() {
        const templatesDir = path.join(__dirname, '../templates');
        
        // Create templates directory if it doesn't exist
        if (!fs.existsSync(templatesDir)) {
            fs.mkdirSync(templatesDir, { recursive: true });
        }

        try {
            const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));
            
            templateFiles.forEach(file => {
                const templateName = path.basename(file, '.hbs');
                const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf8');
                this.templates[templateName] = handlebars.compile(templateContent);
            });
            
            console.log(`📧 Loaded ${templateFiles.length} email templates:`, Object.keys(this.templates));
        } catch (error) {
            console.warn('⚠️ Could not load email templates:', error.message);
        }
    }

    // Generate secure verification token with salt
    generateVerificationToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const saltRounds = 12;
        const salt = bcrypt.genSaltSync(saltRounds);
        const tokenHash = bcrypt.hashSync(token, salt);
        
        return {
            token,           // Raw token (to send in email)
            tokenHash,       // Hashed token (to store in database)
            salt            // Salt (to store in database)
        };
    }

    // Verify token against stored hash
    verifyToken(token, storedHash, salt) {
        try {
            return bcrypt.compareSync(token, storedHash);
        } catch (error) {
            console.error('Token verification error:', error.message);
            return false;
        }
    }

    // Create verification token in database
    async createVerificationToken(userId, email, ipAddress = null, userAgent = null) {
        try {
            const { token, tokenHash, salt } = this.generateVerificationToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Clean up any existing tokens for this user
            await query(`
                DELETE FROM email_verification_tokens 
                WHERE user_id = $1 OR email = $2
            `, [userId, email]);

            // Insert new token
            const result = await query(`
                INSERT INTO email_verification_tokens 
                (user_id, token_hash, salt, email, expires_at, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [userId, tokenHash, salt, email, expiresAt, ipAddress, userAgent]);

            return {
                tokenId: result.rows[0].id,
                token,
                expiresAt
            };
        } catch (error) {
            console.error('Error creating verification token:', error.message);
            throw new Error('Failed to create verification token');
        }
    }

    // Verify and use verification token
    async verifyEmailToken(token) {
        try {
            // Find token in database
            const result = await query(`
                SELECT 
                    evt.id, evt.user_id, evt.token_hash, evt.salt, evt.email, 
                    evt.expires_at, evt.used_at,
                    u.id as user_exists, u.name, u.email as user_email, u.email_verified
                FROM email_verification_tokens evt
                LEFT JOIN users u ON evt.user_id = u.id
                WHERE evt.expires_at > CURRENT_TIMESTAMP AND evt.used_at IS NULL
            `);

            if (result.rows.length === 0) {
                throw new Error('Invalid or expired verification token');
            }

            // Find the correct token by verifying hash
            let validTokenRow = null;
            for (const row of result.rows) {
                if (this.verifyToken(token, row.token_hash, row.salt)) {
                    validTokenRow = row;
                    break;
                }
            }

            if (!validTokenRow) {
                throw new Error('Invalid verification token');
            }

            // Mark token as used
            await query(`
                UPDATE email_verification_tokens 
                SET used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [validTokenRow.id]);

            // Update user's email verification status
            if (validTokenRow.user_exists) {
                await query(`
                    UPDATE users 
                    SET email_verified = TRUE, 
                        email_verified_at = CURRENT_TIMESTAMP,
                        account_status = 'active',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [validTokenRow.user_id]);
            }

            return {
                success: true,
                userId: validTokenRow.user_id,
                email: validTokenRow.email,
                userName: validTokenRow.name
            };
        } catch (error) {
            console.error('Error verifying email token:', error.message);
            throw new Error(error.message || 'Failed to verify email token');
        }
    }

    // Send verification email
    async sendVerificationEmail(user, ipAddress = null, userAgent = null) {
        try {
            // Create verification token
            const { token, tokenId, expiresAt } = await this.createVerificationToken(
                user.id, 
                user.email, 
                ipAddress, 
                userAgent
            );

            // Generate verification URL
            const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

            // Prepare email data
            const emailData = {
                userName: user.name,
                verificationUrl,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@translation-platform.com',
                companyName: process.env.COMPANY_NAME || 'Translation Platform',
                logoUrl: process.env.LOGO_URL || `${baseUrl}/logo.png`,
                expiresIn: '24 hours'
            };

            // Use template or fallback HTML
            let htmlContent;
            if (this.templates['email-verification']) {
                htmlContent = this.templates['email-verification'](emailData);
            } else {
                htmlContent = this.generateVerificationEmailHTML(emailData);
            }

            // Send email
            const mailOptions = {
                from: process.env.SMTP_FROM || 'noreply@translation-platform.com',
                to: user.email,
                subject: 'Verify Your Email Address - Translation Platform',
                html: htmlContent,
                text: this.generateVerificationEmailText(emailData)
            };

            let emailResult;
            if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
                // Development mode without SMTP - log to console
                console.log('📧 [DEV] Email would be sent:');
                console.log('  To:', user.email);
                console.log('  Subject:', mailOptions.subject);
                console.log('  Verification URL:', verificationUrl);
                emailResult = { messageId: 'dev-' + Date.now() };
            } else {
                // Send actual email
                emailResult = await this.transporter.sendMail(mailOptions);
            }

            // Log email send
            await this.logEmail({
                userId: user.id,
                emailType: 'verification',
                recipientEmail: user.email,
                subject: mailOptions.subject,
                templateUsed: 'email-verification',
                status: 'sent',
                ipAddress,
                userAgent
            });

            console.log(`📧 Verification email sent to ${user.email}`, { messageId: emailResult.messageId });

            return {
                success: true,
                tokenId,
                messageId: emailResult.messageId,
                expiresAt
            };

        } catch (error) {
            console.error('Error sending verification email:', error.message);
            
            // Log failed email
            await this.logEmail({
                userId: user.id,
                emailType: 'verification',
                recipientEmail: user.email,
                subject: 'Verify Your Email Address - Translation Platform',
                status: 'failed',
                errorMessage: error.message,
                ipAddress,
                userAgent
            });

            throw new Error('Failed to send verification email');
        }
    }

    // Generate HTML email content
    generateVerificationEmailHTML(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Your Email - ${data.companyName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { height: 50px; margin-bottom: 20px; }
        h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #1d4ed8; }
        .url-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 15px; margin: 20px 0; word-break: break-all; font-family: monospace; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${data.logoUrl}" alt="${data.companyName}" class="logo" onerror="this.style.display='none'">
        </div>
        
        <h1>Verify Your Email Address</h1>
        
        <p>Hi ${data.userName},</p>
        
        <p>Welcome to ${data.companyName}! To complete your registration and access all translation features, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <div class="url-box">${data.verificationUrl}</div>
        
        <p><strong>⚠️ This verification link will expire in ${data.expiresIn}.</strong></p>
        
        <p><strong>🔒 Why verify your email?</strong></p>
        <ul>
            <li>Access all translation features</li>
            <li>Secure your account</li>
            <li>Receive important updates</li>
            <li>Password recovery support</li>
        </ul>
        
        <div class="footer">
            <p>If you didn't create an account with ${data.companyName}, you can safely ignore this email.</p>
            <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    }

    // Generate text email content
    generateVerificationEmailText(data) {
        return `
Verify Your Email Address - ${data.companyName}

Hi ${data.userName},

Welcome to ${data.companyName}! To complete your registration and access all translation features, please verify your email address.

Verification Link: ${data.verificationUrl}

This verification link will expire in ${data.expiresIn}.

Why verify your email?
- Access all translation features
- Secure your account  
- Receive important updates
- Password recovery support

If you didn't create an account with ${data.companyName}, you can safely ignore this email.

Need help? Contact us at ${data.supportEmail}

© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.
`;
    }

    // Log email activity
    async logEmail(logData) {
        try {
            await query(`
                INSERT INTO email_logs 
                (user_id, email_type, recipient_email, subject, template_used, status, error_message, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                logData.userId,
                logData.emailType,
                logData.recipientEmail,
                logData.subject,
                logData.templateUsed,
                logData.status,
                logData.errorMessage || null,
                logData.ipAddress,
                logData.userAgent
            ]);
        } catch (error) {
            console.error('Error logging email:', error.message);
        }
    }

    // Cleanup expired tokens (should be run periodically)
    async cleanupExpiredTokens() {
        try {
            const result = await query(`
                DELETE FROM email_verification_tokens 
                WHERE expires_at < CURRENT_TIMESTAMP
            `);
            
            const deletedCount = result.rowCount;
            if (deletedCount > 0) {
                console.log(`🧹 Cleaned up ${deletedCount} expired verification tokens`);
            }
            
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired tokens:', error.message);
            return 0;
        }
    }

    // Check email configuration
    async checkConfiguration() {
        try {
            if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
                console.log('📧 Email service running in development mode (console output)');
                return { status: 'dev', message: 'Development mode - emails logged to console' };
            }

            await this.transporter.verify();
            console.log('📧 Email service configuration verified');
            return { status: 'ok', message: 'Email service configured correctly' };
        } catch (error) {
            console.error('❌ Email service configuration error:', error.message);
            return { status: 'error', message: error.message };
        }
    }
}

// Export singleton instance
const emailService = new EmailService();

// Initialize and check configuration
emailService.checkConfiguration();

// Cleanup expired tokens every hour
setInterval(() => {
    emailService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

module.exports = emailService;
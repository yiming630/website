# Alibaba Cloud DirectMail Integration Guide

## 🌟 Why Alibaba Cloud DirectMail?

✅ **Excellent China Deliverability** - Best email delivery rates in China  
✅ **Professional Service** - Enterprise-grade reliability  
✅ **Free Tier** - 200 emails/day free  
✅ **Fast Setup** - SMTP ready in minutes  
✅ **Scalable** - Handles high volume easily  
✅ **Analytics** - Detailed delivery reports  

---

## 📋 Setup Steps

### Step 1: Register Alibaba Cloud Account

1. **Visit**: https://www.alibabacloud.com
2. **Click "Free Account"**
3. **Use International version** (English interface)
4. **Complete registration** with email/phone
5. **Verify identity** (passport or Chinese ID)

### Step 2: Enable DirectMail Service

1. **Login to Alibaba Cloud Console**
2. **Search "DirectMail"** in products
3. **Click "DirectMail"** 
4. **Click "Activate Now"**
5. **Choose region**: China (Hangzhou) recommended
6. **Activate the service** (free)

### Step 3: Create Email Domain (Optional - for professional emails)

**For Custom Domain** (e.g., noreply@yourdomain.com):
1. **Go to DirectMail Console**
2. **Click "Domains"**
3. **Add Domain**: yourdomain.com
4. **Verify ownership** by adding DNS records
5. **Wait for verification** (usually 10-30 minutes)

**For Quick Start** (use Alibaba's domain):
- Skip domain setup, use default Alibaba domain

### Step 4: Create Sender Address

1. **In DirectMail Console → Email Addresses**
2. **Click "Create Mail Address"**
3. **Enter details**:
   - **Email Address**: noreply@yourdomain.com (or use Alibaba domain)
   - **Sender Name**: Translation Platform
   - **Reply Address**: support@yourdomain.com
4. **Click "OK"**

### Step 5: Get SMTP Credentials

1. **Go to DirectMail Console → SMTP**
2. **Click "Create SMTP User"**
3. **Enter Username**: translation-platform-smtp
4. **Click "Create"**
5. **Copy the credentials** (Username & Password)

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Alibaba Cloud DirectMail Configuration
NODE_ENV=production

# SMTP Settings
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=translation-platform-smtp@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Alternative ports (if 587 doesn't work)
# SMTP_PORT=25   # Standard
# SMTP_PORT=465  # SSL (set SMTP_SECURE=true)

# Application Settings
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@yourdomain.com
COMPANY_NAME=格式译专家
```

### DirectMail Integration Service

```javascript
// backend/services/api-gateway/src/services/alibabaDirectMailService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../utils/database');

class AlibabaDirectMailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        this.transporter = nodemailer.createTransporter({
            host: 'smtpdm.aliyun.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
            // Alibaba DirectMail specific settings
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000, // 1 second
            rateLimit: 5 // max 5 emails per second
        });

        console.log('📧 Alibaba DirectMail service initialized');
    }

    // Generate secure verification token
    generateVerificationToken() {
        const token = crypto.randomBytes(32).toString('hex');
        const saltRounds = 12;
        const salt = bcrypt.genSaltSync(saltRounds);
        const tokenHash = bcrypt.hashSync(token, salt);
        
        return { token, tokenHash, salt };
    }

    // Create verification token in database
    async createVerificationToken(userId, email, ipAddress = null, userAgent = null) {
        try {
            const { token, tokenHash, salt } = this.generateVerificationToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Clean up existing tokens
            await query(`DELETE FROM email_verification_tokens WHERE user_id = $1 OR email = $2`, [userId, email]);

            // Insert new token
            const result = await query(`
                INSERT INTO email_verification_tokens 
                (user_id, token_hash, salt, email, expires_at, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [userId, tokenHash, salt, email, expiresAt, ipAddress, userAgent]);

            return { tokenId: result.rows[0].id, token, expiresAt };
        } catch (error) {
            console.error('Error creating verification token:', error.message);
            throw new Error('Failed to create verification token');
        }
    }

    // Send verification email
    async sendVerificationEmail(user, ipAddress = null, userAgent = null) {
        try {
            // Create verification token
            const { token, tokenId, expiresAt } = await this.createVerificationToken(
                user.id, user.email, ipAddress, userAgent
            );

            // Generate verification URL
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

            // Email content
            const mailOptions = {
                from: {
                    name: process.env.COMPANY_NAME || 'Translation Platform',
                    address: process.env.SMTP_FROM
                },
                to: user.email,
                subject: '邮箱验证 - 格式译专家 Email Verification',
                html: this.generateEmailTemplate({
                    userName: user.name,
                    verificationUrl,
                    supportEmail: process.env.SUPPORT_EMAIL,
                    companyName: process.env.COMPANY_NAME || '格式译专家',
                    expiresIn: '24小时 (24 hours)'
                }),
                text: this.generateTextEmail({
                    userName: user.name,
                    verificationUrl,
                    companyName: process.env.COMPANY_NAME || '格式译专家'
                })
            };

            // Send email
            const result = await this.transporter.sendMail(mailOptions);

            // Log successful email
            await this.logEmail({
                userId: user.id,
                emailType: 'verification',
                recipientEmail: user.email,
                subject: mailOptions.subject,
                status: 'sent',
                messageId: result.messageId,
                ipAddress,
                userAgent
            });

            console.log(`📧 Verification email sent to ${user.email} via Alibaba DirectMail`, {
                messageId: result.messageId
            });

            return {
                success: true,
                tokenId,
                messageId: result.messageId,
                expiresAt
            };

        } catch (error) {
            console.error('Error sending verification email:', error.message);

            // Log failed email
            await this.logEmail({
                userId: user.id,
                emailType: 'verification',
                recipientEmail: user.email,
                subject: '邮箱验证 - 格式译专家',
                status: 'failed',
                errorMessage: error.message,
                ipAddress,
                userAgent
            });

            throw new Error('Failed to send verification email via Alibaba DirectMail');
        }
    }

    // Generate HTML email template
    generateEmailTemplate(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>邮箱验证 - ${data.companyName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        h1 { color: #2563eb; text-align: center; margin-bottom: 30px; font-size: 28px; }
        .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); }
        .url-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
        .features { background-color: #f8f9ff; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .features ul { margin: 0; padding-left: 20px; }
        .features li { margin: 8px 0; color: #4c51bf; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .bilingual { margin: 15px 0; }
        .chinese { font-size: 16px; color: #333; margin-bottom: 5px; }
        .english { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${data.companyName}</div>
            <div style="color: #666;">Professional Document Translation Platform</div>
        </div>
        
        <h1>
            <div class="chinese">验证您的邮箱地址</div>
            <div class="english" style="font-size: 18px; color: #666; font-weight: normal;">Verify Your Email Address</div>
        </h1>
        
        <div class="bilingual">
            <div class="chinese">尊敬的 ${data.userName}，您好！</div>
            <div class="english">Hello ${data.userName},</div>
        </div>
        
        <div class="bilingual">
            <div class="chinese">欢迎使用${data.companyName}！为了确保您的账户安全，请点击下方按钮验证您的邮箱地址：</div>
            <div class="english">Welcome to ${data.companyName}! To ensure account security, please click the button below to verify your email address:</div>
        </div>
        
        <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">
                验证邮箱 Verify Email
            </a>
        </div>
        
        <div class="bilingual">
            <div class="chinese">或复制以下链接到浏览器地址栏：</div>
            <div class="english">Or copy this link to your browser:</div>
        </div>
        <div class="url-box">${data.verificationUrl}</div>
        
        <div class="warning">
            <div class="chinese"><strong>⚠️ 重要提醒：该验证链接将在${data.expiresIn}后失效。</strong></div>
            <div class="english"><strong>⚠️ Important: This verification link will expire in ${data.expiresIn}.</strong></div>
        </div>
        
        <div class="features">
            <div class="chinese" style="font-weight: bold; margin-bottom: 10px;">邮箱验证后，您将可以：</div>
            <div class="english" style="font-weight: bold; margin-bottom: 10px;">After verification, you can:</div>
            <ul>
                <li>访问所有翻译功能 / Access all translation features</li>
                <li>保存翻译项目 / Save translation projects</li>
                <li>获得客服支持 / Get customer support</li>
                <li>享受高级功能 / Enjoy premium features</li>
            </ul>
        </div>
        
        <div class="footer">
            <div class="bilingual">
                <div class="chinese">如果您没有注册此账户，请忽略此邮件。</div>
                <div class="english">If you didn't create this account, please ignore this email.</div>
            </div>
            <div class="bilingual" style="margin-top: 10px;">
                <div class="chinese">需要帮助？联系我们：<a href="mailto:${data.supportEmail}">${data.supportEmail}</a></div>
                <div class="english">Need help? Contact us: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></div>
            </div>
            <div style="margin-top: 15px;">
                <div>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</div>
                <div>Powered by Alibaba Cloud DirectMail</div>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    // Generate plain text email
    generateTextEmail(data) {
        return `
邮箱验证 - ${data.companyName}
Email Verification - ${data.companyName}

尊敬的 ${data.userName}：
Hello ${data.userName},

欢迎使用${data.companyName}！请验证您的邮箱地址。
Welcome to ${data.companyName}! Please verify your email address.

验证链接 / Verification Link:
${data.verificationUrl}

该链接24小时内有效。
This link expires in 24 hours.

如果您没有注册此账户，请忽略此邮件。
If you didn't create this account, please ignore this email.

需要帮助？联系我们：${data.supportEmail}
Need help? Contact us: ${data.supportEmail}

© ${new Date().getFullYear()} ${data.companyName}
Powered by Alibaba Cloud DirectMail
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
                'alibaba-directmail',
                logData.status,
                logData.errorMessage || null,
                logData.ipAddress,
                logData.userAgent
            ]);
        } catch (error) {
            console.error('Error logging email:', error.message);
        }
    }

    // Verify token (reuse existing method)
    verifyToken(token, storedHash, salt) {
        try {
            return bcrypt.compareSync(token, storedHash);
        } catch (error) {
            console.error('Token verification error:', error.message);
            return false;
        }
    }

    // Check email service health
    async checkHealth() {
        try {
            await this.transporter.verify();
            console.log('✅ Alibaba DirectMail service is healthy');
            return { status: 'healthy', service: 'alibaba-directmail' };
        } catch (error) {
            console.error('❌ Alibaba DirectMail service error:', error.message);
            return { status: 'error', service: 'alibaba-directmail', error: error.message };
        }
    }
}

module.exports = new AlibabaDirectMailService();
```

---

## 🔄 Integration with Current System

### Update Email Service

```javascript
// backend/services/api-gateway/src/services/emailService.js
// Replace the existing emailService with Alibaba DirectMail

// Option 1: Replace entirely
module.exports = require('./alibabaDirectMailService');

// Option 2: Fallback system
const alibabaService = require('./alibabaDirectMailService');
const originalService = require('./originalEmailService');

class HybridEmailService {
    async sendVerificationEmail(user, ipAddress, userAgent) {
        try {
            // Try Alibaba DirectMail first
            return await alibabaService.sendVerificationEmail(user, ipAddress, userAgent);
        } catch (error) {
            console.warn('Alibaba DirectMail failed, falling back to original service');
            return await originalService.sendVerificationEmail(user, ipAddress, userAgent);
        }
    }
    
    // Proxy other methods
    verifyToken(...args) { return alibabaService.verifyToken(...args); }
    verifyEmailToken(...args) { return alibabaService.verifyEmailToken(...args); }
}

module.exports = new HybridEmailService();
```

---

## 🧪 Testing

### Test SMTP Connection

```javascript
// test-alibaba-smtp.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
    host: 'smtpdm.aliyun.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function testConnection() {
    try {
        await transporter.verify();
        console.log('✅ Alibaba DirectMail SMTP connection successful!');
        
        // Send test email
        const result = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: 'your-test-email@example.com',
            subject: 'Test Email from Alibaba DirectMail',
            html: '<h1>Test successful!</h1><p>Alibaba DirectMail is working correctly.</p>'
        });
        
        console.log('✅ Test email sent:', result.messageId);
    } catch (error) {
        console.error('❌ Alibaba DirectMail test failed:', error.message);
    }
}

testConnection();
```

---

## 🚀 Quick Setup Checklist

- [ ] Register Alibaba Cloud account
- [ ] Activate DirectMail service  
- [ ] Create sender address
- [ ] Get SMTP credentials
- [ ] Update .env file
- [ ] Replace email service
- [ ] Test with real email
- [ ] Monitor delivery rates

---

## 📊 Monitoring & Analytics

### DirectMail Console Features:
- **Delivery Reports** - Real-time stats
- **Bounce Handling** - Automatic bounce management  
- **Reputation Monitoring** - Sender reputation tracking
- **Usage Analytics** - Daily/monthly usage reports

### API Monitoring:
```javascript
// Add to your monitoring dashboard
const emailStats = await alibabaService.checkHealth();
console.log('Email service status:', emailStats);
```

---

## 💡 Pro Tips

1. **Domain Verification** - Verify your domain for better deliverability
2. **Sender Reputation** - Monitor bounce rates (keep under 5%)
3. **Rate Limiting** - DirectMail has built-in rate limiting
4. **Template Testing** - Test emails in different clients
5. **Backup Service** - Keep your current SMTP as fallback

---

## 📞 Need Help?

- **Alibaba Cloud Support**: https://www.alibabacloud.com/support
- **DirectMail Docs**: https://www.alibabacloud.com/help/directmail
- **SMTP Troubleshooting**: Check firewall, ports 25/587/465
- **Delivery Issues**: Monitor bounce rates in console

Ready to implement? I can help you set up the Alibaba DirectMail service step by step!
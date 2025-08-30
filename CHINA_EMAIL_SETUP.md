# China-Compatible Email Verification Guide

## 🚫 What Doesn't Work in China
- Firebase (Google) - Blocked
- SendGrid (US-based) - Often blocked/slow
- Mailgun (US-based) - Unreliable
- Gmail SMTP - Blocked
- AWS SES (US regions) - Blocked

## ✅ What Works in China

### 1. **Tencent Cloud Email (腾讯云邮件推送)** - Recommended
- **Pros**: Fast, reliable, great deliverability in China
- **Cons**: Chinese documentation, requires ICP filing for custom domains
- **Free Tier**: 1,000 emails/month
- **Website**: https://cloud.tencent.com/product/ses

### 2. **Alibaba Cloud DirectMail (阿里云邮件推送)**
- **Pros**: Excellent China delivery, integrated with Alibaba ecosystem
- **Cons**: Complex setup, Chinese interface
- **Free Tier**: 200 emails/day
- **Website**: https://www.alibabacloud.com/product/directmail

### 3. **Netease Mail (网易邮箱) SMTP**
- **Pros**: Simple setup, reliable
- **Cons**: Limited free tier
- **Free Tier**: 200 emails/day

### 4. **QQ Mail SMTP**
- **Pros**: Very reliable in China, easy setup
- **Cons**: Personal account required
- **Free Tier**: Good for development

### 5. **SMS Verification (推荐备选)**
- **Pros**: Universal, fast, no email deliverability issues
- **Cons**: Costs more, requires phone number
- **Providers**: Tencent SMS, Alibaba SMS, Yunpian

---

## 🚀 Quick Solutions (Easiest First)

### Option 1: QQ Mail SMTP (5 minutes setup)
```env
# .env configuration
NODE_ENV=production
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=your-smtp-password  # Generate in QQ Mail settings
SMTP_FROM=your-qq-email@qq.com
```

**Setup Steps:**
1. Create QQ Mail account: https://mail.qq.com
2. Enable SMTP: Settings → Account → Generate SMTP password
3. Use the generated password (not your login password)

### Option 2: 163 Mail (NetEase) SMTP
```env
NODE_ENV=production
SMTP_HOST=smtp.163.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=your-email@163.com
```

**Setup Steps:**
1. Register: https://mail.163.com
2. Enable SMTP in settings
3. Generate client password

---

## 🏆 Professional Solution: Tencent Cloud Email

### Step 1: Register Tencent Cloud
1. Visit: https://cloud.tencent.com
2. Register with Chinese phone number
3. Complete identity verification (需要身份证)

### Step 2: Enable Email Service
1. Go to Products → Email Push (邮件推送)
2. Activate the service
3. Complete domain verification (if using custom domain)

### Step 3: Get SMTP Credentials
```env
# Tencent Cloud Email Configuration
SMTP_HOST=smtp.qcloudmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Step 4: Node.js Integration
```javascript
// backend/services/api-gateway/src/services/tencentEmailService.js
const nodemailer = require('nodemailer');

class TencentEmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: 'smtp.qcloudmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.TENCENT_SMTP_USER,
                pass: process.env.TENCENT_SMTP_PASSWORD
            }
        });
    }

    async sendVerificationEmail(user, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: '邮箱验证 - 格式译专家',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">验证您的邮箱</h1>
                    <p>亲爱的 ${user.name}，</p>
                    <p>欢迎使用格式译专家！请点击下方按钮验证您的邮箱地址：</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #007cff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            验证邮箱
                        </a>
                    </div>
                    <p>或复制以下链接到浏览器：</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
                        ${verificationUrl}
                    </p>
                    <p><small>该链接24小时内有效</small></p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        如果您没有注册账户，请忽略此邮件。<br>
                        有疑问请联系客服：support@yoursite.com
                    </p>
                </div>
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('📧 腾讯云邮件发送成功:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ 腾讯云邮件发送失败:', error);
            throw new Error('邮件发送失败');
        }
    }
}

module.exports = new TencentEmailService();
```

---

## 📱 SMS Verification Alternative

For better reliability, consider SMS verification:

### Tencent SMS Service
```javascript
// backend/services/api-gateway/src/services/tencentSmsService.js
const tencentcloud = require("tencentcloud-sdk-nodejs");

class TencentSmsService {
    constructor() {
        const SmsClient = tencentcloud.sms.v20210111.Client;
        this.client = new SmsClient({
            credential: {
                secretId: process.env.TENCENT_SECRET_ID,
                secretKey: process.env.TENCENT_SECRET_KEY,
            },
            region: "ap-guangzhou",
        });
    }

    async sendVerificationSms(phoneNumber, code) {
        const params = {
            PhoneNumberSet: [`+86${phoneNumber}`],
            SmsSdkAppId: process.env.TENCENT_SMS_APP_ID,
            TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
            TemplateParamSet: [code, "5"], // 验证码和过期时间(分钟)
        };

        try {
            const result = await this.client.SendSms(params);
            return { success: true, result };
        } catch (error) {
            console.error('SMS发送失败:', error);
            throw error;
        }
    }
}
```

---

## 🛠️ Immediate Solution (Use Current System)

Your current email system will work with Chinese email providers:

### Update .env for QQ Mail:
```env
# Quick fix - use QQ Mail
NODE_ENV=production
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-qq-email@qq.com
SMTP_PASSWORD=your-qq-smtp-password
SMTP_FROM=your-qq-email@qq.com

# Update URLs
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=your-qq-email@qq.com
```

### Test QQ Mail Setup:
```javascript
// Test script
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransporter({
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

transporter.verify()
    .then(() => console.log('✅ QQ Mail SMTP ready'))
    .catch(error => console.error('❌ SMTP Error:', error));
```

---

## 📊 China Email Service Comparison

| Service | Setup | Deliverability | Cost | Documentation |
|---------|-------|----------------|------|---------------|
| QQ Mail | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Chinese |
| 163 Mail | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free | Chinese |
| Tencent Cloud | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ¥0.001/email | Chinese/English |
| Alibaba DirectMail | ⭐⭐ | ⭐⭐⭐⭐⭐ | ¥0.002/email | Chinese/English |
| SMS (Tencent) | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ¥0.055/SMS | Chinese/English |

---

## 🎯 My Recommendation

For your use case, I recommend:

1. **Immediate**: Use QQ Mail SMTP (works right now)
2. **Short-term**: Upgrade to Tencent Cloud Email
3. **Long-term**: Add SMS verification as backup

The QQ Mail solution will work immediately with your current code - just update the SMTP settings in your .env file.

---

## 🔧 Quick Implementation

Want me to help you set up QQ Mail SMTP right now? It will work with your existing email verification system and takes just 5 minutes to configure.
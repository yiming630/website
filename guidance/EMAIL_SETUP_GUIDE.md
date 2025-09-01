# Email Verification Setup Guide

## 🚀 Quick Start - Gmail (Easiest)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification

### Step 2: Generate App Password
1. Visit https://myaccount.google.com/apppasswords
2. Select "Mail" from dropdown
3. Copy the 16-character password

### Step 3: Update .env File
```env
# Email Configuration - Gmail
NODE_ENV=production  # Change from development to production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Your 16-char app password
SMTP_FROM=your-email@gmail.com

# Frontend URL (for verification links)
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=your-email@gmail.com
```

### Step 4: Restart API Gateway
```bash
# Kill current process (Ctrl+C)
# Restart with new config
cd backend/services/api-gateway
npm run dev
```

---

## 📧 Professional Options

### SendGrid (Recommended for Production)
```env
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
SMTP_FROM=noreply@yourdomain.com
```

### Mailgun
```env
# Mailgun Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@yourdomain.com
```

### AWS SES
```env
# AWS SES Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASSWORD=your-aws-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Resend (Modern API)
```bash
# Install Resend package
cd backend/services/api-gateway
npm install resend
```

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=onboarding@resend.dev  # Or your verified domain
```

---

## 🧪 Local Testing with MailHog

### Option 1: Docker
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

### Option 2: Direct Download
1. Download from: https://github.com/mailhog/MailHog/releases
2. Run the executable
3. View emails at: http://localhost:8025

### MailHog .env Configuration
```env
NODE_ENV=development
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
# No authentication needed
```

---

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid login" or "Authentication failed"**
   - Double-check your app password (not your regular password)
   - Ensure 2FA is enabled for Gmail
   - Check if "Less secure app access" needs to be enabled

2. **"Connection timeout"**
   - Check firewall settings
   - Try port 465 with SMTP_SECURE=true
   - Verify network connectivity

3. **"Self signed certificate" error**
   ```env
   # Add to .env
   NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for development!
   ```

4. **Emails going to spam**
   - Add SPF/DKIM records to your domain
   - Use a proper FROM address
   - Avoid spam trigger words

### Testing Your Configuration

```bash
# Test email sending
cd backend/services/api-gateway
node -e "
require('dotenv').config({ path: '../../../.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

transporter.verify()
  .then(() => console.log('✅ Email configuration is correct!'))
  .catch((error) => console.error('❌ Email configuration error:', error.message));
"
```

---

## 📊 Email Service Comparison

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|-----------------|----------|
| Gmail SMTP | 500/day | Easy | Development |
| SendGrid | 100/day | Medium | Production |
| Mailgun | 10,000/month | Medium | High volume |
| AWS SES | Pay-per-use | Hard | AWS users |
| Resend | 100/day | Easy | Modern apps |
| MailHog | Unlimited | Easy | Local testing |

---

## 🔒 Security Best Practices

1. **Never commit credentials**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use environment variables**
   - Store all credentials in .env
   - Use different credentials for dev/prod

3. **Enable rate limiting**
   - Prevent email bombing
   - Already implemented in the code

4. **Validate email addresses**
   - Check format before sending
   - Block disposable email domains

5. **Monitor email metrics**
   - Track delivery rates
   - Monitor bounce rates
   - Check spam complaints

---

## 🚀 Quick Test

After configuration, test the email system:

1. **Register a new user**
   - Go to http://localhost:3000/login
   - Click "Register"
   - Enter your details

2. **Check email delivery**
   - Gmail: Check inbox/spam
   - MailHog: Visit http://localhost:8025
   - Console: Check API Gateway logs

3. **Verify email**
   - Click the link in the email
   - Or visit: http://localhost:3000/verify-email?token=YOUR_TOKEN

---

## 📝 Environment Variables Reference

```env
# Required for production email sending
NODE_ENV=production          # Switch from 'development' to 'production'
SMTP_HOST=smtp.gmail.com     # SMTP server address
SMTP_PORT=587                # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false            # true for port 465, false for 587
SMTP_USER=email@gmail.com    # Your email address
SMTP_PASSWORD=app-password   # App-specific password
SMTP_FROM=email@gmail.com    # From address for emails

# Optional customization
FRONTEND_URL=http://localhost:3000              # Your frontend URL
SUPPORT_EMAIL=support@yourcompany.com           # Support email
COMPANY_NAME=Translation Platform               # Company name
LOGO_URL=http://localhost:3000/logo.png        # Logo URL
EMAIL_VERIFICATION_TOKEN_EXPIRY=24h            # Token expiry time
EMAIL_RATE_LIMIT_WINDOW=15m                    # Rate limit window
EMAIL_RATE_LIMIT_MAX=3                         # Max emails per window
```

---

## 💡 Tips

1. **Start with Gmail for testing** - It's the easiest to set up
2. **Use MailHog for local development** - Catch all emails locally
3. **Switch to SendGrid/Mailgun for production** - Better deliverability
4. **Always test with real email addresses** - Some providers block test addresses
5. **Monitor your email logs** - Check the `email_logs` table in PostgreSQL

---

## Need Help?

- Check API Gateway logs: `backend/services/api-gateway/logs/`
- View email logs in database: `SELECT * FROM email_logs ORDER BY sent_at DESC;`
- Test SMTP connection using the script above
- For Gmail issues, check: https://support.google.com/mail/answer/185833
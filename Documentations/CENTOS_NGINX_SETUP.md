# CentOS Nginx Setup Guide for Translation Platform

## Prerequisites
- CentOS 7/8/9 server with root or sudo access
- Domain name pointing to your server IP (optional but recommended)
- Your translation platform deployed and running

## 1. Install Nginx on CentOS

### CentOS 7/8:
```bash
# Install EPEL repository
sudo yum install -y epel-release

# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### CentOS 9 (Stream):
```bash
# Install Nginx
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## 2. Configure Firewall

```bash
# Allow HTTP and HTTPS traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verify firewall rules
sudo firewall-cmd --list-all
```

## 3. Nginx Configuration for Translation Platform

### Main Configuration
Create a new configuration file for your application:

```bash
sudo nano /etc/nginx/conf.d/translation-platform.conf
```

Add the following configuration:

```nginx
# Upstream servers for load balancing
upstream frontend {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream api_gateway {
    server 127.0.0.1:4000;
    keepalive 64;
}

upstream document_service {
    server 127.0.0.1:8001;
    keepalive 64;
}

# HTTP Server (Redirect to HTTPS in production)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # For development without SSL
    # Comment out this block if not using SSL
    # return 301 https://$server_name$request_uri;
    
    # Root directory for static files
    root /var/www/translation-platform;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for Next.js HMR in development
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API Gateway (GraphQL)
    location /graphql {
        proxy_pass http://api_gateway/graphql;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # GraphQL specific
        proxy_set_header Content-Type "application/json";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers (adjust as needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Document Processing Service
    location /api/documents {
        proxy_pass http://document_service;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload settings
        client_max_body_size 100M;
        proxy_request_buffering off;
    }
    
    # Static files optimization
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Next.js static files
    location /_next/static {
        proxy_pass http://frontend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# HTTPS Server (Production)
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL certificates (update paths)
    ssl_certificate /etc/nginx/ssl/your-domain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL session caching
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Add all the location blocks from the HTTP server above
    # (Copy all location blocks here for HTTPS)
}
```

## 4. Nginx Performance Tuning

Edit the main Nginx configuration:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add/modify these settings:

```nginx
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    multi_accept on;
    worker_connections 4096;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml 
               text/x-js text/x-cross-domain-policy application/x-font-ttf 
               application/x-font-opentype application/vnd.ms-fontobject 
               image/x-icon;
    
    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 100M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Cache settings
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:10m max_size=1g inactive=60m use_temp_path=off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    
    # Include other configurations
    include /etc/nginx/conf.d/*.conf;
}
```

## 5. SSL Certificate Setup (Let's Encrypt)

Install Certbot for free SSL certificates:

```bash
# CentOS 7/8
sudo yum install -y certbot python3-certbot-nginx

# CentOS 9
sudo dnf install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

## 6. SELinux Configuration (if enabled)

```bash
# Check SELinux status
sestatus

# If SELinux is enforcing, allow Nginx to proxy
sudo setsebool -P httpd_can_network_connect 1

# Allow Nginx to read from custom directories
sudo chcon -Rt httpd_sys_content_t /var/www/translation-platform
```

## 7. Service Management with systemd

Create systemd service files for your application:

### Frontend Service
```bash
sudo vim /etc/systemd/system/translation-frontend.service
```

```ini
[Unit]
Description=Translation Platform Frontend
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/translation-platform/website
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### API Gateway Service
```bash
sudo vim /etc/systemd/system/translation-api.service
```

```ini
[Unit]
Description=Translation Platform API Gateway
After=network.target postgresql.service

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/translation-platform/backend/services/api-gateway
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
```

### Enable and start services
```bash
sudo systemctl daemon-reload
sudo systemctl enable translation-frontend translation-api
sudo systemctl start translation-frontend translation-api
```

## 8. Monitoring and Logs

### View Nginx logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Custom application logs
sudo journalctl -u translation-frontend -f
sudo journalctl -u translation-api -f
```

### Nginx status monitoring
```bash
# Add to nginx configuration
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

## 9. Security Best Practices

### Install and configure fail2ban
```bash
sudo yum install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Create fail2ban jail for Nginx
```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 60
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 86400
```

## 10. Useful Commands

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx version
nginx -v

# Check loaded modules
nginx -V

# Monitor connections
ss -tln | grep -E ':80|:443'

# Check process
ps aux | grep nginx

# SELinux troubleshooting
sudo ausearch -m avc -ts recent
sudo audit2allow -a
```

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway**: Check if backend services are running
   ```bash
   sudo systemctl status translation-frontend
   sudo systemctl status translation-api
   ```

2. **Permission Denied**: Check SELinux and file permissions
   ```bash
   sudo setenforce 0  # Temporarily disable SELinux for testing
   ls -la /var/www/translation-platform
   ```

3. **Connection Refused**: Check firewall and ports
   ```bash
   sudo firewall-cmd --list-all
   sudo netstat -tulpn | grep -E '3000|4000|8001'
   ```

4. **Slow Performance**: Check Nginx worker processes
   ```bash
   ps aux | grep nginx
   top -u nginx
   ```

## Production Deployment Checklist

- [ ] SSL certificates installed and auto-renewal configured
- [ ] Firewall rules configured
- [ ] SELinux policies set
- [ ] Services enabled for auto-start
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Log rotation configured
- [ ] Rate limiting enabled
- [ ] Security headers added
- [ ] fail2ban configured
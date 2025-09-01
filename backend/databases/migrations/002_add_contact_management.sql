-- Contact Management System Migration
-- Creates tables and functions for managing contact inquiries

-- 1. Create contact inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL, -- NULL if submitted by anonymous user
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    inquiry_type VARCHAR(100) NOT NULL, -- 产品咨询, 技术支持, etc.
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- new, in_progress, resolved, closed
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    assigned_to UUID NULL, -- admin user assigned to handle inquiry
    admin_notes TEXT NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    source VARCHAR(50) DEFAULT 'website', -- website, api, mobile_app
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    last_response_at TIMESTAMP NULL
);

-- 2. Create contact responses table (for admin responses)
CREATE TABLE IF NOT EXISTS contact_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL,
    admin_id UUID NOT NULL, -- admin user who responded
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE, -- whether user can see this response
    response_type VARCHAR(50) DEFAULT 'reply', -- reply, internal_note, status_change
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create contact categories table (for better organization)
CREATE TABLE IF NOT EXISTS contact_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color for UI
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create contact templates table (for common responses)
CREATE TABLE IF NOT EXISTS contact_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_user_id ON contact_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_priority ON contact_inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_inquiry_type ON contact_inquiries(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_assigned_to ON contact_inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at);

CREATE INDEX IF NOT EXISTS idx_contact_responses_inquiry_id ON contact_responses(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_contact_responses_admin_id ON contact_responses(admin_id);
CREATE INDEX IF NOT EXISTS idx_contact_responses_created_at ON contact_responses(created_at);

-- 6. Add foreign key constraints
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Contact inquiries can be linked to registered users
        ALTER TABLE contact_inquiries 
        ADD CONSTRAINT fk_contact_inquiries_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        
        -- Inquiries can be assigned to admin users
        ALTER TABLE contact_inquiries 
        ADD CONSTRAINT fk_contact_inquiries_assigned_to 
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
        
        -- Responses are linked to admin users
        ALTER TABLE contact_responses 
        ADD CONSTRAINT fk_contact_responses_admin_id 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
        
        -- Templates can be created by users
        ALTER TABLE contact_templates 
        ADD CONSTRAINT fk_contact_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Contact responses must belong to an inquiry
ALTER TABLE contact_responses 
ADD CONSTRAINT fk_contact_responses_inquiry_id 
FOREIGN KEY (inquiry_id) REFERENCES contact_inquiries(id) ON DELETE CASCADE;

-- 7. Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_contact_inquiries_timestamp 
    BEFORE UPDATE ON contact_inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS update_contact_responses_timestamp 
    BEFORE UPDATE ON contact_responses 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS update_contact_templates_timestamp 
    BEFORE UPDATE ON contact_templates 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 8. Insert default contact categories
INSERT INTO contact_categories (name, description, color, sort_order) VALUES
('产品咨询', '关于产品功能和使用的问题', '#3B82F6', 1),
('技术支持', '技术问题和故障排除', '#EF4444', 2),
('使用帮助', '使用指南和操作帮助', '#10B981', 3),
('账户问题', '账户相关的问题和请求', '#F59E0B', 4),
('翻译质量反馈', '对翻译结果的反馈和建议', '#8B5CF6', 5),
('功能建议', '新功能建议和改进意见', '#06B6D4', 6),
('商务合作', '商业合作和合作伙伴关系', '#EC4899', 7),
('价格咨询', '定价和计费相关问题', '#84CC16', 8),
('Bug反馈', 'Bug报告和问题反馈', '#F97316', 9),
('其他问题', '其他类型的咨询和问题', '#6B7280', 10)
ON CONFLICT (name) DO NOTHING;

-- 9. Insert default response templates
INSERT INTO contact_templates (name, subject, content, category) VALUES
('感谢咨询', '感谢您的咨询 - 格式译专家', '感谢您联系格式译专家！

我们已经收到您的咨询，我们的团队将在24小时内回复您。

如果您的问题比较紧急，请直接发送邮件到 seekhub@gmail.com 或查看我们的常见问题解答。

祝好！
格式译专家团队', '产品咨询'),

('技术支持回复', '技术支持回复 - 格式译专家', '您好，

关于您遇到的技术问题，我们建议您：

1. 检查您的网络连接
2. 清除浏览器缓存
3. 尝试使用其他浏览器

如果问题仍然存在，请提供更多详细信息，我们将进一步协助您。

最好的祝愿，
格式译专家技术团队', '技术支持'),

('功能说明', '功能详细说明 - 格式译专家', '您好，

感谢您对我们产品功能的关注。根据您的咨询，我们很高兴为您详细介绍相关功能。

我们的平台主要特点包括：
- 智能格式保持
- 多语言支持
- 专业术语库
- 实时协作

如需了解更多详情，欢迎访问我们的帮助中心或直接联系我们。

祝您使用愉快！
格式译专家团队', '使用帮助')
ON CONFLICT DO NOTHING;

-- 10. Create function to get inquiry statistics
CREATE OR REPLACE FUNCTION get_contact_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_inquiries BIGINT,
    new_inquiries BIGINT,
    resolved_inquiries BIGINT,
    avg_resolution_time INTERVAL,
    most_common_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
            AVG(resolved_at - created_at) as avg_time
        FROM contact_inquiries 
        WHERE created_at::date BETWEEN start_date AND end_date
    ),
    common_type AS (
        SELECT inquiry_type
        FROM contact_inquiries 
        WHERE created_at::date BETWEEN start_date AND end_date
        GROUP BY inquiry_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        stats.total,
        stats.new_count,
        stats.resolved_count,
        stats.avg_time,
        common_type.inquiry_type
    FROM stats, common_type;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to auto-assign inquiries to admins (round-robin)
CREATE OR REPLACE FUNCTION auto_assign_inquiry()
RETURNS TRIGGER AS $$
DECLARE
    next_admin_id UUID;
BEGIN
    -- Find next admin to assign (simple round-robin)
    SELECT u.id INTO next_admin_id
    FROM users u
    WHERE u.role = 'ADMIN' 
    AND u.account_status = 'active'
    ORDER BY (
        SELECT COALESCE(COUNT(*), 0) 
        FROM contact_inquiries ci 
        WHERE ci.assigned_to = u.id 
        AND ci.status NOT IN ('resolved', 'closed')
    )
    LIMIT 1;
    
    -- Assign if admin found
    IF next_admin_id IS NOT NULL THEN
        NEW.assigned_to := next_admin_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment (optional - can be disabled)
-- CREATE TRIGGER auto_assign_contact_inquiry 
--     BEFORE INSERT ON contact_inquiries 
--     FOR EACH ROW EXECUTE FUNCTION auto_assign_inquiry();
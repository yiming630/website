const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');
const emailService = require('../services/emailService');

const emailVerificationResolvers = {
    Query: {
        // Check email verification token status
        checkEmailVerificationStatus: async (_, { token }) => {
            try {
                // Find token in database (without consuming it)
                const result = await query(`
                    SELECT 
                        evt.id, evt.user_id, evt.token_hash, evt.salt, evt.email,
                        evt.expires_at, evt.used_at,
                        u.id as user_exists, u.name, u.email as user_email, u.email_verified
                    FROM email_verification_tokens evt
                    LEFT JOIN users u ON evt.user_id = u.id
                `);

                if (result.rows.length === 0) {
                    return {
                        valid: false,
                        expired: false,
                        used: false,
                        user: null
                    };
                }

                // Find the correct token by verifying hash
                let validTokenRow = null;
                for (const row of result.rows) {
                    if (emailService.verifyToken(token, row.token_hash, row.salt)) {
                        validTokenRow = row;
                        break;
                    }
                }

                if (!validTokenRow) {
                    return {
                        valid: false,
                        expired: false,
                        used: false,
                        user: null
                    };
                }

                const now = new Date();
                const expiresAt = new Date(validTokenRow.expires_at);
                const isExpired = now > expiresAt;
                const isUsed = validTokenRow.used_at !== null;

                return {
                    valid: !isExpired && !isUsed,
                    expired: isExpired,
                    used: isUsed,
                    user: validTokenRow.user_exists ? {
                        id: validTokenRow.user_id,
                        name: validTokenRow.name,
                        email: validTokenRow.user_email,
                        emailVerified: validTokenRow.email_verified
                    } : null
                };
            } catch (error) {
                console.error('Error checking verification status:', error.message);
                throw new Error('Failed to check verification status');
            }
        }
    },

    Mutation: {
        // Send verification email to a specific email address
        sendVerificationEmail: async (_, { email }, { req }) => {
            try {
                // Find user by email
                const userResult = await query(
                    'SELECT * FROM users WHERE email = $1',
                    [email.toLowerCase().trim()]
                );

                if (userResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'No account found with this email address',
                        emailSent: false
                    };
                }

                const user = userResult.rows[0];

                // Check if user is already verified
                if (user.email_verified) {
                    return {
                        success: false,
                        message: 'Email address is already verified',
                        emailSent: false
                    };
                }

                // Get client info for security logging
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');

                // Send verification email
                await emailService.sendVerificationEmail(user, ipAddress, userAgent);

                return {
                    success: true,
                    message: 'Verification email sent successfully',
                    emailSent: true
                };
            } catch (error) {
                console.error('Error sending verification email:', error.message);
                return {
                    success: false,
                    message: 'Failed to send verification email',
                    emailSent: false
                };
            }
        },

        // Resend verification email to current user
        resendVerificationEmail: async (_, args, { user, req }) => {
            try {
                if (!user) {
                    throw new Error('Authentication required');
                }

                // Check if user is already verified
                if (user.emailVerified || user.email_verified) {
                    return {
                        success: false,
                        message: 'Email address is already verified',
                        emailSent: false
                    };
                }

                // Get client info for security logging
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');

                // Send verification email
                await emailService.sendVerificationEmail(user, ipAddress, userAgent);

                return {
                    success: true,
                    message: 'Verification email sent successfully',
                    emailSent: true
                };
            } catch (error) {
                console.error('Error resending verification email:', error.message);
                return {
                    success: false,
                    message: error.message || 'Failed to send verification email',
                    emailSent: false
                };
            }
        },

        // Verify email with token
        verifyEmail: async (_, { token }, { req }) => {
            try {
                // Verify the email token
                const verificationResult = await emailService.verifyEmailToken(token);

                if (!verificationResult.success) {
                    return {
                        success: false,
                        message: 'Invalid or expired verification token',
                        user: null,
                        tokens: null
                    };
                }

                // Get updated user data
                const userResult = await query(`
                    SELECT 
                        id, name, email, role, plan, preferences, 
                        email_verified, email_verified_at, account_status,
                        created_at, last_login
                    FROM users 
                    WHERE id = $1
                `, [verificationResult.userId]);

                if (userResult.rows.length === 0) {
                    return {
                        success: false,
                        message: 'User not found',
                        user: null,
                        tokens: null
                    };
                }

                const user = userResult.rows[0];

                // Generate new JWT tokens for the verified user
                const accessToken = jwt.sign(
                    { 
                        userId: user.id, 
                        email: user.email, 
                        role: user.role,
                        emailVerified: true 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
                );

                const refreshToken = jwt.sign(
                    { 
                        userId: user.id,
                        type: 'refresh'
                    },
                    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
                );

                // Update last login
                await query(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );

                console.log(`✅ Email verified successfully for user: ${user.email}`);

                return {
                    success: true,
                    message: 'Email verified successfully! You can now access all translation features.',
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: user.email_verified,
                        emailVerifiedAt: user.email_verified_at,
                        accountStatus: user.account_status.toUpperCase(),
                        role: user.role,
                        plan: user.plan,
                        preferences: user.preferences,
                        createdAt: user.created_at,
                        lastLogin: user.last_login
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                };
            } catch (error) {
                console.error('Error verifying email:', error.message);
                return {
                    success: false,
                    message: error.message || 'Failed to verify email',
                    user: null,
                    tokens: null
                };
            }
        },

        // Updated register mutation to send verification email
        register: async (_, { input }, { req }) => {
            try {
                const { name, email, password, role = 'TRANSLATOR' } = input;

                // Validate input
                if (!name || name.trim().length < 2) {
                    throw new Error('Name must be at least 2 characters long');
                }

                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    throw new Error('Valid email address is required');
                }

                if (!password || password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                const cleanEmail = email.toLowerCase().trim();

                // Check if user already exists
                const existingUser = await query(
                    'SELECT id, email_verified FROM users WHERE email = $1',
                    [cleanEmail]
                );

                if (existingUser.rows.length > 0) {
                    const user = existingUser.rows[0];
                    if (user.email_verified) {
                        throw new Error('An account with this email address already exists');
                    } else {
                        // User exists but not verified - resend verification email
                        const ipAddress = req.ip || req.connection.remoteAddress;
                        const userAgent = req.get('User-Agent');
                        
                        await emailService.sendVerificationEmail(
                            { id: user.id, name: name, email: cleanEmail },
                            ipAddress,
                            userAgent
                        );
                        
                        return {
                            user: null,
                            tokens: null,
                            message: 'An unverified account with this email exists. We\'ve sent a new verification email.'
                        };
                    }
                }

                // Hash password with salt
                const saltRounds = 12;
                const salt = await bcrypt.genSalt(saltRounds);
                const passwordHash = await bcrypt.hash(password, salt);

                // Create new user
                const userResult = await query(`
                    INSERT INTO users (name, email, password_hash, password_salt, role, account_status)
                    VALUES ($1, $2, $3, $4, $5, 'pending')
                    RETURNING id, name, email, role, plan, account_status, created_at
                `, [name.trim(), cleanEmail, passwordHash, salt, role.toUpperCase()]);

                const newUser = userResult.rows[0];

                // Get client info for security logging
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');

                // Send verification email
                try {
                    await emailService.sendVerificationEmail(newUser, ipAddress, userAgent);
                } catch (emailError) {
                    console.error('Failed to send verification email:', emailError.message);
                    // Don't fail registration if email fails
                }

                console.log(`📝 New user registered: ${cleanEmail} (verification email sent)`);

                return {
                    user: {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        emailVerified: false,
                        emailVerifiedAt: null,
                        accountStatus: 'PENDING',
                        role: newUser.role,
                        plan: newUser.plan || 'free',
                        preferences: {},
                        createdAt: newUser.created_at,
                        lastLogin: null
                    },
                    tokens: null, // No tokens until email is verified
                    message: 'Account created successfully! Please check your email to verify your account before accessing translation features.'
                };
            } catch (error) {
                console.error('Registration error:', error.message);
                throw new Error(error.message || 'Failed to create account');
            }
        },

        // Updated login mutation to check email verification
        login: async (_, { input }, { req }) => {
            try {
                const { email, password } = input;

                if (!email || !password) {
                    throw new Error('Email and password are required');
                }

                const cleanEmail = email.toLowerCase().trim();

                // Find user by email
                const userResult = await query(
                    'SELECT * FROM users WHERE email = $1',
                    [cleanEmail]
                );

                if (userResult.rows.length === 0) {
                    throw new Error('Invalid email or password');
                }

                const user = userResult.rows[0];

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    throw new Error('Invalid email or password');
                }

                // Check if email is verified
                if (!user.email_verified) {
                    // Resend verification email
                    const ipAddress = req.ip || req.connection.remoteAddress;
                    const userAgent = req.get('User-Agent');
                    
                    try {
                        await emailService.sendVerificationEmail(user, ipAddress, userAgent);
                    } catch (emailError) {
                        console.error('Failed to resend verification email:', emailError.message);
                    }
                    
                    throw new Error('Please verify your email address before logging in. We\'ve sent a new verification email.');
                }

                // Check account status
                if (user.account_status !== 'active') {
                    throw new Error('Account is not active. Please contact support.');
                }

                // Generate JWT tokens
                const accessToken = jwt.sign(
                    { 
                        userId: user.id, 
                        email: user.email, 
                        role: user.role,
                        emailVerified: user.email_verified 
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
                );

                const refreshToken = jwt.sign(
                    { 
                        userId: user.id,
                        type: 'refresh'
                    },
                    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
                );

                // Update last login
                await query(
                    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );

                console.log(`🔑 User logged in: ${cleanEmail}`);

                return {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        emailVerified: user.email_verified,
                        emailVerifiedAt: user.email_verified_at,
                        accountStatus: user.account_status.toUpperCase(),
                        role: user.role,
                        plan: user.plan,
                        preferences: user.preferences || {},
                        createdAt: user.created_at,
                        lastLogin: new Date()
                    },
                    tokens: {
                        accessToken,
                        refreshToken
                    },
                    message: 'Login successful'
                };
            } catch (error) {
                console.error('Login error:', error.message);
                throw new Error(error.message || 'Login failed');
            }
        }
    }
};

module.exports = emailVerificationResolvers;
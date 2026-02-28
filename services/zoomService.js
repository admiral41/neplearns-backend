const axios = require('axios');
const crypto = require('crypto');

class ZoomService {
    constructor() {
        this.accountId = process.env.ZOOM_ACCOUNT_ID;
        this.clientId = process.env.ZOOM_CLIENT_ID;
        this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
        this.baseUrl = process.env.ZOOM_API_BASE_URL || 'https://api.zoom.us/v2';
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Validate credentials on initialization
        this.validateCredentials();
    }

    validateCredentials() {
        if (!this.accountId || !this.clientId || !this.clientSecret) {
            console.error('❌ Zoom credentials missing. Check your .env file:');
            console.error(`   ZOOM_ACCOUNT_ID: ${this.accountId ? '✓ Set' : '✗ Missing'}`);
            console.error(`   ZOOM_CLIENT_ID: ${this.clientId ? '✓ Set' : '✗ Missing'}`);
            console.error(`   ZOOM_CLIENT_SECRET: ${this.clientSecret ? '✓ Set (first 10 chars): ' + this.clientSecret.substring(0, 10) + '...' : '✗ Missing'}`);
            throw new Error('Zoom API credentials are missing. Please check your .env file');
        }
    }

    // Generate access token using Server-to-Server OAuth
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            console.log('🔑 Requesting Zoom access token...');
            
            const authString = `${this.clientId}:${this.clientSecret}`;
            const base64Auth = Buffer.from(authString).toString('base64');

            const response = await axios.post('https://zoom.us/oauth/token', 
                new URLSearchParams({
                    grant_type: 'account_credentials',
                    account_id: this.accountId
                }).toString(),
                {
                    headers: {
                        'Authorization': `Basic ${base64Auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 3599; // Default to 1 hour
            this.tokenExpiry = Date.now() + (expiresIn * 1000) - 30000; // Subtract 30 seconds buffer
            
            console.log('✅ Zoom access token obtained');
            return this.accessToken;
            
        } catch (error) {
            console.error('❌ Error getting Zoom access token:');
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
                
                if (error.response.status === 401) {
                    console.error('   ❗ Invalid Zoom credentials. Please verify:');
                    console.error('       1. Account ID is correct');
                    console.error('       2. Client ID and Secret are correct');
                    console.error('       3. Server-to-Server app is enabled in Zoom Marketplace');
                    console.error('       4. Account has sufficient permissions');
                }
            } else {
                console.error('   Message:', error.message);
            }
            
            throw new Error('Failed to authenticate with Zoom API. Please check your credentials.');
        }
    }

    // Test Zoom API connection
    async testConnection() {
        try {
            console.log('🔍 Testing Zoom API connection...');
            
            // First get token
            const token = await this.getAccessToken();
            console.log('✅ Access token obtained successfully');
            
            // Test by getting user info
            const userInfo = await this.getUserInfo();
            console.log('✅ Zoom user info retrieved');
            console.log('   User ID:', userInfo.id);
            console.log('   Email:', userInfo.email);
            console.log('   Account Type:', userInfo.type);
            
            return {
                success: true,
                message: 'Zoom API connection successful',
                user: userInfo
            };
            
        } catch (error) {
            console.error('❌ Zoom API test failed:', error.message);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    // Create a meeting
    async createMeeting(meetingData) {
        try {
            const token = await this.getAccessToken();
            
            console.log('📅 Creating Zoom meeting with data:', {
                topic: meetingData.topic,
                start_time: meetingData.start_time,
                duration: meetingData.duration
            });

            // Remove any empty strings or null values that might cause issues
            const cleanMeetingData = JSON.parse(JSON.stringify(meetingData));
            
            // Ensure settings don't contain empty strings for optional fields
            if (cleanMeetingData.settings) {
                // Remove alternative_hosts if empty
                if (cleanMeetingData.settings.alternative_hosts === '') {
                    delete cleanMeetingData.settings.alternative_hosts;
                }
                // Remove global_dial_in_countries if not needed
                if (cleanMeetingData.settings.global_dial_in_countries && 
                    cleanMeetingData.settings.global_dial_in_countries.length === 0) {
                    delete cleanMeetingData.settings.global_dial_in_countries;
                }
            }

            const response = await axios.post(`${this.baseUrl}/users/me/meetings`, cleanMeetingData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log('✅ Zoom meeting created:', {
                id: response.data.id,
                join_url: response.data.join_url,
                password: response.data.password
            });

            return response.data;
            
        } catch (error) {
            console.error('❌ Error creating Zoom meeting:');
            
            if (error.response) {
                console.error('   Status:', error.response.status);
                console.error('   Data:', JSON.stringify(error.response.data, null, 2));
                
                // Provide specific troubleshooting for common errors
                if (error.response.data.code === 300) {
                    console.error('\n💡 Fix for Error 300 (Country code not available):');
                    console.error('   Your Zoom account cannot use telephone dial-in for specified countries.');
                    console.error('   Solution: Removed global_dial_in_countries from meeting settings.');
                }
            } else {
                console.error('   Message:', error.message);
            }
            
            throw new Error('Failed to create Zoom meeting: ' + (error.response?.data?.message || error.message));
        }
    }

    // Update a meeting
    async updateMeeting(meetingId, meetingData) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.patch(`${this.baseUrl}/meetings/${meetingId}`, meetingData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error updating Zoom meeting:', error.response?.data || error.message);
            throw new Error('Failed to update Zoom meeting');
        }
    }

    // Delete a meeting
    async deleteMeeting(meetingId) {
        try {
            const token = await this.getAccessToken();

            await axios.delete(`${this.baseUrl}/meetings/${meetingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Error deleting Zoom meeting:', error.response?.data || error.message);
            throw new Error('Failed to delete Zoom meeting');
        }
    }

    // Get user information
    async getUserInfo() {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(`${this.baseUrl}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error getting Zoom user info:', error.response?.data || error.message);
            throw new Error('Failed to get Zoom user information');
        }
    }

    // Get meeting details
    async getMeeting(meetingId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(`${this.baseUrl}/meetings/${meetingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error getting Zoom meeting:', error.response?.data || error.message);
            throw new Error('Failed to get Zoom meeting details');
        }
    }

    // Generate meeting options for our platform
    generateMeetingOptions(liveClassData) {
        // Generate a random 6-digit password
        const password = crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Get user's timezone or default to UTC
        const userTimezone = liveClassData.timezone || 'UTC';
        
        // Create meeting options
        const meetingOptions = {
            topic: liveClassData.title,
            agenda: liveClassData.description || 'Live Class Session',
            type: 2, // Scheduled meeting
            start_time: liveClassData.scheduledDateTime.toISOString().replace(/\.\d{3}Z$/, 'Z'), // Remove milliseconds
            duration: liveClassData.duration || 60,
            timezone: userTimezone,
            password: password,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: liveClassData.meta?.waitingRoom !== false,
                auto_recording: liveClassData.meta?.autoRecording || 'local',
                // Removed alternative_hosts and global_dial_in_countries
                contact_name: 'Live Class Platform',
                contact_email: process.env.ADMIN_EMAIL || process.env.SENDER_EMAIL || 'admin@example.com',
                // Add these settings for better compatibility
                meeting_authentication: false, // Don't require authentication to join
                registrants_confirmation_email: false, // Don't send confirmation emails
                show_share_button: true,
                allow_multiple_devices: true,
                registrants_email_notification: false,
                // Ensure we don't include telephone dial-in
                audio: 'both', // 'both' allows both computer audio and telephone
                // Add these to explicitly disable telephone dial-in
                // meeting_invitees: [], // Optional: if you want to invite specific users
                // tracking_fields: [] // Optional: custom tracking fields
            }
        };

        // Add recurrence if specified
        if (liveClassData.recurrence) {
            meetingOptions.recurrence = liveClassData.recurrence;
        }

        console.log('📝 Generated Zoom meeting options:', {
            topic: meetingOptions.topic,
            start_time: meetingOptions.start_time,
            duration: meetingOptions.duration,
            timezone: meetingOptions.timezone
        });

        return meetingOptions;
    }

    async createSimpleMeeting(title, description, startTime, duration = 30) {
        const meetingData = {
            topic: title,
            agenda: description || 'Test Meeting',
            type: 2,
            start_time: startTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
            duration: duration,
            timezone: 'UTC',
            password: crypto.randomBytes(3).toString('hex').toUpperCase(),
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: false,
                waiting_room: true,
                auto_recording: 'none', 
                contact_name: 'Test User',
                contact_email: process.env.ADMIN_EMAIL || 'test@example.com',
                meeting_authentication: false,
                registrants_confirmation_email: false
            }
        };

        return this.createMeeting(meetingData);
    }
    generateSDKJWT(meetingNumber, role) {
        // role: 0 = attendee, 1 = host
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 60 * 60 * 2; // 2 hours expiry

        const payload = {
            appKey: this.clientId,
            sdkKey: this.clientId, // SDK Key is same as Client ID
            mn: meetingNumber.toString(),
            role: role,
            iat: iat,
            exp: exp,
            tokenExp: exp
        };

        // Create header
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        // Encode header and payload
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

        // Create signature
        const signature = crypto
            .createHmac('sha256', this.clientSecret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Return JWT
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    base64UrlEncode(str) {
        return Buffer.from(str)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Get SDK credentials for joining meeting
    async getSDKCredentials(meetingNumber, userName, userEmail, role = 0) {
        try {
            console.log('🔑 Generating SDK JWT for meeting:', meetingNumber);

            const signature = this.generateSDKJWT(meetingNumber, role);

            return {
                sdkKey: this.clientId,
                signature: signature,
                meetingNumber: meetingNumber.toString(),
                userName: userName,
                userEmail: userEmail,
                role: role,
                leaveUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
            };

        } catch (error) {
            console.error('❌ Error generating SDK credentials:', error);
            throw new Error('Failed to generate SDK credentials');
        }
    }
}

module.exports = new ZoomService();
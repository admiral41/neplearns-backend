require('dotenv').config({ path: '.env' });

console.log('Testing Zoom API connection...');
console.log('======================');

// Check if environment variables are loaded
console.log('Environment Variables Check:');
console.log('ZOOM_ACCOUNT_ID:', process.env.ZOOM_ACCOUNT_ID ? '✓ Set' : '✗ Missing');
console.log('ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '✓ Set (first 10 chars)' : '✗ Missing');
console.log('ZOOM_API_BASE_URL:', process.env.ZOOM_API_BASE_URL || 'Using default');

const axios = require('axios');
const crypto = require('crypto');

async function testZoomConnection() {
    try {
        // Test authentication
        console.log('\nTesting Zoom OAuth Authentication...');
        
        const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
        
        console.log('Client ID:', process.env.ZOOM_CLIENT_ID);
        console.log('Account ID:', process.env.ZOOM_ACCOUNT_ID);
        
        const response = await axios.post('https://zoom.us/oauth/token', null, {
            params: {
                grant_type: 'account_credentials',
                account_id: process.env.ZOOM_ACCOUNT_ID
            },
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Zoom Authentication Successful!');
        console.log('Access Token:', response.data.access_token.substring(0, 30) + '...');
        console.log('Expires in:', response.data.expires_in, 'seconds');
        
        // Test creating a meeting
        console.log('\nTesting Meeting Creation...');
        
        const testMeetingData = {
            topic: 'Test Meeting - Integration Test',
            type: 2,
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            duration: 30,
            timezone: 'UTC',
            password: crypto.randomBytes(3).toString('hex'),
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: true,
                auto_recording: 'none'
            }
        };
        
        const meetingResponse = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings', 
            testMeetingData,
            {
                headers: {
                    'Authorization': `Bearer ${response.data.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Meeting Created Successfully!');
        console.log('Meeting ID:', meetingResponse.data.id);
        console.log('Join URL:', meetingResponse.data.join_url);
        console.log('Start URL:', meetingResponse.data.start_url);
        
        // Clean up - delete the test meeting
        console.log('\nCleaning up test meeting...');
        await axios.delete(
            `https://api.zoom.us/v2/meetings/${meetingResponse.data.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${response.data.access_token}`
                }
            }
        );
        
        console.log('✅ Test meeting deleted');
        
    } catch (error) {
        console.error('\n❌ Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Error Message:', error.message);
        
        if (error.response?.data) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Check for specific errors
        if (error.response?.status === 400 && error.response?.data?.error === 'invalid_client') {
            console.error('\n🔴 ISSUE: Invalid Zoom credentials');
            console.error('Possible reasons:');
            console.error('1. Client ID or Client Secret is incorrect');
            console.error('2. Account ID is incorrect');
            console.error('3. Zoom app is not properly configured');
            console.error('4. Credentials have expired or been revoked');
            
            console.error('\n💡 Solution:');
            console.error('1. Go to https://marketplace.zoom.us/develop/apps');
            console.error('2. Check your Server-to-Server OAuth app');
            console.error('3. Regenerate client secret if needed');
            console.error('4. Verify Account ID is correct');
        }
    }
}

testZoomConnection();
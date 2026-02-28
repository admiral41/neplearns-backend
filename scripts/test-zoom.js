require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const zoomService = require('../services/zoomService');

async function testZoomAPI() {
    console.log('🔍 Testing Zoom API Connection...');
    console.log('================================');
    
    // Check environment variables
    console.log('\n1. Checking Environment Variables:');
    console.log('   ZOOM_ACCOUNT_ID:', process.env.ZOOM_ACCOUNT_ID ? '✓ Loaded' : '✗ Missing');
    console.log('   ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '✓ Loaded' : '✗ Missing');
    console.log('   ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '✓ Loaded' : '✗ Missing');
    console.log('   ZOOM_API_BASE_URL:', process.env.ZOOM_API_BASE_URL || 'Using default');
    console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'Not set');
    
    if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
        console.error('\n❌ Missing Zoom credentials. Please check your .env file');
        return;
    }
    
    try {
        console.log('\n2. Testing Zoom Authentication...');
        
        // Test token generation
        const token = await zoomService.getAccessToken();
        console.log('✅ Access token obtained successfully');
        
        // Test getting user info
        console.log('\n3. Testing API Endpoints...');
        const userInfo = await zoomService.getUserInfo();
        console.log('✅ User info retrieved successfully');
        console.log('   User ID:', userInfo.id);
        console.log('   Email:', userInfo.email);
        console.log('   Account Type:', userInfo.type);
        
        // Test creating a simple meeting
        console.log('\n4. Testing Simple Meeting Creation...');
        const testMeeting = await zoomService.createSimpleMeeting(
            'Test Live Class - Simple',
            'This is a test meeting without dial-in settings',
            new Date(Date.now() + 3600000), // 1 hour from now
            30
        );
        
        console.log('✅ Simple meeting created successfully');
        console.log('   Meeting ID:', testMeeting.id);
        console.log('   Join URL:', testMeeting.join_url);
        console.log('   Password:', testMeeting.password);
        
        // Test the generateMeetingOptions function
        console.log('\n5. Testing generateMeetingOptions function...');
        const meetingOptions = zoomService.generateMeetingOptions({
            title: 'Test Generated Options',
            description: 'Testing the meeting options generator',
            scheduledDateTime: new Date(Date.now() + 7200000), // 2 hours from now
            duration: 60,
            timezone: 'Asia/Katmandu',
            meta: {
                waitingRoom: true,
                autoRecording: 'local'
            }
        });
        
        console.log('✅ Meeting options generated successfully');
        console.log('   Topic:', meetingOptions.topic);
        console.log('   Start Time:', meetingOptions.start_time);
        console.log('   Duration:', meetingOptions.duration);
        console.log('   Timezone:', meetingOptions.timezone);
        
        // Test creating a meeting with generated options
        console.log('\n6. Testing Meeting Creation with Generated Options...');
        const generatedMeeting = await zoomService.createMeeting(meetingOptions);
        console.log('✅ Generated meeting created successfully');
        console.log('   Meeting ID:', generatedMeeting.id);
        console.log('   Join URL:', generatedMeeting.join_url);
        console.log('   Start URL:', generatedMeeting.start_url);
        
        // Get meeting details
        console.log('\n7. Testing Get Meeting Details...');
        const meetingDetails = await zoomService.getMeeting(generatedMeeting.id);
        console.log('✅ Meeting details retrieved successfully');
        console.log('   Topic:', meetingDetails.topic);
        console.log('   Status:', meetingDetails.status);
        console.log('   Created at:', meetingDetails.created_at);
        
        // Clean up - delete test meetings
        console.log('\n8. Cleaning up test meetings...');
        await zoomService.deleteMeeting(testMeeting.id);
        console.log('   ✓ Simple test meeting deleted');
        await zoomService.deleteMeeting(generatedMeeting.id);
        console.log('   ✓ Generated meeting deleted');
        
        console.log('\n🎉 All Zoom API tests passed successfully!');
        console.log('\n💡 Your Zoom integration is ready to use.');
        console.log('   You can now create live classes from your application.');
        
    } catch (error) {
        console.error('\n❌ Zoom API test failed:');
        console.error('   Error:', error.message);
        
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Status Text:', error.response.statusText);
            console.error('   Response:', JSON.stringify(error.response.data, null, 2));
            
            // Special handling for common Zoom errors
            if (error.response.data.code === 300) {
                console.error('\n🔧 Solution for Error 300:');
                console.error('   The Zoom account does not have telephone dial-in enabled.');
                console.error('   This has been fixed by removing global_dial_in_countries from settings.');
                console.error('   Try running the test again with the updated code.');
            }
        }
        
        console.log('\n💡 Additional Troubleshooting Tips:');
        console.log('   1. Check your Zoom account type - you need at least a Pro account');
        console.log('   2. Ensure your account has meeting creation permissions');
        console.log('   3. Try creating a meeting manually in the Zoom web portal first');
        console.log('   4. Check if there are any regional restrictions on your account');
        console.log('   5. Contact Zoom support if issues persist');
    }
}

// Run the test
testZoomAPI();
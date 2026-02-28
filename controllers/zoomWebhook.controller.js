const httpStatus = require('http-status');
const LiveClass = require('../models/liveClass.model');
const zoomAPI = require('../config/zoom.config');
const { sendErrorResponse, sendSuccessResponse } = require('../helpers/index').responseHandler;

// Webhook endpoint
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-zm-signature'];
    const timestamp = req.headers['x-zm-request-timestamp'];
    const payload = req.body;
    
    console.log('Zoom Webhook Received:', {
      event: payload.event,
      signature: signature?.substring(0, 50) + '...',
      timestamp
    });

    // Verify webhook signature
    if (!signature || !zoomAPI.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return sendErrorResponse({
        res,
        status: httpStatus.UNAUTHORIZED,
        msg: "Invalid webhook signature"
      });
    }

    // Handle different webhook events
    await handleWebhookEvent(payload);

    // Send immediate response to Zoom
    res.status(200).json({ 
      message: "Webhook received successfully" 
    });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle specific webhook events
async function handleWebhookEvent(payload) {
  const { event, payload: eventData } = payload;
  
  switch (event) {
    case 'meeting.started':
      await handleMeetingStarted(eventData);
      break;
    
    case 'meeting.ended':
      await handleMeetingEnded(eventData);
      break;
    
    case 'meeting.participant_joined':
      await handleParticipantJoined(eventData);
      break;
    
    case 'meeting.participant_left':
      await handleParticipantLeft(eventData);
      break;
    
    case 'recording.completed':
      await handleRecordingCompleted(eventData);
      break;
    
    case 'meeting.alert':
      await handleMeetingAlert(eventData);
      break;
    
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}

async function handleMeetingStarted(eventData) {
  try {
    const { id: meetingId } = eventData.object;
    
    const liveClass = await LiveClass.findOne({ 
      zoomMeetingId: meetingId.toString() 
    });
    
    if (liveClass) {
      liveClass.status = 'live';
      liveClass.actualStart = new Date();
      await liveClass.save();
      
      console.log(`Meeting ${meetingId} marked as live`);
    }
  } catch (error) {
    console.error('Error handling meeting.started:', error);
  }
}

async function handleMeetingEnded(eventData) {
  try {
    const { id: meetingId, end_time } = eventData.object;
    
    const liveClass = await LiveClass.findOne({ 
      zoomMeetingId: meetingId.toString() 
    });
    
    if (liveClass) {
      liveClass.status = 'ended';
      liveClass.actualEnd = new Date(end_time);
      
      // Try to get recording info
      if (liveClass.settings.autoRecording !== 'none') {
        try {
          const recordings = await zoomAPI.makeRequest(
            'GET', 
            `/meetings/${meetingId}/recordings`
          );
          
          if (recordings.recording_files) {
            liveClass.recordingFiles = recordings.recording_files.map(file => ({
              fileId: file.id,
              fileName: file.file_name,
              fileSize: file.file_size,
              playUrl: file.play_url,
              downloadUrl: file.download_url,
              recordingStart: file.recording_start,
              recordingEnd: file.recording_end
            }));
          }
        } catch (recordingError) {
          console.error('Failed to fetch recordings:', recordingError);
        }
      }
      
      await liveClass.save();
      console.log(`Meeting ${meetingId} marked as ended`);
    }
  } catch (error) {
    console.error('Error handling meeting.ended:', error);
  }
}

async function handleParticipantJoined(eventData) {
  try {
    const { id: meetingId, participant } = eventData.object;
    
    const liveClass = await LiveClass.findOne({ 
      zoomMeetingId: meetingId.toString() 
    });
    
    if (liveClass) {
      // Increment joined count
      await LiveClass.findByIdAndUpdate(liveClass._id, {
        $inc: { 'attendance.totalJoined': 1 }
      });
      
      console.log(`Participant joined: ${participant.user_name} (${participant.email})`);
    }
  } catch (error) {
    console.error('Error handling participant_joined:', error);
  }
}

async function handleParticipantLeft(eventData) {
  try {
    const { id: meetingId, participant } = eventData.object;
    console.log(`Participant left: ${participant.user_name} from meeting ${meetingId}`);
  } catch (error) {
    console.error('Error handling participant_left:', error);
  }
}

async function handleRecordingCompleted(eventData) {
  try {
    const { object } = eventData;
    const meetingId = object.id;
    
    const liveClass = await LiveClass.findOne({ 
      zoomMeetingId: meetingId.toString() 
    });
    
    if (liveClass && object.recording_files) {
      liveClass.recordingFiles = object.recording_files.map(file => ({
        fileId: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        playUrl: file.play_url,
        downloadUrl: file.download_url,
        recordingStart: file.recording_start,
        recordingEnd: file.recording_end
      }));
      
      await liveClass.save();
      console.log(`Recording saved for meeting ${meetingId}`);
    }
  } catch (error) {
    console.error('Error handling recording.completed:', error);
  }
}

async function handleMeetingAlert(eventData) {
  try {
    const { meeting_id, alert_type } = eventData.object;
    console.log(`Meeting alert: ${alert_type} for meeting ${meeting_id}`);
    
    // Handle specific alerts
    switch (alert_type) {
      case 'Meeting has been cancelled by host':
        await LiveClass.findOneAndUpdate(
          { zoomMeetingId: meeting_id.toString() },
          { status: 'cancelled' }
        );
        break;
      
      case 'Recording started':
      case 'Recording stopped':
        // You can log these events
        break;
    }
  } catch (error) {
    console.error('Error handling meeting.alert:', error);
  }
}

// Webhook verification endpoint (for Zoom setup)
exports.verifyWebhook = (req, res) => {
  const plainToken = req.query.plainToken;
  
  if (!plainToken) {
    return sendErrorResponse({
      res,
      status: httpStatus.BAD_REQUEST,
      msg: "plainToken is required"
    });
  }
  
  // Encrypt the plainToken with your webhook token
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', zoomAPI.webhookToken)
    .update(plainToken)
    .digest('hex');
  
  const encryptedToken = hash;
  
  res.status(200).json({
    plainToken,
    encryptedToken
  });
};
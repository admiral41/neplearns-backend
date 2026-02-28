const nodemailer = require('nodemailer');
const { format } = require('date-fns');

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendLiveClassReminder = async ({
  email,
  firstname,
  liveClassTitle,
  scheduledDateTime,
  joinUrl,
  meetingPassword,
  lecturerName,
  courseTitle
}) => {
  try {
    const formattedDate = format(new Date(scheduledDateTime), 'PPPPpppp');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@neplearns.com',
      to: email,
      subject: `🔔 Reminder: Live Class - ${liveClassTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                     text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .tips { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Live Class Reminder</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${firstname}</strong>,</p>
              
              <p>This is a reminder about your upcoming live class:</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0; color: #374151;">${liveClassTitle}</h2>
                <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
                <p><strong>📚 Course:</strong> ${courseTitle || 'Course'}</p>
                <p><strong>👨‍🏫 Host:</strong> ${lecturerName}</p>
                ${meetingPassword ? `<p><strong>🔑 Meeting Password:</strong> <code>${meetingPassword}</code></p>` : ''}
              </div>
              
              <div style="text-align: center;">
                <a href="${joinUrl}" class="button" target="_blank">
                  🚀 Join Live Class
                </a>
              </div>
              
              <div class="tips">
                <h3 style="margin-top: 0;">💡 Tips for a great experience:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Join 5-10 minutes early to test your audio/video</li>
                  <li>Use headphones for better audio quality</li>
                  <li>Find a quiet space with good internet connection</li>
                  <li>Have questions ready for the Q&A session</li>
                  <li>Close unnecessary applications for better performance</li>
                </ul>
              </div>
              
              <p>If you can't attend, the recording will be available after the class.</p>
              
              <p>We look forward to seeing you in class!</p>
              
              <p>Best regards,<br>The NepLearns Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated reminder. Please do not reply to this email.</p>
              <p>If you have any questions, contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

exports.sendLiveClassCancellation = async ({
  email,
  firstname,
  liveClassTitle,
  scheduledDateTime,
  reason,
  courseTitle
}) => {
  try {
    const formattedDate = format(new Date(scheduledDateTime), 'PPPPpppp');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@neplearns.com',
      to: email,
      subject: `❌ Cancelled: Live Class - ${liveClassTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Live Class Cancelled</h1>
            </div>
            
            <div class="content">
              <p>Hello <strong>${firstname}</strong>,</p>
              
              <p>We regret to inform you that the following live class has been cancelled:</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0; color: #374151;">${liveClassTitle}</h2>
                <p><strong>📅 Original Date & Time:</strong> ${formattedDate}</p>
                <p><strong>📚 Course:</strong> ${courseTitle || 'Course'}</p>
                ${reason ? `<p><strong>📝 Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p>We apologize for any inconvenience this may cause. Please check the course page for any rescheduled dates or alternative sessions.</p>
              
              <p>If you have any questions, please contact your instructor or our support team.</p>
              
              <p>Best regards,<br>The NepLearns Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
};
const nodemailer = require('nodemailer');

const smtpTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_EMAIL_PASSWORD
  }
});

// ======================= VERIFICATION EMAIL =======================
exports.sendVerificationMail = async (data) => {
  const { email, firstname, lastname, link } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Verify Your Email - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  Welcome to NepLearn. To complete your registration and activate your account, please verify your email address.
                </p>

                ${data.isLecturerApplicant ? `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>Instructor Application Note:</strong> Your application for instructor position will be reviewed by our admin team after email verification.
                  </p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${link}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Verify Email Address</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 10px; font-size: 15px;">
                  <strong>Important:</strong> This link will expire in 24 hours.
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                  If you didn't create an account with NepLearn, you can safely ignore this email.
                </p>

                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Need help? <a href="mailto:support@neplearn.com" style="color: #333; text-decoration: underline;">Contact our support team</a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  <a href="${process.env.FRONTEND_URI}/unsubscribe" style="color: #999; text-decoration: underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Verification email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// ======================= PASSWORD RESET EMAIL =======================
exports.sendPasswordResetMail = async (data) => {
  const { email, firstname, lastname, link } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Reset Your Password - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  We received a request to reset your password for your NepLearn account.
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                  Click the button below to create a new password:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${link}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Reset Password</a>
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                    <strong>Security Notice:</strong> This link will expire in 1 hour.
                  </p>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account's security.
                  </p>
                </div>

                <p style="color: #555; line-height: 1.6; margin: 25px 0 0 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Password reset email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// ======================= INSTRUCTOR APPLICATION REVIEW EMAIL =======================
exports.sendInstructorApplicationReviewMail = async (data) => {
  const { email, firstname, lastname } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Your Instructor Application is Under Review - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Under Review - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  Thank you for verifying your email address and applying to become an instructor at NepLearn.
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Application Status: Under Review</h3>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    Your instructor application has been submitted successfully and is now being reviewed by our admin team.
                  </p>
                </div>

                <h4 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What happens next?</h4>
                <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Our team will review your application and documents</li>
                  <li>You will receive an email with the decision within 3-5 business days</li>
                  <li>If approved, you'll gain access to instructor features</li>
                  <li>You can continue using NepLearn as a learner while waiting</li>
                </ol>

                <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                  <strong>Current Access:</strong> You can login to your account and access learner features.
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  Thank you for your patience!
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Instructor review email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending instructor review email:', error);
    throw error;
  }
};

// ======================= INSTRUCTOR REQUEST NOTIFICATION TO ADMIN =======================
exports.sendInstructorRequestNotification = async (data) => {
  const { adminEmail, adminName, applicantName, applicantEmail, applicationId, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: adminEmail,
    subject: `New Instructor Application: ${applicantName} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Instructor Application - NepLearn Admin</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn Admin</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${adminName}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">New Instructor Application Requires Review</h3>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    A new instructor application has been submitted and requires your attention.
                  </p>
                </div>

                <h4 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Applicant Details:</h4>
                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px; width: 40%;">Name:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${applicantName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Email:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${applicantEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Application ID:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${applicationId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Submitted:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Status:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">Pending Review</td>
                  </tr>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Review Application in Admin Panel</a>
                </div>

                <p style="color: #888; font-size: 12px; margin: 25px 0 0 0;">
                  This is an automated notification from NepLearn Admin System.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn Admin Portal
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Instructor request notification sent to admin ${adminEmail}`);
    return result;
  } catch (error) {
    console.error('Error sending instructor request notification:', error);
    throw error;
  }
};

// ======================= INSTRUCTOR APPROVAL EMAIL =======================
exports.sendInstructorApprovalMail = async (data) => {
  const { email, firstname, lastname, loginLink, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Congratulations! Your Instructor Application Has Been Approved - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Approved - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Dear <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d; text-align: center;">
                  <h2 style="margin-top: 0; color: #333; font-size: 18px;">Congratulations!</h2>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 15px; line-height: 1.6;">
                    We are pleased to inform you that your instructor application has been approved.
                  </p>
                  <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">
                    Welcome to the NepLearn Teaching Team!
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600; margin: 5px;">Login to Your Account</a>
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600; margin: 5px;">Go to Instructor Dashboard</a>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What You Can Do Now:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Create and manage courses</li>
                  <li>Upload educational content (videos, PDFs, quizzes)</li>
                  <li>Interact with students</li>
                  <li>Track your course performance</li>
                  <li>Earn through our instructor program</li>
                </ul>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Getting Started:</h3>
                <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Complete your instructor profile</li>
                  <li>Review our teaching guidelines</li>
                  <li>Create your first course</li>
                  <li>Explore available resources</li>
                </ol>

                <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                  <strong>Need help?</strong> Check our <a href="${process.env.FRONTEND_URI}/instructor-guide" style="color: #333; text-decoration: underline;">Instructor Guide</a> or contact our support team.
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  We're excited to see what you'll teach!
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Instructor approval email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending instructor approval email:', error);
    throw error;
  }
};

// ======================= INSTRUCTOR REJECTION EMAIL =======================
exports.sendInstructorRejectionMail = async (data) => {
  const { email, firstname, lastname, reason } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Update on Your Instructor Application - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Dear <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Application Status: Not Approved</h3>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                    Thank you for your interest in becoming an instructor at NepLearn and for taking the time to apply.
                  </p>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    After careful review of your application, we regret to inform you that we are unable to approve your application at this time.
                  </p>
                  ${reason ? `
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 3px; margin-top: 15px; border: 1px solid #e0e0e0;">
                    <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>Reason:</strong> ${reason}
                    </p>
                  </div>
                  ` : ''}
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Suggestions for Future Applications:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Gain more teaching experience</li>
                  <li>Complete relevant certifications</li>
                  <li>Build a portfolio of your work</li>
                  <li>Consider reapplying after 6 months</li>
                </ul>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">You Can Still:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Continue using NepLearn as a learner</li>
                  <li>Enroll in courses to enhance your skills</li>
                  <li>Stay updated with our platform improvements</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URI}/courses" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Browse Available Courses</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  We appreciate your interest in NepLearn and wish you the best in your future endeavors.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Sincerely,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Instructor rejection email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending instructor rejection email:', error);
    throw error;
  }
};

// ======================= INSTRUCTOR STATUS UPDATE EMAIL =======================
exports.sendInstructorStatusMail = async (data) => {
  const { email, firstname, lastname, status, message } = data;

  const subject = status === 'activated'
    ? 'Your Instructor Account Has Been Activated - NepLearn'
    : 'Your Instructor Account Has Been Deactivated - NepLearn';

  const messageType = {
    activated: {
      title: 'Account Activated',
      heading: 'Your instructor account has been activated.',
      action: 'You can now access all instructor features and create courses.'
    },
    deactivated: {
      title: 'Account Deactivated',
      heading: 'Your instructor account has been deactivated.',
      action: 'You will not be able to access instructor features until your account is reactivated.'
    }
  };

  const messageConfig = messageType[status] || messageType.deactivated;

  const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <tbody>
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
              <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                Dear <strong>${firstname} ${lastname}</strong>,
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px;">${messageConfig.title}</h3>
                <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                  <strong>${messageConfig.heading}</strong>
                </p>
                <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                  ${message || messageConfig.action}
                </p>
              </div>

              ${status === 'activated' ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URI}/instructor-dashboard" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Go to Instructor Dashboard</a>
              </div>
              ` : ''}

              <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                If you believe this is an error or have any questions, please contact our support team.
              </p>
              <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                Best regards,<br>The NepLearn Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} NepLearn. All rights reserved.
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                This email was sent to ${email}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>`;

  const messageObj = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: subject,
    html: htmlMessage
  };

  try {
    const result = await smtpTransport.sendMail(messageObj);
    console.log(`Instructor status email (${status}) sent to ${email}`);
    return result;
  } catch (error) {
    console.error(`Error sending instructor status email (${status}):`, error);
    throw error;
  }
};

// ======================= INSTRUCTOR DELETION EMAIL =======================
exports.sendInstructorDeletionMail = async (data) => {
  const { email, firstname, lastname, message } = data;

  const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Instructor Account Removal - NepLearn</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <tbody>
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
              <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                Dear <strong>${firstname} ${lastname}</strong>,
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px;">Account Status Update</h3>
                <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                  ${message || 'Your instructor account has been removed from our system.'}
                </p>
                <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                  Your instructor privileges have been revoked and you will no longer have access to instructor features.
                </p>
              </div>

              <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">You can still:</h3>
              <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                <li>Continue using NepLearn as a learner</li>
                <li>Access all your enrolled courses</li>
                <li>Participate in discussions</li>
                <li>Complete your learning journey</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URI}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Continue Learning on NepLearn</a>
              </div>

              <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                If you have any questions about this decision, please contact our support team.
              </p>
              <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                Sincerely,<br>The NepLearn Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} NepLearn. All rights reserved.
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                This email was sent to ${email}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>`;

  const messageObj = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Instructor Account Removal - NepLearn',
    html: htmlMessage
  };

  try {
    const result = await smtpTransport.sendMail(messageObj);
    console.log(`Instructor deletion email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending instructor deletion email:', error);
    throw error;
  }
};

/**
 * Send enquiry notification emails
 * Sends to both admin and user
 */
exports.sendEnquiryMail = async (data) => {
  const { getAdminEnquiryTemplate, getUserEnquiryConfirmationTemplate } = require('./emailTemplates/enquiry.template');

  // Email to admin
  const adminMessage = {
    from: process.env.SENDER_EMAIL,
    to: process.env.ADMIN_EMAIL || 'wildgaming490@gmail.com', // Use env variable or fallback
    subject: `New Enquiry from ${data.name}`,
    html: getAdminEnquiryTemplate({
      name: data.name,
      email: data.email,
      phone: data.phone,
      level: data.level,
      message: data.message,
      submittedAt: data.submittedAt || new Date()
    })
  };

  // Email to user (confirmation)
  const userMessage = {
    from: process.env.SENDER_EMAIL,
    to: data.email,
    subject: 'Thank You for Your Enquiry - NepLearn',
    html: getUserEnquiryConfirmationTemplate({
      name: data.name,
      email: data.email,
      phone: data.phone,
      level: data.level
    })
  };

  try {
    // Send both emails
    const adminResult = await smtpTransport.sendMail(adminMessage);
    const userResult = await smtpTransport.sendMail(userMessage);

    return {
      success: true,
      adminResult,
      userResult
    };
  } catch (error) {
    console.error('Error sending enquiry emails:', error);
    throw error;
  }
};

/**
 * Send newsletter welcome email
 * Sends to user after they subscribe to the newsletter
 */
exports.sendNewsletterWelcomeMail = async (data) => {
  const { getNewsletterWelcomeTemplate } = require('./emailTemplates/newsletter.template');

  const message = {
    from: process.env.SENDER_EMAIL,
    to: data.email,
    subject: 'Welcome to NepLearn Newsletter',
    html: getNewsletterWelcomeTemplate({
      name: data.name || 'Subscriber',
      email: data.email
    })
  };

  try {
    const result = await smtpTransport.sendMail(message);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Error sending newsletter welcome email:', error);
    throw error;
  }
};

// ======================= COURSE REQUEST NOTIFICATION TO ADMIN =======================
exports.sendCourseRequestNotification = async (data) => {
  const { adminEmail, adminName, courseTitle, creatorName, creatorEmail, courseId, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: adminEmail,
    subject: `New Course Approval Request: ${courseTitle} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Course Request - NepLearn Admin</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn Admin</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${adminName}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">New Course Approval Request</h3>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    A new course has been submitted and requires your review.
                  </p>
                </div>

                <h4 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Course Details:</h4>
                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px; width: 30%;">Course Title:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${courseTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Created By:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${creatorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Creator Email:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${creatorEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Course ID:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${courseId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Submitted:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Status:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">Pending Approval</td>
                  </tr>
                </table>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Review Course in Admin Panel</a>
                </div>

                <p style="color: #888; font-size: 12px; margin: 25px 0 0 0;">
                  This is an automated notification from NepLearn Admin System.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn Admin Portal
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Course request notification sent to admin ${adminEmail}`);
    return result;
  } catch (error) {
    console.error('Error sending course request notification:', error);
    throw error;
  }
};

// ======================= COURSE APPROVAL EMAIL =======================
exports.sendCourseApprovalMail = async (data) => {
  const { email, firstname, lastname, courseTitle, courseLink, publishDirectly } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Your Course "${courseTitle}" Has Been Approved - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Approved - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Dear <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d; text-align: center;">
                  <h2 style="margin-top: 0; color: #333; font-size: 18px;">Course Approved</h2>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 15px; line-height: 1.6;">
                    Your course <strong>"${courseTitle}"</strong> has been approved by our admin team.
                  </p>
                  ${publishDirectly ?
        '<p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;"><strong>Great news! Your course has been published and is now live for students to enroll.</strong></p>' :
        '<p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">You can now publish your course when you\'re ready.</p>'
      }
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${courseLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600; margin: 5px;">View Your Course</a>
                  ${!publishDirectly ?
        '<a href="${process.env.FRONTEND_URI}/instructor/courses/manage" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600; margin: 5px;">Manage Courses</a>' :
        ''
      }
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Next Steps:</h3>
                ${publishDirectly ?
        '<ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;"><li>Start promoting your course</li><li>Monitor student enrollments</li><li>Engage with your students</li></ul>' :
        '<ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;"><li>Review your course content</li><li>Publish your course when ready</li><li>Start promoting to students</li></ul>'
      }

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  Happy teaching!
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Course approval email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending course approval email:', error);
    throw error;
  }
};

// ======================= COURSE REJECTION EMAIL =======================
exports.sendCourseRejectionMail = async (data) => {
  const { email, firstname, lastname, courseTitle, reason } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Update on Your Course "${courseTitle}" - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Status Update - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Dear <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Course Status: Requires Revision</h3>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                    Thank you for submitting your course <strong>"${courseTitle}"</strong> for review.
                  </p>
                  <p style="color: #555; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                    After careful evaluation, we need you to make some revisions before we can approve your course.
                  </p>
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 3px; border: 1px solid #e0e0e0;">
                    <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>Feedback:</strong> ${reason}
                    </p>
                  </div>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Suggestions for Improvement:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Review the feedback provided</li>
                  <li>Make the necessary changes to your course content</li>
                  <li>Ensure all requirements are met</li>
                  <li>Resubmit for review when ready</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URI}/instructor/courses/edit" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Edit Your Course</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  We appreciate your effort and look forward to your revised submission.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Sincerely,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Course rejection email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending course rejection email:', error);
    throw error;
  }
};

// ======================= ADMIN PASSWORD RESET EMAIL =======================
exports.sendAdminPasswordResetMail = async (data) => {
  const { email, firstname, lastname, tempPassword, loginLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: 'Your Password Has Been Reset - NepLearn',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset by Admin - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #fff3cd; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #ffc107;">
                  <h3 style="margin-top: 0; color: #856404; font-size: 16px;">Password Reset Notice</h3>
                  <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.6;">
                    Your password has been reset by an administrator. You have been logged out of all devices.
                  </p>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  Your new temporary password is:
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; text-align: center;">
                  <code style="font-size: 20px; font-weight: bold; color: #333; letter-spacing: 2px; background-color: #e9ecef; padding: 10px 20px; border-radius: 4px;">${tempPassword}</code>
                </div>

                <div style="background-color: #f8d7da; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #dc3545;">
                  <p style="color: #721c24; margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>Important:</strong> You will be required to change this password immediately after logging in. This temporary password cannot be used for regular access.
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Login to Change Password</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                  If you did not request this password reset or have any concerns, please contact our support team immediately.
                </p>

                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  © ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Admin password reset email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending admin password reset email:', error);
    throw error;
  };
};

// ======================= TUTORING ASSIGNMENT EMAIL =======================
exports.sendTutoringAssignmentMail = async (data) => {
  const { email, firstname, lastname, subjectName, instructorName, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Instructor Assigned for ${subjectName} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Instructor Assigned - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #28a745; text-align: center;">
                  <h2 style="margin-top: 0; color: #333; font-size: 18px;">Great News!</h2>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 15px; line-height: 1.6;">
                    Your tutoring request for <strong>${subjectName}</strong> has been approved!
                  </p>
                  <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">
                    You have been assigned to instructor: <strong>${instructorName}</strong>
                  </p>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What happens next?</h3>
                <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Your instructor will contact you to schedule your first session</li>
                  <li>You'll receive details about the tutoring schedule</li>
                  <li>Get ready to start learning!</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">View in Dashboard</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  We're excited for your learning journey!
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Tutoring assignment email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending tutoring assignment email:', error);
    throw error;
  }
};

// ======================= NEW STUDENT ASSIGNED EMAIL (for Instructor) =======================
exports.sendNewStudentAssignedMail = async (data) => {
  const { email, firstname, lastname, studentName, subjectName, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `New Student Assigned: ${subjectName} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Student Assigned - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #28a745; text-align: center;">
                  <h2 style="margin-top: 0; color: #333; font-size: 18px;">New Student Assigned!</h2>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 15px; line-height: 1.6;">
                    You have been assigned to tutor a new student.
                  </p>
                </div>

                <h4 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Details:</h4>
                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px; width: 30%;">Student:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>${studentName}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Subject:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${subjectName}</td>
                  </tr>
                </table>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Next Steps:</h3>
                <ol style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Review the student's profile</li>
                  <li>Schedule your first tutoring session</li>
                  <li>Prepare study materials for ${subjectName}</li>
                </ol>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">View in Dashboard</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  Please reach out to your student promptly to get started.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`New student assigned email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending new student assigned email:', error);
    // Don't throw - email failures shouldn't block the main operation
  }
};

// ======================= TUTORING REJECTION EMAIL =======================
exports.sendTutoringRejectionMail = async (data) => {
  const { email, firstname, lastname, subjectName, reason, dashboardLink } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Update on Your Tutoring Request - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tutoring Request Update - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  Thank you for your interest in our tutoring services for <strong>${subjectName}</strong>.
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Request Status: Unable to Process</h3>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                    Unfortunately, we are unable to fulfill your tutoring request at this time.
                  </p>
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 3px; margin-top: 15px; border: 1px solid #e0e0e0;">
                    <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>Reason:</strong> ${reason}
                    </p>
                  </div>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What you can do:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Browse other available tutoring subjects</li>
                  <li>Submit a new request with different preferences</li>
                  <li>Contact support if you have questions</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${dashboardLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Browse Tutoring Subjects</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  We appreciate your understanding and hope to assist you in the future.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Tutoring rejection email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending tutoring rejection email:', error);
    throw error;
  }
};

// ======================= SUBSCRIPTION ACTIVATED EMAIL =======================
exports.sendSubscriptionActivatedMail = async (data) => {
  const { email, firstname, subjectName, renewalDate } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Your ${subjectName} Subscription is Now Active - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Activated - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #28a745; text-align: center;">
                  <h2 style="margin-top: 0; color: #333; font-size: 18px;">Subscription Activated!</h2>
                  <p style="color: #555; margin: 0 0 10px 0; font-size: 15px; line-height: 1.6;">
                    Your tutoring subscription for <strong>${subjectName}</strong> is now active.
                  </p>
                  <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">
                    Your subscription will renew on <strong>${renewalDate}</strong>
                  </p>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What you can do now:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Continue your tutoring sessions</li>
                  <li>Access all your tutoring materials</li>
                  <li>Communicate with your instructor</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URI}/student-dashboard/tutoring" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Go to My Subscriptions</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  Thank you for learning with us!
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Subscription activated email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending subscription activated email:', error);
    // Don't throw - email failures shouldn't block the main operation
  }
};

// ======================= PAYMENT REJECTED EMAIL =======================
exports.sendPaymentRejectedMail = async (data) => {
  const { email, firstname, subjectName, reason } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Payment Not Approved for ${subjectName} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Not Approved - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #dc3545;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Payment Not Approved</h3>
                  <p style="color: #555; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                    Your payment for <strong>${subjectName}</strong> was not approved.
                  </p>
                  <div style="background-color: #ffffff; padding: 15px; border-radius: 3px; border: 1px solid #e0e0e0;">
                    <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                      <strong>Reason:</strong> ${reason}
                    </p>
                  </div>
                </div>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">What you can do:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Review the reason provided</li>
                  <li>Submit a new payment with correct details</li>
                  <li>Contact support if you need assistance</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URI}/student-dashboard/tutoring/my-subscriptions" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Submit New Payment</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  If you have any questions, please contact our support team.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Payment rejected email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending payment rejected email:', error);
    // Don't throw - email failures shouldn't block the main operation
  }
};

// ======================= SUBSCRIPTION CANCELLED EMAIL =======================
exports.sendSubscriptionCancelledMail = async (data) => {
  const { email, firstname, subjectName } = data;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `Your ${subjectName} Subscription Has Been Cancelled - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Cancelled - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">Subscription Cancelled</h3>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    Your tutoring subscription for <strong>${subjectName}</strong> has been cancelled.
                  </p>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                  You will no longer have access to tutoring services for this subject.
                </p>

                <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">You can still:</h3>
                <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li>Browse other tutoring subjects</li>
                  <li>Submit a new tutoring request</li>
                  <li>Continue using other NepLearn features</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URI}/student-dashboard/tutoring" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">Browse Tutoring Subjects</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  If you have any questions, please contact our support team.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Subscription cancelled email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending subscription cancelled email:', error);
    // Don't throw - email failures shouldn't block the main operation
  }
};

// ======================= TUTORING HOMEWORK ASSIGNMENT EMAIL =======================
/**
 * Send tutoring homework assignment notification email to student
 */
exports.sendTutoringHomeworkMail = async (data) => {
  const { email, firstname, lastname, instructorName, assignmentTitle, subjectName, dueDate, assignmentLink } = data;

  const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : null;

  const message = {
    from: process.env.SENDER_EMAIL || 'noreply@neplearn.com',
    to: email,
    subject: `New Assignment: ${assignmentTitle} - NepLearn`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Assignment - NepLearn</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
                <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">NepLearn</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 30px;">
                <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Hello <strong>${firstname} ${lastname}</strong>,
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 3px; margin: 20px 0; border-left: 3px solid #6c757d;">
                  <h3 style="margin-top: 0; color: #333; font-size: 16px;">New Assignment</h3>
                  <p style="color: #555; margin: 0; font-size: 14px; line-height: 1.6;">
                    Your tutor <strong>${instructorName}</strong> has assigned you a new task for <strong>${subjectName}</strong>.
                  </p>
                </div>

                <h4 style="color: #333; margin: 25px 0 15px 0; font-size: 16px;">Assignment Details:</h4>
                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px; width: 30%;">Title:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;"><strong>${assignmentTitle}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Subject:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${subjectName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Assigned By:</td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${instructorName}</td>
                  </tr>
                  ${dueDateFormatted ? `
                  <tr>
                    <td style="padding: 8px 0; color: #888; font-size: 14px;">Due Date:</td>
                    <td style="padding: 8px 0; color: #e74c3c; font-size: 14px; font-weight: 600;">${dueDateFormatted}</td>
                  </tr>
                  ` : ''}
                </table>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${assignmentLink}" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 600;">View Assignment</a>
                </div>

                <p style="color: #555; line-height: 1.6; margin-bottom: 5px; font-size: 15px;">
                  Please complete and submit your work before the due date.
                </p>
                <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                  Best regards,<br>The NepLearn Team
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} NepLearn. All rights reserved.
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                  This email was sent to ${email}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>`
  };

  try {
    const result = await smtpTransport.sendMail(message);
    console.log(`Tutoring assignment email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Error sending tutoring assignment email:', error);
    // Don't throw - email failures shouldn't block the main operation
  }
};

// module.exports = sendMail
/**
 * Email template for new enquiry notifications
 * Sends to admin when a new enquiry is submitted
 */
exports.getAdminEnquiryTemplate = (data) => {
  const PLATFORM_NAME = process.env.PLATFORM_NAME || "Neplearn";

  const levelMap = {
    'see': 'SEE (Class 10)',
    'plus2-science': '+2 Science',
    'plus2-management': '+2 Management',
    'plus2-humanities': '+2 Humanities',
    'other': 'Other'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Enquiry - ${PLATFORM_NAME}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table align="center" width="100%" style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e5e5e5;border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
          <td style="padding:20px 30px;border-bottom:1px solid #eee;">
            <h2 style="margin:0;font-size:18px;color:#222;">New Enquiry Received</h2>
            <p style="margin:5px 0 0 0;font-size:13px;color:#777;">${PLATFORM_NAME} Enquiry System</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:25px 30px;">
            <table width="100%" style="border-collapse:collapse;">
              
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <strong>Name:</strong><br/>
                  ${data.name}
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <strong>Email:</strong><br/>
                  <a href="mailto:${data.email}" style="color:#000;text-decoration:none;">${data.email}</a>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <strong>Phone:</strong><br/>
                  <a href="tel:${data.phone}" style="color:#000;text-decoration:none;">${data.phone}</a>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0; ${data.message ? 'border-bottom:1px solid #f0f0f0;' : ''}">
                  <strong>Level:</strong><br/>
                  ${levelMap[data.level] || data.level}
                </td>
              </tr>

              ${data.message ? `
              <tr>
                <td style="padding:10px 0;">
                  <strong>Message:</strong><br/>
                  <div style="margin-top:5px;line-height:1.6;">${data.message}</div>
                </td>
              </tr>
              ` : ''}

            </table>

            <p style="margin-top:25px;font-size:12px;color:#888;">
              Received on ${new Date(data.submittedAt).toLocaleString()}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:15px 30px;border-top:1px solid #eee;font-size:12px;color:#999;">
            © ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;
};



/**
 * Email template for enquiry confirmation to the user
 * Sends to user after they submit an enquiry
 */
exports.getUserEnquiryConfirmationTemplate = (data) => {
  const PLATFORM_NAME = process.env.PLATFORM_NAME || "Neplearn";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Enquiry Received - ${PLATFORM_NAME}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table align="center" width="100%" style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e5e5e5;border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
          <td style="padding:25px 30px;border-bottom:1px solid #eee;">
            <h1 style="margin:0;font-size:22px;color:#222;">${PLATFORM_NAME}</h1>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:30px;">
            <p style="margin:0 0 20px 0;font-size:15px;color:#333;">
              Hi ${data.name},
            </p>

            <p style="margin-bottom:20px;font-size:15px;color:#555;line-height:1.6;">
              Thank you for contacting ${PLATFORM_NAME}. We’ve successfully received your enquiry and our team will get back to you shortly.
            </p>

            <p style="margin-bottom:15px;font-size:15px;color:#555;">
              Here’s a summary of your submission:
            </p>

            <table width="100%" style="margin-bottom:25px;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#888;width:90px;">Email:</td>
                <td style="padding:6px 0;color:#333;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;">Phone:</td>
                <td style="padding:6px 0;color:#333;">${data.phone}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;">Level:</td>
                <td style="padding:6px 0;color:#333;">${data.level}</td>
              </tr>
            </table>

            <p style="font-size:15px;color:#555;line-height:1.6;">
              If you have additional information to share, simply reply to this email.
            </p>

            <p style="margin-top:25px;font-size:15px;color:#555;">
              — The ${PLATFORM_NAME} Team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:15px 30px;border-top:1px solid #eee;font-size:12px;color:#999;">
            © ${new Date().getFullYear()} ${PLATFORM_NAME}. All rights reserved.<br/>
            Kathmandu, Nepal
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;
};
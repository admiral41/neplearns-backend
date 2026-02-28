exports.getNewsletterWelcomeTemplate = (data) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to Neplearn Newsletter</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <tbody>
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-bottom: 1px solid #eee;">
              <h1 style="color: #333; margin: 0; font-size: 22px; font-weight: 600;">Neplearn</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="color: #333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                Hi${data.name ? ` ${data.name}` : ''},
              </p>

              <p style="color: #555; line-height: 1.6; margin-bottom: 20px; font-size: 15px;">
                Thanks for subscribing to the Neplearn newsletter. You'll now receive updates on new courses, study tips, and educational resources.
              </p>

              <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                Here's what you can expect:
              </p>

              <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                <li>Course updates and new content</li>
                <li>Study tips from educators</li>
                <li>Exclusive offers</li>
                <li>Important announcements</li>
              </ul>

              <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 15px;">
                Visit <a href="${process.env.FRONTEND_URI || 'http://localhost:3000'}" style="color: #333; text-decoration: underline;">our website</a> to explore courses.
              </p>

              <p style="color: #555; line-height: 1.6; margin: 0; font-size: 15px;">
                — The Neplearn Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Neplearn. All rights reserved.
              </p>
              <p style="margin: 0 0 8px 0; color: #999; font-size: 12px;">
                Kathmandu, Nepal
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                <a href="${process.env.FRONTEND_URI || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(data.email)}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
};
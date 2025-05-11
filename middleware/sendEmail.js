const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

// Configure nodemailer transporter with better error handling
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 5,
    });
  } catch (error) {
    console.error('Failed to create transporter:', error);
    throw error;
  }
};

const transporter = createTransporter();

// Verify connection with retries
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('SMTP Server is ready to send emails');
  } catch (error) {
    console.error('SMTP Connection Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Retry after 5 seconds
    setTimeout(verifyTransporter, 5000);
  }
};

verifyTransporter();

// Cache for compiled templates
const templateCache = {};

const compileTemplate = (templateName, data) => {
  try {
    if (!templateCache[templateName]) {
      const filePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Template file not found: ${filePath}`);
      }
      const source = fs.readFileSync(filePath, 'utf-8');
      templateCache[templateName] = handlebars.compile(source);
    }
    
    return templateCache[templateName]({
      ...data,
      year: new Date().getFullYear(),
      appName: process.env.EMAIL_FROM_NAME,
    });
  } catch (error) {
    console.error('Template compilation error:', error);
    throw error;
  }
};

const sendEmail = async (options) => {
  try {
    const { email, subject, template, data } = options;

    if (!email || !subject || !template) {
      throw new Error('Missing required email parameters');
    }

    const html = compileTemplate(template, data);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': new Date().getTime().toString()
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send error:', {
      to: options.email,
      error: {
        message: error.message,
        code: error.code,
        response: error.response,
        stack: error.stack
      }
    });
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
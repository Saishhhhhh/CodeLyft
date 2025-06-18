const nodemailer = require('nodemailer');

/**
 * Create a nodemailer transporter
 * Configure with your email service credentials in .env file
 */
const createTransporter = async () => {
  // Configure email service
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of email
 * @param {string} options.html - HTML version of email
 * @returns {Promise<Object>} - Email send info
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'CodeLyft'}" <${process.env.FROM_EMAIL || 'noreply@codelyft.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail }; 
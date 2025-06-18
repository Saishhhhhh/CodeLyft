/**
 * Email templates for various notifications
 */

/**
 * Password reset email template
 * @param {Object} options - Template options
 * @param {string} options.name - User's name
 * @param {string} options.otp - One-time password
 * @returns {Object} - Email text and HTML content
 */
const passwordResetTemplate = (options) => {
  const { name, otp } = options;
  
  // Plain text version
  const text = `
    Hello ${name},
    
    You have requested to reset your password for your CodeLyft account.
    
    Your 4-digit OTP code is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    Best regards,
    The CodeLyft Team
  `;
  
  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #6b46c1;
          padding: 20px;
          color: white;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 20px;
        }
        .otp-container {
          margin: 20px 0;
          padding: 20px;
          background-color: #f0f0f0;
          border-radius: 5px;
          text-align: center;
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #6b46c1;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>You have requested to reset your password for your CodeLyft account.</p>
          <p>Please use the following 4-digit code to reset your password:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The CodeLyft Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CodeLyft. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { text, html };
};

/**
 * Email verification template
 * @param {Object} options - Template options
 * @param {string} options.name - User's name
 * @param {string} options.otp - One-time password
 * @returns {Object} - Email text and HTML content
 */
const emailVerificationTemplate = (options) => {
  const { name, otp } = options;
  
  // Plain text version
  const text = `
    Hello ${name},
    
    Thank you for registering with CodeLyft! To complete your registration, please verify your email address.
    
    Your verification OTP code is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you did not create an account with us, please ignore this email.
    
    Best regards,
    The CodeLyft Team
  `;
  
  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #6b46c1;
          padding: 20px;
          color: white;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 20px;
        }
        .otp-container {
          margin: 20px 0;
          padding: 20px;
          background-color: #f0f0f0;
          border-radius: 5px;
          text-align: center;
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #6b46c1;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Thank you for registering with CodeLyft! To complete your registration, please verify your email address.</p>
          <p>Please use the following verification code:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not create an account with us, please ignore this email.</p>
          <p>Best regards,<br>The CodeLyft Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CodeLyft. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { text, html };
};

/**
 * Welcome email template for new users
 * @param {Object} options - Template options
 * @param {string} options.name - User's name
 * @returns {Object} - Email text and HTML content
 */
const welcomeEmailTemplate = (options) => {
  const { name } = options;
  
  // Plain text version
  const text = `
    Hello ${name},
    
    Welcome to CodeLyft! We're thrilled to have you join our community.
    
    Your account has been successfully created. Here's what you can do next:
    
    1. Complete your profile
    2. Verify your email address
    3. Explore our features and resources
    
    If you have any questions or need assistance, please don't hesitate to contact our support team.
    
    Best regards,
    The CodeLyft Team
  `;
  
  // HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CodeLyft</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #6b46c1;
          padding: 20px;
          color: white;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 20px;
        }
        .next-steps {
          margin: 20px 0;
          padding: 15px;
          background-color: #f0f0f0;
          border-radius: 5px;
        }
        .next-steps h3 {
          margin-top: 0;
          color: #6b46c1;
        }
        .next-steps ul {
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to CodeLyft!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Thank you for joining CodeLyft! We're excited to have you as part of our community.</p>
          
          <div class="next-steps">
            <h3>Here's what you can do next:</h3>
            <ul>
              <li><strong>Complete your profile</strong> - Add more information about yourself</li>
              <li><strong>Verify your email address</strong> - Ensure you receive important notifications</li>
              <li><strong>Explore our features</strong> - Discover all the tools and resources we offer</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The CodeLyft Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CodeLyft. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { text, html };
};

module.exports = {
  passwordResetTemplate,
  emailVerificationTemplate,
  welcomeEmailTemplate
}; 
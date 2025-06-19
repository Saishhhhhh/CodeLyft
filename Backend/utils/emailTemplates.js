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
          color: #111827;
          background-color: #F9F9F9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4F46E5, #8B5CF6);
          padding: 30px 20px;
          color: white;
          text-align: center;
          border-radius: 12px 12px 0 0;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -20px;
          right: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .logo {
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        .logo span {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: -0.5px;
          color: white;
        }
        .logo span.highlight {
          color: #00008B;
        }
        .content {
          padding: 30px;
        }
        .otp-container {
          margin: 25px 0;
          padding: 20px;
          background-color: #F3F4F6;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #4F46E5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 15px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span>Code<span class="highlight">Lyft</span></span>
          </div>
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
          color: #111827;
          background-color: #F9F9F9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4F46E5, #8B5CF6);
          padding: 30px 20px;
          color: white;
          text-align: center;
          border-radius: 12px 12px 0 0;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -20px;
          right: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .logo {
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        .logo span {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: -0.5px;
          color: white;
        }
        .logo span.highlight {
          color: #4F46E5;
        }
        .content {
          padding: 30px;
        }
        .otp-container {
          margin: 25px 0;
          padding: 20px;
          background-color: #F3F4F6;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #4F46E5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 15px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span>Code<span class="highlight">Lyft</span></span>
          </div>
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
 * @param {string} options.otp - Verification OTP (optional)
 * @returns {Object} - Email text and HTML content
 */
const welcomeEmailTemplate = (options) => {
  const { name, otp } = options;
  
  // Plain text version
  const text = `
    Hello ${name},
    
    Welcome to CodeLyft! We're thrilled to have you join our community.
    
    Your account has been successfully created. Here's what you can do next:
    
    1. Verify your email address using the code below
    2. Complete your profile
    3. Explore our features and resources
    
    ${otp ? `Your email verification code is: ${otp}
    
    This code will expire in 10 minutes.` : ''}
    
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
          color: #111827;
          background-color: #F9F9F9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4F46E5, #8B5CF6);
          padding: 30px 20px;
          color: white;
          text-align: center;
          border-radius: 12px 12px 0 0;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -20px;
          right: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .header::after {
          content: '';
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          z-index: 0;
        }
        .logo {
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        .logo span {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: -0.5px;
          color: white;
        }
        .logo span.highlight {
          color: #4F46E5;
        }
        .content {
          padding: 30px;
        }
        .next-steps {
          margin: 25px 0;
          padding: 20px;
          background-color: #F3F4F6;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .next-steps h3 {
          margin-top: 0;
          color: #4F46E5;
          font-weight: 600;
        }
        .next-steps ul {
          padding-left: 20px;
        }
        .next-steps li {
          margin-bottom: 12px;
        }
        .otp-container {
          margin: 25px 0;
          padding: 20px;
          background-color: #F3F4F6;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .otp-code {
          font-size: 42px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #4F46E5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #6B7280;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 15px;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span>Code<span class="highlight">Lyft</span></span>
          </div>
          <h1>Welcome to CodeLyft!</h1>
          ${otp ? `<h2 style="margin-top: 5px; font-size: 18px; font-weight: 500;">Please Verify Your Email</h2>` : ''}
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Thank you for joining CodeLyft! We're excited to have you as part of our community.</p>
          
          <div class="next-steps">
            <h3>Here's what you can do next:</h3>
            <ul>
              <li><strong>Verify your email address</strong> - Use the verification code below</li>
              <li><strong>Complete your profile</strong> - Add more information about yourself</li>
              <li><strong>Explore our features</strong> - Discover all the tools and resources we offer</li>
            </ul>
          </div>
          
          ${otp ? `
          <p>Please verify your email address using this verification code:</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          ` : ''}
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The CodeLyft Team</p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">Go to Dashboard</a>
          </div>
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
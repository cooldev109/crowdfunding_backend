// Email template helpers
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">InvestFlow</h1>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: #f7fafc; padding: 20px; text-align: center; font-family: Arial, sans-serif; color: #718096; font-size: 14px;">
    <p>© ${new Date().getFullYear()} InvestFlow. All rights reserved.</p>
    <p>
      <a href="${process.env.FRONTEND_URL}/settings" style="color: #667eea; text-decoration: none;">Notification Settings</a> |
      <a href="${process.env.FRONTEND_URL}/help" style="color: #667eea; text-decoration: none;">Help Center</a>
    </p>
  </div>
`;

// Welcome email template
export const welcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td>${getEmailHeader()}</td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #2d3748; margin-top: 0;">Welcome to InvestFlow, ${name}! 🎉</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Thank you for joining InvestFlow - your gateway to exciting investment opportunities.
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          We're thrilled to have you on board! Here's what you can do next:
        </p>
        <ul style="color: #4a5568; line-height: 1.8; font-size: 16px;">
          <li>Browse our curated investment projects</li>
          <li>Build your investment portfolio</li>
          <li>Track your returns in real-time</li>
          <li>Connect with other investors</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Browse Projects
          </a>
        </div>
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/help" style="color: #667eea;">Help Center</a> or contact our support team.
        </p>
      </td>
    </tr>
    <tr>
      <td>${getEmailFooter()}</td>
    </tr>
  </table>
</body>
</html>
`;

// Investment confirmation email template
export const investmentConfirmationTemplate = (data: {
  name: string;
  projectTitle: string;
  amount: number;
  expectedReturn: number;
  investmentDate: string;
  investmentId: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td>${getEmailHeader()}</td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: #48bb78; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 40px;">✓</span>
          </div>
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-top: 0;">Investment Confirmed! 🎉</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hi ${data.name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Your investment has been successfully processed. Here are the details:
        </p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table width="100%" cellpadding="8" style="font-family: Arial, sans-serif;">
            <tr>
              <td style="color: #718096; font-size: 14px;">Project:</td>
              <td style="color: #2d3748; font-weight: bold; text-align: right;">${data.projectTitle}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Investment Amount:</td>
              <td style="color: #2d3748; font-weight: bold; text-align: right;">$${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Expected Return:</td>
              <td style="color: #48bb78; font-weight: bold; text-align: right;">$${data.expectedReturn.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Investment Date:</td>
              <td style="color: #2d3748; text-align: right;">${new Date(data.investmentDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Investment ID:</td>
              <td style="color: #2d3748; text-align: right; font-family: monospace; font-size: 12px;">${data.investmentId}</td>
            </tr>
          </table>
        </div>
        <div style="background: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #234e52; font-size: 14px;">
            <strong>Note:</strong> You can cancel this investment within 24 hours of placement. After that, the investment becomes final.
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/my-investments" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View My Investments
          </a>
        </div>
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Thank you for investing with InvestFlow! We'll keep you updated on your investment's progress.
        </p>
      </td>
    </tr>
    <tr>
      <td>${getEmailFooter()}</td>
    </tr>
  </table>
</body>
</html>
`;

// Password reset email template
export const passwordResetTemplate = (name: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td>${getEmailHeader()}</td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #2d3748; margin-top: 0;">Reset Your Password 🔐</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hi ${name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #742a2a; font-size: 14px;">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact our support team.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td>${getEmailFooter()}</td>
    </tr>
  </table>
</body>
</html>
`;

// Investment cancelled/refunded email template
export const investmentCancelledTemplate = (data: {
  name: string;
  projectTitle: string;
  amount: number;
  refundReason: string;
  investmentId: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td>${getEmailHeader()}</td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #2d3748; margin-top: 0;">Investment Cancelled</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hi ${data.name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Your investment has been cancelled and a refund has been initiated.
        </p>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table width="100%" cellpadding="8" style="font-family: Arial, sans-serif;">
            <tr>
              <td style="color: #718096; font-size: 14px;">Project:</td>
              <td style="color: #2d3748; font-weight: bold; text-align: right;">${data.projectTitle}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Refund Amount:</td>
              <td style="color: #2d3748; font-weight: bold; text-align: right;">$${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Reason:</td>
              <td style="color: #2d3748; text-align: right;">${data.refundReason}</td>
            </tr>
            <tr>
              <td style="color: #718096; font-size: 14px;">Investment ID:</td>
              <td style="color: #2d3748; text-align: right; font-family: monospace; font-size: 12px;">${data.investmentId}</td>
            </tr>
          </table>
        </div>
        <div style="background: #fffaf0; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #7c2d12; font-size: 14px;">
            <strong>Refund Processing:</strong> Your refund will be processed within 5-7 business days to your original payment method.
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/projects" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Browse Other Projects
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td>${getEmailFooter()}</td>
    </tr>
  </table>
</body>
</html>
`;

// Subscription confirmation email template
export const subscriptionConfirmationTemplate = (data: {
  name: string;
  planName: string;
  price: number;
  features: string[];
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f7fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td>${getEmailHeader()}</td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: #9f7aea; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 40px;">⭐</span>
          </div>
        </div>
        <h2 style="color: #2d3748; text-align: center; margin-top: 0;">Welcome to ${data.planName} Plan! 🚀</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hi ${data.name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Thank you for subscribing to our ${data.planName} plan. You now have access to:
        </p>
        <ul style="color: #4a5568; line-height: 1.8; font-size: 16px;">
          ${data.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #718096; margin: 0; font-size: 14px;">Monthly Subscription</p>
          <p style="color: #2d3748; font-size: 32px; font-weight: bold; margin: 10px 0;">$${data.price}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/subscription/manage" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Manage Subscription
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td>${getEmailFooter()}</td>
    </tr>
  </table>
</body>
</html>
`;

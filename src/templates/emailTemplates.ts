// Email template helpers - Rendall Branding
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #145952 0%, #0f4239 100%); padding: 30px; text-align: center;">
    <h1 style="color: #d7f205; margin: 0; font-family: Arial, sans-serif; font-size: 28px; letter-spacing: 1px;">RENDALL</h1>
    <p style="color: white; margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Plataforma de Inversiones</p>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: #f7fafc; padding: 20px; text-align: center; font-family: Arial, sans-serif; color: #718096; font-size: 14px;">
    <p>© ${new Date().getFullYear()} Rendall. Todos los derechos reservados.</p>
    <p>
      <a href="${process.env.FRONTEND_URL || process.env.CLIENT_URL}/dashboard" style="color: #145952; text-decoration: none;">Mi Cuenta</a> |
      <a href="${process.env.FRONTEND_URL || process.env.CLIENT_URL}/contact" style="color: #145952; text-decoration: none;">Contacto</a>
    </p>
  </div>
`;

// Welcome email template - Spanish
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
        <h2 style="color: #112026; margin-top: 0;">¡Bienvenido a Rendall, ${name}!</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Gracias por unirte a Rendall - tu puerta de entrada a oportunidades de inversión exclusivas.
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          ¡Estamos emocionados de tenerte con nosotros! Esto es lo que puedes hacer ahora:
        </p>
        <ul style="color: #4a5568; line-height: 1.8; font-size: 16px;">
          <li>Explora nuestros proyectos de inversión curados</li>
          <li>Construye tu portafolio de inversiones</li>
          <li>Monitorea tus retornos en tiempo real</li>
          <li>Accede a información exclusiva del mercado</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || process.env.CLIENT_URL}/projects" style="background: linear-gradient(135deg, #d7f205 0%, #c4db00 100%); color: #112026; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Explorar Proyectos
          </a>
        </div>
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          ¿Necesitas ayuda? <a href="${process.env.FRONTEND_URL || process.env.CLIENT_URL}/contact" style="color: #145952;">Contáctanos</a> y nuestro equipo te asistirá.
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

// Password reset email template - Spanish
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
        <h2 style="color: #112026; margin-top: 0;">Restablecer Contraseña</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hola ${name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #d7f205 0%, #c4db00 100%); color: #112026; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p style="color: #718096; font-size: 14px;">
          O copia y pega este enlace en tu navegador:<br>
          <a href="${resetUrl}" style="color: #145952; word-break: break-all;">${resetUrl}</a>
        </p>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            <strong>Aviso de Seguridad:</strong> Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, ignora este correo o contacta a nuestro equipo de soporte.
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

// Two-factor authentication setup template
export const twoFactorSetupTemplate = (name: string, qrCodeUrl: string, secret: string) => `
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
        <h2 style="color: #2d3748; margin-top: 0;">Two-Factor Authentication Enabled 🔐</h2>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Hi ${name},
        </p>
        <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">
          Two-factor authentication has been enabled on your account. You can use the QR code or manual entry key below to set up your authenticator app:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrCodeUrl}" alt="2FA QR Code" style="max-width: 200px; height: auto;" />
        </div>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #718096; margin: 0 0 10px 0; font-size: 14px;">Manual Entry Key:</p>
          <p style="color: #2d3748; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 0;">${secret}</p>
        </div>
        <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #742a2a; font-size: 14px;">
            <strong>Important:</strong> Keep this secret key safe. You'll need it if you lose access to your authenticator app.
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

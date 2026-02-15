// Email service utility
// For now, this logs to console. In production, integrate with SendGrid/Resend

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
  // For now, log to console for development
  
  console.log('📧 Email would be sent:')
  console.log('To:', options.to)
  console.log('Subject:', options.subject)
  console.log('Body:', options.text || options.html)
  
  // In production, uncomment and configure:
  /*
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: options.to }] }],
      from: { email: process.env.FROM_EMAIL },
      subject: options.subject,
      content: [{ type: 'text/html', value: options.html }],
    }),
  })
  
  return response.ok
  */
  
  return true // Simulate success in development
}

export function generateVerificationEmail(verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to UpKeep!</h1>
          <p>Thank you for registering. Please verify your email address to get started.</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account with UpKeep, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

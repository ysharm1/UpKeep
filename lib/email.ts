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

// Lead notification email for partners
export interface LeadNotification {
  partnerName: string
  partnerEmail: string
  customerName: string
  customerPhone: string
  customerEmail: string
  category: string
  description: string
  location: string
  jobId: string
  dashboardUrl: string
  viewFee: number
  winFee: number
  competitorCount: number
}

export async function sendLeadNotification(lead: LeadNotification): Promise<boolean> {
  const subject = `🔥 New ${lead.category.toUpperCase()} Lead - ${lead.location} (${lead.competitorCount} competing)`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #dc2626; }
          .warning-box { background-color: #fef3c7; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
          .label { font-weight: bold; color: #4b5563; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #dc2626; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .urgent { color: #dc2626; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔥 COMPETITIVE LEAD ALERT</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">You're competing with ${lead.competitorCount - 1} other ${lead.competitorCount === 2 ? 'provider' : 'providers'}</p>
          </div>
          <div class="content">
            <p class="urgent">⚡ FIRST TO BOOK WINS! ⚡</p>
            
            <div class="warning-box">
              <p><strong>💰 Pricing:</strong></p>
              <ul style="margin: 5px 0;">
                <li>You paid $${lead.viewFee} to see this lead</li>
                <li>If you book first: Pay additional $${lead.winFee} (total $${lead.viewFee + lead.winFee})</li>
                <li>If you don't book: You only lose $${lead.viewFee}</li>
                <li>If NO ONE books in 24 hours: Full $${lead.viewFee} refund</li>
              </ul>
            </div>
            
            <div class="info-box">
              <p><span class="label">Customer:</span> ${lead.customerName}</p>
              <p><span class="label">Phone:</span> ${lead.customerPhone}</p>
              <p><span class="label">Email:</span> ${lead.customerEmail}</p>
              <p><span class="label">Location:</span> ${lead.location}</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">Service Needed:</span> ${lead.category.toUpperCase()}</p>
              <p><span class="label">Description:</span></p>
              <p>${lead.description}</p>
            </div>
            
            <p><strong>🏆 How to Win:</strong></p>
            <ol>
              <li><strong>Contact customer IMMEDIATELY</strong> (call or text)</li>
              <li><strong>Book appointment</strong> through the platform</li>
              <li><strong>First to book wins</strong> the job</li>
            </ol>
            
            <center>
              <a href="${lead.dashboardUrl}" class="button">VIEW LEAD & BOOK NOW</a>
            </center>
            
            <div class="footer">
              <p><strong>⏰ Time is money!</strong> The faster you respond, the more likely you win.</p>
              <p>Questions? Reply to this email or call us at (555) 123-4567</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: lead.partnerEmail,
    subject,
    html,
    text: `URGENT: New ${lead.category} lead from ${lead.customerName} in ${lead.location}. You're competing with ${lead.competitorCount - 1} others. Contact: ${lead.customerPhone}. First to book wins! You paid $${lead.viewFee} to see this. Winner pays additional $${lead.winFee}.`,
  })
}

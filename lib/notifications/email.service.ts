// Email service - optional, will fallback to console logging if Resend is not available
let resend: any = null

try {
  const { Resend } = require('resend')
  resend = new Resend(process.env.RESEND_API_KEY)
} catch (error) {
  console.log('[EMAIL] Resend package not installed, emails will be logged to console')
}

interface EmailParams {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: EmailParams) {
  try {
    // In development or if Resend is not configured, just log the email
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY || !resend) {
      console.log('[EMAIL] Would send email:', { to, subject })
      console.log('[EMAIL] Content:', html)
      return { success: true, messageId: 'dev-mode' }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'UpKeep <noreply@upkeep.app>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('[EMAIL_ERROR]', error)
      return { success: false, error }
    }

    console.log('[EMAIL_SENT]', { to, subject, messageId: data?.id })
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[EMAIL_ERROR]', error)
    return { success: false, error }
  }
}

// Booking confirmation to provider
export async function sendBookingConfirmationToProvider({
  providerEmail,
  providerName,
  homeownerName,
  jobDescription,
  scheduledDate,
  location,
  diagnosticFee,
}: {
  providerEmail: string
  providerName: string
  homeownerName: string
  jobDescription: string
  scheduledDate: Date
  location: string
  diagnosticFee: number
}) {
  const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = new Date(scheduledDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .detail-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
          .detail-row { margin: 10px 0; }
          .label { font-weight: bold; color: #1f2937; }
          .value { color: #4b5563; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 New Diagnostic Visit Booked</h1>
          </div>
          <div class="content">
            <p>Hi ${providerName},</p>
            <p>Great news! You have a new diagnostic visit scheduled.</p>
            
            <div class="detail-box">
              <h3 style="margin-top: 0;">📅 Appointment Details</h3>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${location}</span>
              </div>
            </div>

            <div class="detail-box">
              <h3 style="margin-top: 0;">👤 Customer Information</h3>
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${homeownerName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Problem:</span>
                <span class="value">${jobDescription}</span>
              </div>
            </div>

            <div class="detail-box">
              <h3 style="margin-top: 0;">💰 Payment</h3>
              <div class="detail-row">
                <span class="label">Diagnostic Fee:</span>
                <span class="value">$${diagnosticFee.toFixed(2)} (authorized)</span>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
                Payment has been authorized and will be captured after you submit the diagnostic report.
              </p>
            </div>

            <p style="margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/dashboard" class="button">
                View in Dashboard
              </a>
            </p>

            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              Please arrive on time and bring any necessary tools for the inspection.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: providerEmail,
    subject: `New Diagnostic Visit Scheduled - ${formattedDate}`,
    html,
  })
}

// Diagnostic report ready notification to homeowner
export async function sendDiagnosticReportReadyToHomeowner({
  homeownerEmail,
  homeownerName,
  providerName,
  jobId,
}: {
  homeownerEmail: string
  homeownerName: string
  providerName: string
  jobId: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Your Diagnostic Report is Ready</h1>
          </div>
          <div class="content">
            <p>Hi ${homeownerName},</p>
            <p>${providerName} has completed the diagnostic visit and submitted their professional assessment.</p>
            
            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}/diagnostic-report" class="button">
                View Diagnostic Report
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              The report includes photos, findings, and recommendations for your repair.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: homeownerEmail,
    subject: `Your Diagnostic Report is Ready`,
    html,
  })
}

// Repair quote ready notification to homeowner
export async function sendRepairQuoteReadyToHomeowner({
  homeownerEmail,
  homeownerName,
  providerName,
  totalAmount,
  jobId,
}: {
  homeownerEmail: string
  homeownerName: string
  providerName: string
  totalAmount: number
  jobId: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .price-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px solid #f59e0b; }
          .price { font-size: 36px; font-weight: bold; color: #f59e0b; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Repair Quote Ready for Review</h1>
          </div>
          <div class="content">
            <p>Hi ${homeownerName},</p>
            <p>${providerName} has prepared a repair quote for your review.</p>
            
            <div class="price-box">
              <p style="margin: 0; color: #6b7280;">Total Repair Cost</p>
              <div class="price">$${totalAmount.toFixed(2)}</div>
            </div>

            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}/approve-repair" class="button">
                Review & Approve Quote
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              The quote includes a detailed breakdown of labor and parts costs. You can approve or decline the quote.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: homeownerEmail,
    subject: `Repair Quote Ready - $${totalAmount.toFixed(2)}`,
    html,
  })
}

// Quote approved notification to provider
export async function sendQuoteApprovedToProvider({
  providerEmail,
  providerName,
  homeownerName,
  totalAmount,
  jobId,
}: {
  providerEmail: string
  providerName: string
  homeownerName: string
  totalAmount: number
  jobId: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Quote Approved!</h1>
          </div>
          <div class="content">
            <p>Hi ${providerName},</p>
            <p>Great news! ${homeownerName} has approved your repair quote of <strong>$${totalAmount.toFixed(2)}</strong>.</p>
            
            <p style="background: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              💳 Payment of $${totalAmount.toFixed(2)} has been authorized and will be captured when you mark the job as complete.
            </p>

            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/provider/dashboard" class="button">
                View Job Details
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              You can now proceed with the repair work. Once completed, mark the job as complete to receive payment.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: providerEmail,
    subject: `Quote Approved - $${totalAmount.toFixed(2)}`,
    html,
  })
}

// Job completed notification to both parties
export async function sendJobCompletedNotification({
  homeownerEmail,
  providerEmail,
  homeownerName,
  providerName,
  totalAmount,
  jobId,
}: {
  homeownerEmail: string
  providerEmail: string
  homeownerName: string
  providerName: string
  totalAmount: number
  jobId: string
}) {
  // Email to homeowner
  const homeownerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Job Completed!</h1>
          </div>
          <div class="content">
            <p>Hi ${homeownerName},</p>
            <p>${providerName} has marked your repair job as complete.</p>
            
            <p style="background: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              💳 Payment of $${totalAmount.toFixed(2)} has been processed.
            </p>

            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${jobId}" class="button">
                View Job Details
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              We hope you're satisfied with the service! Please consider leaving a review.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  // Email to provider
  const providerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Received!</h1>
          </div>
          <div class="content">
            <p>Hi ${providerName},</p>
            <p>The job for ${homeownerName} has been marked as complete and payment has been processed.</p>
            
            <p style="background: #d1fae5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              💳 You've received $${totalAmount.toFixed(2)} for this job.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Payment will be deposited to your account within 2-3 business days.
            </p>

            <div class="footer">
              <p>UpKeep - Professional Home Repair Services</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  // Send both emails
  await sendEmail({
    to: homeownerEmail,
    subject: 'Job Completed - Thank You!',
    html: homeownerHtml,
  })

  await sendEmail({
    to: providerEmail,
    subject: `Payment Received - $${totalAmount.toFixed(2)}`,
    html: providerHtml,
  })

  return { success: true }
}

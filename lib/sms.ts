import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

let twilioClient: ReturnType<typeof twilio> | null = null

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
} else {
  console.warn('⚠️ Twilio credentials not configured. SMS will be logged to console.')
}

export interface SMSOptions {
  to: string
  message: string
}

/**
 * Send SMS message
 */
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  // If Twilio not configured, log to console
  if (!twilioClient || !fromNumber) {
    console.log('📱 SMS would be sent:')
    console.log('To:', options.to)
    console.log('Message:', options.message)
    return true
  }

  try {
    const message = await twilioClient.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to,
    })

    console.log(`✅ SMS sent: ${message.sid}`)
    return true
  } catch (error) {
    console.error('❌ SMS error:', error)
    return false
  }
}

/**
 * Send new lead notification to vendor
 */
export async function sendNewLeadNotification(
  vendorPhone: string,
  vendorName: string,
  category: string,
  location: string,
  leadId: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const leadUrl = `${appUrl}/provider/leads/${leadId}`

  const message = `🔥 New ${category.toUpperCase()} lead in ${location}!

Pay $15 to view details & compete with 2 others.

View lead: ${leadUrl}

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

/**
 * Send lead accepted notification (to losers)
 */
export async function sendLeadAcceptedNotification(
  vendorPhone: string,
  vendorName: string,
  category: string
): Promise<boolean> {
  const message = `The ${category} lead was accepted by another pro. You were charged $15 to view. Better luck next time!

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

/**
 * Send lead view confirmation
 */
export async function sendLeadViewConfirmation(
  vendorPhone: string,
  vendorName: string,
  customerName: string,
  customerPhone: string
): Promise<boolean> {
  const message = `✅ Lead unlocked! You paid $15.

Customer: ${customerName}
Phone: ${customerPhone}

Call them now! First to accept pays $50 more and wins the job.

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

/**
 * Send lead acceptance confirmation
 */
export async function sendLeadAcceptanceConfirmation(
  vendorPhone: string,
  vendorName: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string
): Promise<boolean> {
  const message = `🎉 You won the lead! Total paid: $65

Customer Details:
Name: ${customerName}
Phone: ${customerPhone}
Email: ${customerEmail}

Contact them ASAP to schedule. Good luck!

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

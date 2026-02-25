import twilio from 'twilio'
import { getAppUrl } from './config'

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
  const appUrl = getAppUrl()
  const leadUrl = `${appUrl}/provider/leads/${leadId}`

  const message = `🔥 NEW ${category.toUpperCase()} LEAD - ${location}
⏰ Just posted - Act fast!
💰 Starting at $40 to purchase

View NOW: ${leadUrl}

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

/**
 * Send lead purchase confirmation (new shared lead model)
 */
export async function sendLeadPurchaseConfirmation(
  vendorPhone: string,
  vendorName: string,
  customerName: string,
  customerPhone: string
): Promise<boolean> {
  const message = `✅ Lead purchased!

Customer: ${customerName}
Phone: ${customerPhone}

Call them now to quote the job!

- UpKeep`

  return sendSMS({
    to: vendorPhone,
    message,
  })
}

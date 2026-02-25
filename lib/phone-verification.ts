import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

let twilioClient: ReturnType<typeof twilio> | null = null

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
} else {
  console.warn('⚠️ Twilio credentials not configured. Phone verification will be simulated.')
}

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    // If Twilio Verify not configured, simulate success in development
    if (!twilioClient || !verifyServiceSid) {
      console.log('📱 Verification code would be sent to:', phoneNumber)
      console.log('💡 In development: Use code "123456" to verify')
      return { success: true }
    }

    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      })

    console.log(`✅ Verification code sent: ${verification.sid}`)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Send verification error:', error)
    return { success: false, error: error.message || 'Failed to send verification code' }
  }
}

/**
 * Check verification code
 */
export async function checkVerificationCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If Twilio Verify not configured, accept "123456" in development
    if (!twilioClient || !verifyServiceSid) {
      console.log('📱 Checking verification code for:', phoneNumber)
      if (code === '123456') {
        console.log('✅ Development code accepted')
        return { success: true }
      } else {
        return { success: false, error: 'Invalid code. Use "123456" in development.' }
      }
    }

    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      })

    if (verificationCheck.status === 'approved') {
      console.log(`✅ Phone verified: ${phoneNumber}`)
      return { success: true }
    } else {
      return { success: false, error: 'Invalid or expired code' }
    }
  } catch (error: any) {
    console.error('❌ Verification check error:', error)
    return { success: false, error: error.message || 'Verification failed' }
  }
}

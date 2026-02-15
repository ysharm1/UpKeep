# Email Notifications Setup Guide

## Overview

Email notifications are now integrated into the UpKeep platform using Resend. In development mode, emails are logged to the console instead of being sent.

## Setup for Production

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email domain (or use their test domain for development)
3. Get your API key from the dashboard

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="UpKeep <noreply@yourdomain.com>"
```

### 3. Verify Domain (Production Only)

For production, you need to verify your domain:
1. Add DNS records provided by Resend
2. Wait for verification (usually a few minutes)
3. Update `EMAIL_FROM` with your verified domain

## Email Notifications Implemented

### 1. Booking Confirmation (to Provider)
**Trigger**: When homeowner books a diagnostic visit
**Recipient**: Service provider
**Content**:
- Appointment date and time
- Customer information
- Problem description
- Location
- Diagnostic fee amount

### 2. Diagnostic Report Ready (to Homeowner)
**Trigger**: When provider submits diagnostic report
**Recipient**: Homeowner
**Content**:
- Provider name
- Link to view report
- Notification that assessment is complete

### 3. Repair Quote Ready (to Homeowner)
**Trigger**: When provider submits repair quote
**Recipient**: Homeowner
**Content**:
- Provider name
- Total repair cost
- Link to review and approve quote

### 4. Quote Approved (to Provider)
**Trigger**: When homeowner approves repair quote
**Recipient**: Service provider
**Content**:
- Homeowner name
- Approved amount
- Payment authorization confirmation
- Link to job details

### 5. Job Completed (to Both)
**Trigger**: When provider marks job as complete
**Recipients**: Both homeowner and provider
**Content**:
- **To Homeowner**: Payment processed, job complete, request for review
- **To Provider**: Payment received, payout information

## Development Mode

In development (when `RESEND_API_KEY` is not set):
- Emails are NOT sent
- Email content is logged to console
- You can see what would be sent without actually sending

Example console output:
```
[EMAIL] Would send email: { to: 'user@example.com', subject: 'New Diagnostic Visit Scheduled' }
[EMAIL] Content: <html>...</html>
```

## Testing

### Test in Development
1. Don't set `RESEND_API_KEY` in `.env`
2. Perform actions that trigger emails
3. Check console for email logs

### Test in Production
1. Set `RESEND_API_KEY` in `.env`
2. Use test email addresses
3. Verify emails are received

## Email Templates

All email templates are in `lib/notifications/email.service.ts` and include:
- Responsive HTML design
- Professional styling
- Clear call-to-action buttons
- Mobile-friendly layout

## Troubleshooting

### Emails not sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify domain is verified (production)
3. Check console for error logs
4. Ensure `EMAIL_FROM` uses verified domain

### Emails going to spam
1. Verify your domain with Resend
2. Add SPF and DKIM records
3. Use a professional "from" address
4. Avoid spam trigger words

### Rate limits
Resend free tier:
- 100 emails/day
- 3,000 emails/month

For production, upgrade to paid plan.

## Future Enhancements

Potential improvements:
1. SMS notifications for urgent actions
2. In-app notification bell
3. Email preferences (opt-out options)
4. Notification scheduling
5. Rich email templates with images
6. Email tracking (opens, clicks)

## API Integration Points

Emails are sent from these endpoints:
- `POST /api/bookings` - Booking confirmation
- `POST /api/jobs/[id]/diagnostic-report` - Report ready
- `POST /api/jobs/[id]/repair-quote` - Quote ready
- `POST /api/jobs/[id]/approve-repair` - Quote approved
- `POST /api/jobs/[id]/complete` - Job completed

All email sending is wrapped in try-catch blocks, so failures won't break the main flow.

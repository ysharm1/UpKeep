# Stripe Payment Testing Guide

## Test Cards

Use these test cards in the payment form:

### Successful Payment
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Declined Card
- **Card Number**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: Card will be declined

### Insufficient Funds
- **Card Number**: `4000 0000 0000 9995`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: Insufficient funds error

## Testing Flow

### 1. Test Diagnostic Booking Payment
1. Start dev server: `npm run dev`
2. Register as a homeowner
3. Submit a problem (use ZIP code: 94102)
4. Get AI diagnosis
5. Click "Find Professionals"
6. Click "Book Diagnostic Visit" on a provider
7. Payment modal appears
8. Enter test card: `4242 4242 4242 4242`
9. Click "Authorize Payment"
10. Should redirect to job details with "diagnostic_scheduled" status

### 2. Test Repair Quote Payment
1. Complete diagnostic booking first
2. As provider, submit diagnostic report
3. Capture diagnostic payment
4. Submit repair quote
5. As homeowner, view job and click "Review Quote"
6. Click "Approve & Authorize Payment"
7. Payment modal appears
8. Enter test card: `4242 4242 4242 4242`
9. Click "Authorize Payment"
10. Should redirect to job details with "repair_approved" status

## Verify in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. You should see two payment intents:
   - One for diagnostic fee (e.g., $89)
   - One for repair cost (e.g., $450)
3. Both should have status "requires_capture" (authorized but not captured)
4. Metadata should show jobId and type (diagnostic/repair)

## What Happens Next

- Payments are AUTHORIZED but not CAPTURED
- Diagnostic payment is captured when provider submits diagnostic report
- Repair payment is captured when provider completes the job
- If job is cancelled, payments can be released without charging the customer

## Troubleshooting

### "Stripe is not defined" error
- Make sure Stripe packages are installed: `npm install @stripe/stripe-js @stripe/react-stripe-js`
- Restart dev server

### "Invalid publishable key" error
- Check `.env` file has `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Key should start with `pk_test_`
- Restart dev server after changing .env

### Payment modal doesn't appear
- Check browser console for errors
- Make sure StripePaymentForm component is imported correctly
- Verify showPaymentModal state is being set to true

### Payment fails with "No such payment_method"
- This means the payment method wasn't created properly
- Check that CardElement is rendering correctly
- Try a different test card

## Next Steps After Testing

Once payments work:
1. Test payment capture flow (provider completes job)
2. Test payment refund flow (admin cancels job)
3. Add error handling for edge cases
4. Add loading states during payment processing
5. Add success animations after payment

#!/bin/bash

echo "🔑 Stripe Setup Helper"
echo "====================="
echo ""
echo "Please get your Stripe test keys from:"
echo "https://dashboard.stripe.com/test/apikeys"
echo ""
echo "You need:"
echo "1. Secret key (starts with sk_test_)"
echo "2. Publishable key (starts with pk_test_)"
echo ""
read -p "Enter your Stripe Secret Key (sk_test_...): " SECRET_KEY
read -p "Enter your Stripe Publishable Key (pk_test_...): " PUBLISHABLE_KEY

# Update .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|STRIPE_SECRET_KEY=\"\"|STRIPE_SECRET_KEY=\"$SECRET_KEY\"|g" .env
    sed -i '' "s|STRIPE_PUBLISHABLE_KEY=\"\"|STRIPE_PUBLISHABLE_KEY=\"$PUBLISHABLE_KEY\"|g" .env
else
    # Linux
    sed -i "s|STRIPE_SECRET_KEY=\"\"|STRIPE_SECRET_KEY=\"$SECRET_KEY\"|g" .env
    sed -i "s|STRIPE_PUBLISHABLE_KEY=\"\"|STRIPE_PUBLISHABLE_KEY=\"$PUBLISHABLE_KEY\"|g" .env
fi

echo ""
echo "✅ Stripe keys added to .env file!"
echo ""
echo "You can now run: npm run dev"

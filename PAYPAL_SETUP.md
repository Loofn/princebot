# PayPal Cumcoins Integration Setup Guide

## Overview
This integration allows users to purchase cumcoins using PayPal. The system generates secure PayPal payment links and automatically delivers cumcoins when payments are confirmed.

## Setup Steps

### 1. Environment Variables
Add these to your `.env` file:

```env
# Your PayPal email address (the one that receives payments)
PAYPAL_EMAIL=your-paypal-email@example.com

# Your server's base URL (for webhook callbacks)
BASE_URL=https://your-domain.com

# Optional: Different channel for PayPal announcements
PAYPAL_ANNOUNCEMENT_CHANNEL_ID=1399583622452871228
```

### 2. PayPal Account Setup

1. **Business Account**: Make sure you have a PayPal Business account
2. **IPN Settings**: 
   - Go to PayPal Account Settings → Notifications → Instant Payment Notifications
   - Set IPN URL to: `https://your-domain.com/paypal-webhook`
   - Enable IPN messages

### 3. Exchange Rates Configuration

Current rates (edit in `/slashCommands/cumcoins/sellcoins.js`):
- 1,000 cumcoins = $1.00
- 5,000 cumcoins = $4.50  (10% discount)
- 10,000 cumcoins = $8.00 (20% discount)
- 25,000 cumcoins = $18.00 (28% discount)
- 50,000 cumcoins = $32.00 (36% discount)

### 4. Database Setup (Optional)

Run the SQL in `/database/paypal_orders.sql` to create order tracking:

```sql
CREATE TABLE IF NOT EXISTS paypal_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(32) UNIQUE NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    discord_username VARCHAR(255) NOT NULL,
    cumcoins INT NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    paypal_txn_id VARCHAR(255) NULL
);
```

## How It Works

### User Experience:
1. User runs `/sellcoins amount:10000`
2. Bot displays purchase summary with PayPal button
3. User clicks "Pay with PayPal" → redirected to PayPal
4. After payment, PayPal sends IPN to your webhook
5. Bot automatically adds cumcoins to user's account
6. User receives DM confirmation + public announcement

### Security Features:
- Unique order IDs prevent duplicate payments
- PayPal IPN verification (basic implementation included)
- Order tracking and logging
- Amount verification before delivering cumcoins

## Available Endpoints

- `POST /paypal-webhook` - PayPal IPN handler
- `GET /paypal-success` - Payment success page
- `GET /paypal-cancel` - Payment cancelled page

## Testing

### Test with PayPal Sandbox:
1. Create PayPal Developer account
2. Use sandbox credentials
3. Change PayPal URL to sandbox: `https://www.sandbox.paypal.com/cgi-bin/webscr`

### Manual Testing:
1. Run `/sellcoins amount:1000`
2. Check that PayPal link is generated correctly
3. Complete a small test transaction
4. Verify cumcoins are delivered

## Customization Options

### Adjust Exchange Rates:
Edit `EXCHANGE_RATES` object in `/slashCommands/cumcoins/sellcoins.js`

### Change Announcement Channel:
Update `ANNOUNCEMENT_CHANNEL_ID` in `/events/paypalWebhook.js`

### Add More Package Options:
Add new choices in the slash command options array

### Custom Webhooks:
Modify `/events/paypalWebhook.js` to add more complex verification or additional features

## Important Security Notes

1. **HTTPS Required**: PayPal requires HTTPS for webhooks
2. **IPN Verification**: The current implementation has basic verification - consider implementing full PayPal IPN verification for production
3. **Environment Variables**: Never commit your PayPal email or other sensitive data
4. **Order Tracking**: Consider implementing the database table for better order management
5. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Troubleshooting

### Common Issues:
- **Webhook not working**: Check HTTPS and firewall settings
- **Cumcoins not delivered**: Check console logs for PayPal IPN errors  
- **Wrong amounts**: Verify exchange rates match PayPal payments
- **User not found**: Make sure user hasn't left the server

### Logs to Check:
- PayPal IPN received messages
- Order completion confirmations
- User DM delivery attempts
- Amount verification results

## Support

If you need help with this integration, check:
1. Console logs for error messages
2. PayPal IPN history in your PayPal account
3. Discord bot permissions for sending DMs and channel messages

## Future Enhancements

Possible improvements:
- Stripe integration as alternative
- Bulk discount codes
- Refund handling
- Advanced order management dashboard
- Integration with existing shop system

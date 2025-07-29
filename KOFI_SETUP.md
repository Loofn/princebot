# Ko-Fi Webhook Setup Guide

This bot now supports Ko-Fi donation announcements! When someone donates through Ko-Fi, the bot will automatically post an announcement in the configured Discord channel.

## Setup Instructions

### 1. Environment Variables
Add these variables to your `.env` file:

```env
KOFI_VERIFICATION_TOKEN=your_kofi_verification_token_here
WEBHOOK_PORT=3000
```

### 2. Ko-Fi Configuration
1. Go to your Ko-Fi settings: https://ko-fi.com/manage/webhooks
2. Enable webhooks and set the webhook URL to: `http://your-server-domain:3000/kofi-webhook`
3. Copy the verification token and add it to your `.env` file
4. Save the webhook settings

### 3. Discord Channel
The bot is configured to send announcements to channel ID: `1399583622452871228`

### 4. Testing
- Visit `http://your-server-domain:3000/webhook-status` to verify the webhook server is running
- Make a test donation to ensure the webhook is working properly

## Features
- Announces both one-time donations and monthly subscriptions
- Shows donor name (if public), amount, and message
- Beautiful embeds with Ko-Fi branding
- Handles both public and private donations
- Error handling and logging

## Supported Ko-Fi Events
- Donations
- Subscriptions (monthly supporters)

The webhook will automatically filter and process these events, sending formatted announcements to your Discord server.

## Security
- Uses Ko-Fi verification tokens to ensure webhook authenticity
- Proper error handling to prevent server crashes
- Input validation and sanitization

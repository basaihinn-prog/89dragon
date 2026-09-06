# Casino Platform API Documentation

**Base URL:** `https://bxbet.asia`
**Generated:** 2025-12-16

---

## Table of Contents

1. [Authentication](#authentication)
2. [Mobile App API](#mobile-app-api)
3. [Admin/Backend API](#adminbackend-api)
4. [Payment Webhooks](#payment-webhooks)
5. [ATM/Terminal API](#atmterminal-api)
6. [Player API](#player-api)
7. [Statistics API](#statistics-api)

---

## Authentication

### Login
```
POST /api/login
POST /api/mobile/login

Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

### Logout
```
POST /api/logout
POST /api/mobile/logout

Headers:
  Authorization: Bearer {token}
```

### Password Management
```
POST /api/password/remind     # Request password reset
POST /api/password/reset      # Reset password with token
```

---

## Mobile App API

**Base Path:** `/api/mobile/*`
**Authentication:** JWT token (no IP check required)

### Games

#### List All Games
```
GET /api/mobile/games

Query Parameters:
  - category: string (optional)
  - search: string (optional)
  - sort: string (optional) - 'popular', 'new', 'rtp'
  - limit: integer (optional)
  - page: integer (optional)

Response:
{
  "games": [
    {
      "id": 1,
      "name": "BookOfNileNG",
      "title": "Book of Nile",
      "provider": "NG",
      "category": "slots",
      "rtp": 96.5,
      "thumbnail": "url",
      "jackpot_contribution": 0.01
    }
  ],
  "total": 14177,
  "page": 1
}
```

#### Get Game Details
```
GET /api/mobile/games/{name}

Example: GET /api/mobile/games/BookOfNileNG

Response:
{
  "id": 1,
  "name": "BookOfNileNG",
  "title": "Book of Nile",
  "description": "...",
  "rtp": 96.5,
  "lines": 10,
  "min_bet": 0.1,
  "max_bet": 100,
  "provider": "NG"
}
```

#### Launch Game
```
GET /api/mobile/games/{name}/launch

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - demo: boolean (optional) - Launch in demo mode

Response:
{
  "url": "https://bxbet.asia/game/BookOfNileNG?api_token=...",
  "session_id": "abc123",
  "balance": 1000.50
}
```

#### Game Categories
```
GET /api/mobile/games/categories

Response:
{
  "categories": [
    { "id": 1, "name": "Slots", "count": 13373 },
    { "id": 2, "name": "Fish Games", "count": 514 },
    { "id": 3, "name": "Table Games", "count": 290 }
  ]
}
```

### User Profile

#### Get Profile
```
GET /api/mobile/profile

Headers:
  Authorization: Bearer {token}

Response:
{
  "id": 1,
  "username": "player123",
  "email": "player@example.com",
  "balance": 1000.50,
  "currency": "USD",
  "shop_id": 19,
  "vip_level": 3,
  "total_deposits": 5000.00,
  "total_withdrawals": 2000.00,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### Update Password
```
POST /api/mobile/password/change

Headers:
  Authorization: Bearer {token}

Body:
{
  "current_password": "old_password",
  "new_password": "new_password",
  "new_password_confirmation": "new_password"
}
```

#### Refresh Balance
```
GET /api/mobile/balance/refresh

Headers:
  Authorization: Bearer {token}

Response:
{
  "balance": 1000.50,
  "currency": "USD",
  "timestamp": "2025-12-16T12:00:00Z"
}
```

### Transactions

#### Get Transaction History
```
GET /api/mobile/transactions

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - type: string (optional) - 'deposit', 'withdraw', 'bet', 'win'
  - from: date (optional)
  - to: date (optional)
  - page: integer (optional)

Response:
{
  "transactions": [
    {
      "id": 123,
      "type": "deposit",
      "amount": 100.00,
      "status": "completed",
      "created_at": "2025-12-16T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1
}
```

### Withdrawals

#### Request Withdrawal
```
POST /api/mobile/withdraw/request

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 100.00,
  "method": "paypal",  // or 'bitcoin', 'bank_transfer', etc.
  "account": "user@paypal.com"  // Payment method specific
}

Response:
{
  "success": true,
  "withdrawal_id": 456,
  "status": "pending",
  "amount": 100.00,
  "estimated_completion": "2025-12-17T12:00:00Z"
}
```

#### Get Withdrawal History
```
GET /api/mobile/withdraw/history

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - status: string (optional) - 'pending', 'approved', 'rejected', 'completed'
  - page: integer (optional)

Response:
{
  "withdrawals": [
    {
      "id": 456,
      "amount": 100.00,
      "method": "paypal",
      "status": "pending",
      "requested_at": "2025-12-16T10:00:00Z",
      "processed_at": null
    }
  ],
  "total": 10,
  "page": 1
}
```

### Deposits

#### Initiate Deposit
```
POST /api/mobile/deposit/initiate

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 100.00,
  "method": "coinpayment",  // or 'btcpayserver', 'interkassa', 'coinbase'
  "currency": "USD"
}

Response:
{
  "success": true,
  "transaction_id": "abc123",
  "payment_url": "https://payment-gateway.com/pay/abc123",
  "qr_code": "base64_encoded_qr_code",
  "amount": 100.00,
  "crypto_amount": "0.00245 BTC"
}
```

### Bonuses

#### Available Bonuses
```
GET /api/mobile/bonuses/available

Headers:
  Authorization: Bearer {token}

Response:
{
  "bonuses": [
    {
      "type": "welcome",
      "title": "Welcome Bonus",
      "description": "100% match up to $500",
      "available": true,
      "expires_at": "2025-12-31T23:59:59Z"
    },
    {
      "type": "daily",
      "title": "Daily Login Reward",
      "amount": 10.00,
      "available": true
    }
  ]
}
```

#### Welcome Bonus
```
GET /api/mobile/welcome-bonus

Headers:
  Authorization: Bearer {token}

Response:
{
  "available": true,
  "bonus_amount": 500.00,
  "wagering_requirement": 5000.00,
  "expires_at": "2025-12-31T23:59:59Z"
}
```

#### SMS Bonus
```
GET /api/mobile/sms-bonus           # Check availability
POST /api/mobile/sms-bonus/claim    # Claim bonus

Body for POST:
{
  "phone_number": "+1234567890",
  "verification_code": "123456"
}
```

#### Daily Rewards
```
GET /api/mobile/daily-rewards/status
POST /api/mobile/daily-rewards/claim

Response for GET:
{
  "day": 3,
  "reward": 50.00,
  "claimed_today": false,
  "streak": 3,
  "next_reward": 75.00
}
```

### Refunds

#### Available Refunds
```
GET /api/mobile/refunds/available

Headers:
  Authorization: Bearer {token}

Response:
{
  "available": true,
  "refund_amount": 50.00,
  "refund_percentage": 10,
  "losses_in_period": 500.00,
  "period": "24h"
}
```

#### Claim Refund
```
POST /api/mobile/refunds/claim

Headers:
  Authorization: Bearer {token}

Response:
{
  "success": true,
  "refund_amount": 50.00,
  "new_balance": 1050.00
}
```

### Loyalty System

#### Get Loyalty Status
```
GET /api/mobile/loyalty

Headers:
  Authorization: Bearer {token}

Response:
{
  "level": 3,
  "points": 1250,
  "points_to_next_level": 250,
  "benefits": [
    "5% cashback",
    "Priority support",
    "Exclusive tournaments"
  ],
  "available_rewards": [
    {
      "id": 1,
      "title": "Free Spins Pack",
      "cost": 500,
      "available": true
    }
  ]
}
```

#### Claim Loyalty Reward
```
POST /api/mobile/loyalty/claim

Headers:
  Authorization: Bearer {token}

Body:
{
  "reward_id": 1
}
```

### Wheel of Fortune

#### Get Wheel Config
```
GET /api/mobile/wheel-fortune/config

Headers:
  Authorization: Bearer {token}

Response:
{
  "available": true,
  "spins_remaining": 3,
  "prizes": [
    { "id": 1, "amount": 10.00, "probability": 0.3 },
    { "id": 2, "amount": 50.00, "probability": 0.2 },
    { "id": 3, "amount": 100.00, "probability": 0.1 }
  ]
}
```

#### Spin Wheel
```
POST /api/mobile/wheel-fortune/spin

Headers:
  Authorization: Bearer {token}

Response:
{
  "success": true,
  "prize": {
    "id": 2,
    "amount": 50.00,
    "type": "cash"
  },
  "new_balance": 1050.00,
  "spins_remaining": 2
}
```

### Favorites

#### Get Favorites
```
GET /api/mobile/favorites

Headers:
  Authorization: Bearer {token}

Response:
{
  "games": [
    { "id": 1, "name": "BookOfNileNG", "title": "Book of Nile" }
  ]
}
```

#### Add to Favorites
```
POST /api/mobile/favorites/add/{game}

Example: POST /api/mobile/favorites/add/BookOfNileNG

Headers:
  Authorization: Bearer {token}
```

#### Remove from Favorites
```
DELETE /api/mobile/favorites/remove/{game}

Headers:
  Authorization: Bearer {token}
```

### Chat Support

#### Get Conversations
```
GET /api/mobile/chat/conversations

Headers:
  Authorization: Bearer {token}

Response:
{
  "conversations": [
    {
      "id": 1,
      "last_message": "How can I help you?",
      "unread_count": 2,
      "updated_at": "2025-12-16T10:00:00Z"
    }
  ]
}
```

#### Get Conversation Messages
```
GET /api/mobile/chat/{conversation}

Headers:
  Authorization: Bearer {token}

Response:
{
  "messages": [
    {
      "id": 1,
      "sender": "support",
      "message": "Hello! How can I help?",
      "created_at": "2025-12-16T10:00:00Z"
    }
  ]
}
```

#### Send Message
```
POST /api/mobile/chat/send

Headers:
  Authorization: Bearer {token}

Body:
{
  "conversation_id": 1,
  "message": "I need help with withdrawal"
}
```

#### Poll for New Messages
```
GET /api/mobile/chat/{conversation}/poll

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - since: timestamp - Get messages after this time

Response:
{
  "new_messages": [...]
}
```

### Tournaments

#### List Tournaments
```
GET /api/mobile/tournaments

Headers:
  Authorization: Bearer {token}

Response:
{
  "tournaments": [
    {
      "id": 1,
      "name": "Weekend Slots Battle",
      "game": "BookOfNileNG",
      "prize_pool": 5000.00,
      "entry_fee": 10.00,
      "players_count": 45,
      "max_players": 100,
      "starts_at": "2025-12-20T00:00:00Z",
      "ends_at": "2025-12-22T23:59:59Z"
    }
  ]
}
```

#### Get Tournament Details
```
GET /api/mobile/tournaments/{id}

Headers:
  Authorization: Bearer {token}

Response:
{
  "id": 1,
  "name": "Weekend Slots Battle",
  "leaderboard": [
    { "rank": 1, "username": "player123", "score": 15000 },
    { "rank": 2, "username": "player456", "score": 12000 }
  ],
  "your_rank": 5,
  "your_score": 8000
}
```

### Sessions

#### Get Active Sessions
```
GET /api/mobile/sessions

Headers:
  Authorization: Bearer {token}

Response:
{
  "sessions": [
    {
      "id": "abc123",
      "game": "BookOfNileNG",
      "started_at": "2025-12-16T10:00:00Z",
      "balance_start": 1000.00,
      "balance_current": 1050.00
    }
  ]
}
```

#### Invalidate Session
```
DELETE /api/mobile/sessions/{id}

Headers:
  Authorization: Bearer {token}
```

### Game Statistics

#### Get Game Activity
```
GET /api/mobile/game-activity

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - period: string - 'today', 'week', 'month'

Response:
{
  "total_bets": 150,
  "total_wins": 75,
  "win_rate": 0.50,
  "biggest_win": 500.00,
  "favorite_game": "BookOfNileNG"
}
```

#### Get Game Stats
```
GET /api/mobile/game-stats

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - game: string (optional) - Specific game name

Response:
{
  "games_played": 50,
  "total_wagered": 5000.00,
  "total_won": 4500.00,
  "profit_loss": -500.00
}
```

### Vouchers

#### Activate Voucher
```
POST /api/mobile/voucher/activate

Headers:
  Authorization: Bearer {token}

Body:
{
  "voucher_code": "WELCOME2025"
}

Response:
{
  "success": true,
  "amount": 100.00,
  "new_balance": 1100.00
}
```

### Jackpots

#### Get Jackpots
```
GET /api/mobile/jackpots

Response:
{
  "jackpots": [
    {
      "id": 1,
      "name": "JPG 1",
      "balance": 15000.00,
      "currency": "USD",
      "shop_id": 19
    }
  ]
}
```

### Notifications

#### Get Notifications
```
GET /api/mobile/notifications

Headers:
  Authorization: Bearer {token}

Response:
{
  "notifications": [
    {
      "id": 1,
      "title": "Withdrawal Approved",
      "message": "Your withdrawal of $100 has been approved",
      "read": false,
      "created_at": "2025-12-16T10:00:00Z"
    }
  ],
  "unread_count": 3
}
```

#### Mark Notification as Read
```
POST /api/mobile/notifications/read/{id}

Headers:
  Authorization: Bearer {token}
```

### App Version Check

#### Check for Updates
```
POST /api/mobile/check-update

Body:
{
  "platform": "android",  // or "ios"
  "current_version": "1.2.3"
}

Response:
{
  "update_available": true,
  "latest_version": "1.3.0",
  "download_url": "https://...",
  "force_update": false
}
```

### Shop Details

#### Get Shop Info
```
GET /api/mobile/shops/{id}

Example: GET /api/mobile/shops/19

Response:
{
  "id": 19,
  "name": "winnamese",
  "currency": "USD",
  "rtp_percent": 90,
  "features": {
    "happy_hours": true,
    "tournaments": true,
    "wheel_fortune": true
  }
}
```

---

## Admin/Backend API

**Base Path:** `/api/*`
**Authentication:** JWT token + IP check middleware

### Users

#### List Users
```
GET /api/users

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - role_id: integer (optional)
  - shop_id: integer (optional)
  - search: string (optional)
  - page: integer (optional)

Response:
{
  "users": [...],
  "total": 500,
  "page": 1
}
```

#### Get User
```
GET /api/users/{user}

Headers:
  Authorization: Bearer {token}
```

#### Create User
```
POST /api/users

Headers:
  Authorization: Bearer {token}

Body:
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password",
  "role_id": 1,
  "shop_id": 19
}
```

#### Create Multiple Users
```
POST /api/users/mass

Headers:
  Authorization: Bearer {token}

Body:
{
  "users": [
    { "username": "user1", "password": "pass1", ... },
    { "username": "user2", "password": "pass2", ... }
  ]
}
```

#### Update User
```
PUT /api/users/{user}
PATCH /api/users/{user}

Headers:
  Authorization: Bearer {token}

Body:
{
  "email": "newemail@example.com",
  "role_id": 2
}
```

#### Delete User
```
DELETE /api/users/{user}

Headers:
  Authorization: Bearer {token}
```

#### Update User Balance
```
PUT /api/users/{user}/balance/{type}

Types: 'add' or 'set'

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 100.00
}
```

### Shops

#### List Shops
```
GET /api/shops

Headers:
  Authorization: Bearer {token}

Response:
{
  "shops": [
    {
      "id": 19,
      "name": "winnamese",
      "balance": 1000.00,
      "currency": "USD",
      "is_blocked": false
    }
  ]
}
```

#### View Shop
```
GET /api/shops/{id}/view

Headers:
  Authorization: Bearer {token}
```

#### Create Shop
```
POST /api/shops/create

Headers:
  Authorization: Bearer {token}

Body:
{
  "name": "newshop",
  "currency": "USD",
  "percent": 90,
  "balance": 1000.00
}
```

#### Update Shop
```
PUT /api/shops/{shop}/update

Headers:
  Authorization: Bearer {token}

Body:
{
  "balance": 5000.00,
  "percent": 95
}
```

#### Delete Shop
```
DELETE /api/shops/{id}/destroy

Headers:
  Authorization: Bearer {token}
```

#### Block/Unblock Shop
```
PUT /api/shops/block
PUT /api/shops/unblock

Headers:
  Authorization: Bearer {token}

Body:
{
  "shop_id": 19
}
```

#### Update Shop Balance
```
PUT /api/shops/{shop}/balance/{type}

Types: 'add' or 'set'

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 1000.00
}
```

#### Get Shop Admin
```
POST /api/shops/admin

Headers:
  Authorization: Bearer {token}

Body:
{
  "shop_id": 19
}
```

#### Get Supported Currencies
```
GET /api/shops/currency

Response:
{
  "currencies": ["USD", "EUR", "GBP", "BTC", "mBTC", ...]
}
```

### Games

#### List Games
```
GET /api/games

Headers:
  Authorization: Bearer {token}

Response:
{
  "games": [...]
}
```

### Jackpots

#### List Jackpots
```
GET /api/jackpots

Headers:
  Authorization: Bearer {token}

Response:
{
  "jackpots": [...]
}
```

### Happy Hours

#### List Happy Hours
```
GET /api/happyhours

Headers:
  Authorization: Bearer {token}

Response:
{
  "happy_hours": [
    {
      "id": 1,
      "multiplier": 2.0,
      "start_time": "18:00",
      "end_time": "20:00",
      "days": ["monday", "friday"]
    }
  ]
}
```

### Categories

#### List Categories
```
GET /api/category

Headers:
  Authorization: Bearer {token}

Response:
{
  "categories": [...]
}
```

### Pin Codes

#### List Pin Codes
```
GET /api/pincodes

Headers:
  Authorization: Bearer {token}
```

#### Create Pin Code
```
POST /api/pincodes/store

Headers:
  Authorization: Bearer {token}

Body:
{
  "code": "PIN12345",
  "amount": 100.00,
  "shop_id": 19
}
```

#### Create Multiple Pin Codes
```
POST /api/pincodes/mass

Headers:
  Authorization: Bearer {token}

Body:
{
  "count": 100,
  "amount": 50.00,
  "shop_id": 19
}
```

#### Check Pin Code
```
POST /api/pincodes/check

Headers:
  Authorization: Bearer {token}

Body:
{
  "code": "PIN12345"
}

Response:
{
  "valid": true,
  "amount": 100.00,
  "used": false
}
```

#### Update Pin Code
```
PUT /api/pincodes/{pincode}/update

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 150.00
}
```

#### Delete Pin Code
```
DELETE /api/pincodes/{pincode}/destroy

Headers:
  Authorization: Bearer {token}
```

### Statistics

#### Game Statistics
```
GET /api/stats/game

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - shop_id: integer (optional)
  - game_id: integer (optional)
  - from: date (optional)
  - to: date (optional)

Response:
{
  "stats": {
    "total_bets": 10000,
    "total_wins": 9500,
    "house_profit": 500.00,
    "unique_players": 150
  }
}
```

#### Payment Statistics
```
GET /api/stats/pay

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - shop_id: integer (optional)
  - type: string - 'in' or 'out'
  - from: date (optional)
  - to: date (optional)

Response:
{
  "stats": {
    "total_deposits": 50000.00,
    "total_withdrawals": 30000.00,
    "net_revenue": 20000.00,
    "transaction_count": 500
  }
}
```

#### Shift Statistics
```
GET /api/stats/shift

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - shift_id: integer (optional)

Response:
{
  "shift": {
    "id": 1,
    "cashier_id": 123,
    "started_at": "2025-12-16T08:00:00Z",
    "ended_at": "2025-12-16T16:00:00Z",
    "deposits": 5000.00,
    "withdrawals": 2000.00
  }
}
```

### Shifts

#### Get Shift Info
```
GET /api/shifts/info

Headers:
  Authorization: Bearer {token}

Response:
{
  "shift": {
    "id": 1,
    "status": "open",
    "started_at": "2025-12-16T08:00:00Z",
    "current_balance": 5000.00
  }
}
```

#### Start Shift
```
PUT /api/shifts/start

Headers:
  Authorization: Bearer {token}

Body:
{
  "starting_balance": 1000.00
}
```

### Profile

#### Get My Profile
```
GET /api/me

Headers:
  Authorization: Bearer {token}

Response:
{
  "user": {...},
  "permissions": [...]
}
```

#### Update My Details
```
PATCH /api/me/details

Headers:
  Authorization: Bearer {token}

Body:
{
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

#### Update My Balance
```
POST /api/me/balance

Headers:
  Authorization: Bearer {token}

Body:
{
  "amount": 100.00,
  "type": "add"
}
```

#### Get My Refunds
```
GET /api/me/refund

Headers:
  Authorization: Bearer {token}

Response:
{
  "available_refund": 50.00,
  "losses_in_period": 500.00
}
```

### Credits (Cashier Operations)

#### List Credits
```
GET /api/credits

Headers:
  Authorization: Bearer {token}
```

#### Deposit via USB
```
GET /api/credits/depositusb

Headers:
  Authorization: Bearer {token}

Query Parameters:
  - amount: number
  - user_id: integer
```

#### Pending Deposits
```
GET /api/credits/pending-depositusb

Headers:
  Authorization: Bearer {token}
```

### Cashier Operations

#### Read Shop Balance
```
GET /api/cashier/readbalance

Headers:
  Authorization: Bearer {token}

Response:
{
  "balance": 10000.00,
  "currency": "USD"
}
```

#### Read Deposit Amounts
```
GET /api/cashier/readinamounts

Headers:
  Authorization: Bearer {token}

Response:
{
  "amounts": [10, 20, 50, 100, 200, 500]
}
```

### Payment Systems

#### List Available Payment Systems
```
GET /api/paysystems

Response:
{
  "paysystems": [
    {
      "id": "coinpayment",
      "name": "CoinPayment",
      "enabled": true,
      "currencies": ["BTC", "ETH", "USDT"]
    },
    {
      "id": "btcpayserver",
      "name": "BTCPay Server",
      "enabled": true,
      "currencies": ["BTC"]
    }
  ]
}
```

### SMS

#### Send SMS
```
POST /api/sms

Headers:
  Authorization: Bearer {token}

Body:
{
  "phone": "+1234567890",
  "message": "Your verification code is 123456"
}
```

### Demo Mode

#### Create Demo User
```
POST /api/demo

Body:
{
  "shop_id": 19
}

Response:
{
  "username": "demo_abc123",
  "password": "generated_password",
  "token": "JWT_TOKEN"
}
```

#### Create Trial Agent
```
POST /api/agent/trial

Body:
{
  "shop_id": 19
}
```

---

## Payment Webhooks

### CoinPayment IPN
```
POST /coinpayment/ipn

Headers:
  HMAC: {signature}

Body:
{
  "ipn_mode": "hmac",
  "merchant": "your_merchant_id",
  "txn_id": "transaction_id",
  "status": 100,
  "status_text": "Complete",
  "amount1": "100.00",
  "amount2": "0.00245",
  "currency1": "USD",
  "currency2": "BTC",
  "buyer_name": "John Doe"
}

Response: (must return "IPN OK")
```

### BTCPay Server Webhook
```
POST /payment/btcpayserver/result

Body:
{
  "invoiceId": "abc123",
  "type": "InvoiceSettled",
  "orderId": "order_123",
  "amount": "100.00",
  "currency": "USD"
}

Response:
{
  "success": true
}
```

### Coinbase Webhook
```
POST /payment/coinbase/result

Headers:
  X-CC-Webhook-Signature: {signature}

Body:
{
  "event": {
    "type": "charge:confirmed",
    "data": {
      "code": "abc123",
      "pricing": {
        "local": { "amount": "100.00", "currency": "USD" }
      }
    }
  }
}

Response:
{
  "success": true
}
```

### Interkassa Webhook
```
POST /payment/interkassa/result

Body:
{
  "ik_co_id": "shop_id",
  "ik_pm_no": "payment_id",
  "ik_inv_id": "invoice_id",
  "ik_inv_st": "success",
  "ik_am": "100.00",
  "ik_cur": "USD",
  "ik_sign": "signature_hash"
}

Response:
{
  "success": true
}
```

### SMS Callback
```
POST /sms/callback

Body:
{
  "phone": "+1234567890",
  "status": "delivered",
  "message_id": "msg_123"
}

Response:
{
  "success": true
}
```

---

## ATM/Terminal API

### Unified ATM Controller
```
POST /api/V2

Headers:
  Content-Type: application/json

Body:
{
  "action": "login",
  "username": "terminal_user",
  "password": "terminal_pass"
}

Response:
{
  "success": true,
  "session_id": "abc123",
  "balance": 1000.00
}

Available Actions:
- "login" - Authenticate ATM user
- "balance" - Get balance
- "deposit" - Add credits
- "withdraw" - Cash out
- "games" - List available games
- "launch_game" - Start game session
- "close_session" - End game session
```

---

## Player API (Legacy)

### API Login
```
GET /api/player/apilogin/{token}

Response:
{
  "success": true,
  "user": {...}
}
```

### Get User Data
```
GET /api/player/read

Query Parameters:
  - user_id: integer

Response:
{
  "user": {...},
  "balance": 1000.00
}
```

### Check User Login
```
GET /api/player/check-user-login

Query Parameters:
  - username: string

Response:
{
  "logged_in": true,
  "last_activity": "2025-12-16T10:00:00Z"
}
```

### Test Login (Sync)
```
GET /api/player/testlogin

Query Parameters:
  - username: string
  - password: string

Response:
{
  "success": true,
  "token": "..."
}
```

### Check User Score
```
GET /api/player/score

Query Parameters:
  - user_id: integer

Response:
{
  "balance": 1000.00,
  "total_wins": 5000.00,
  "total_bets": 4500.00
}
```

### Check User Online Status
```
GET /api/player/isonline

Query Parameters:
  - user_id: integer

Response:
{
  "online": true,
  "last_seen": "2025-12-16T10:00:00Z"
}
```

### Payout Ticket
```
GET /api/player/withdrawticket

Query Parameters:
  - ticket_id: string

Response:
{
  "success": true,
  "amount": 100.00,
  "status": "paid"
}
```

### License Operations
```
GET /api/player/getlic          # Request license
POST /api/player/licsaved       # Save license

Body for POST:
{
  "license_key": "xxx-xxx-xxx-xxx"
}
```

---

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "status": 400
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions or IP blocked)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

**Validation Error Response:**
```json
{
  "error": true,
  "message": "Validation failed",
  "errors": {
    "username": ["The username field is required."],
    "email": ["The email must be a valid email address."]
  },
  "status": 422
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Mobile API:** 60 requests per minute per user
- **Admin API:** 120 requests per minute per user
- **Public endpoints:** 30 requests per minute per IP

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1734361200
```

---

## Authentication Details

### JWT Token Format

Tokens are returned in the `token` field and must be included in the `Authorization` header:

```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Token Expiration:** 60 minutes (configurable)

**Token Refresh:** Not currently supported - must re-login after expiration

---

## CORS Policy

The API supports CORS for cross-origin requests:

**Allowed Origins:** `*` (all origins)
**Allowed Methods:** `GET, POST, PUT, DELETE, OPTIONS, PATCH`
**Allowed Headers:** `Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key`
**Exposed Headers:** `Authorization, X-Total-Count`

---

## Testing

### Test Credentials

**Demo User:**
```
Username: demo
Password: (generated on /api/demo request)
```

**Test Shop:** ID 19 (winnamese)

### Example cURL Requests

**Login:**
```bash
curl -X POST https://bxbet.asia/api/mobile/login \
  -H "Content-Type: application/json" \
  -d '{"username":"winnamese","password":"your_password"}'
```

**Get Games (with auth):**
```bash
curl -X GET https://bxbet.asia/api/mobile/games \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Request Withdrawal:**
```bash
curl -X POST https://bxbet.asia/api/mobile/withdraw/request \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"method":"paypal","account":"user@paypal.com"}'
```

---

## Support

For API support or questions:
- Check Laravel logs: `/casino/storage/logs/laravel.log`
- Check game session logs: `/casino/storage/logs/{GameName}Internal.log`
- WebSocket server logs: `pm2 logs`

---

**Documentation Version:** 1.0
**Last Updated:** 2025-12-16
**Platform Version:** Laravel 11 / VanguardLTE

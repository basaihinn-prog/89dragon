# Database Access Guide for Mobile App
## VanguardLTE Casino Platform

---

## 🎯 Recommended Approach: Use REST API

**Your mobile app is already configured to use the same database through the REST API.**

### Architecture Flow

```
┌─────────────┐      HTTPS/WSS      ┌──────────────┐      MySQL      ┌──────────────┐
│  Mobile App │ ─────────────────► │   Laravel    │ ──────────────► │   Database   │
│             │   JWT Token Auth   │   REST API   │   Secure Query  │              │
└─────────────┘                     └──────────────┘                  └──────────────┘
```

### Database Details

**Database Name:** `sql_cashout_realconnect_online`
**Table Prefix:** `w_`
**Total Tables:** 76
**Host:** `127.0.0.1` (localhost)
**Port:** `3306` (default MySQL)

---

## 📋 Key Database Tables for Mobile App

### User Management
- `w_users` - User accounts, authentication, balance
- `w_roles` - User roles (admin, agent, user, etc.)
- `w_sessions` - Active user sessions

### Games
- `w_games` - Game catalog
- `w_categories` - Game categories
- `w_game_log` - Game play history and results

### Banking
- `w_game_bank` - Slot game banking/jackpots
- `w_fish_bank` - Arcade game banking
- `w_jpg` - Jackpot pools

### Transactions
- `w_credits` - User credit transactions
- `w_coinpayment_transactions` - Payment transactions

### Configuration
- `w_settings` - Application settings
- `w_api_keys` - API keys for mobile access

---

## 🔐 How Mobile App Accesses Data

### 1. Through REST API (Recommended)

The mobile app makes HTTPS requests to Laravel API endpoints, which handle all database operations securely.

**Example: Get User Balance**

```javascript
// Mobile App Code
const response = await fetch('https://bxbet.asia/api/me/balance', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Balance:', data.balance);
```

**Behind the scenes (Laravel API):**
```php
// Laravel automatically queries database
$user = Auth::user();
$balance = $user->balance;

// Returns JSON response
return response()->json([
    'balance' => $balance,
    'currency' => 'USD'
]);
```

### 2. WebSocket Real-time Data

For game data, WebSocket servers (Arcade, Slots) connect to database directly:

```javascript
// Mobile App connects via WebSocket
const ws = new WebSocket('wss://bxbet.asia:22180/arcade');

// WebSocket server queries database for game state
// Returns real-time game updates
```

**WebSocket Server Database Access:**
- Uses Node.js `mysql2` package
- Connects to same database
- Reads/writes game state, balances

---

## 🛡️ Database Security

### Current Security Measures

1. **No Direct Access** - Mobile apps cannot connect directly to database
2. **API Layer** - All requests go through Laravel API with:
   - JWT authentication
   - Input validation
   - SQL injection protection
   - Rate limiting
   - HTTPS encryption

3. **Database User Permissions** - Main user has full access (needed for game logic)

---

## 📊 Optional: Read-Only Database User

If you need **analytics, reporting, or monitoring** from mobile app (not recommended for production data):

### Create Read-Only User

```sql
-- Create read-only user for analytics
CREATE USER 'mobile_readonly'@'%' IDENTIFIED BY 'SecurePassword123!';

-- Grant SELECT only on specific tables
GRANT SELECT ON sql_cashout_realconnect_online.w_games TO 'mobile_readonly'@'%';
GRANT SELECT ON sql_cashout_realconnect_online.w_categories TO 'mobile_readonly'@'%';
GRANT SELECT ON sql_cashout_realconnect_online.w_game_log TO 'mobile_readonly'@'%';

FLUSH PRIVILEGES;
```

**Connection String:**
```
Host: bxbet.asia
Port: 3306
Database: sql_cashout_realconnect_online
Username: mobile_readonly
Password: SecurePassword123!
```

⚠️ **Warning:** Only use read-only access for non-critical data like leaderboards, stats, etc.

---

## 🔄 Database Schema Reference

### Essential Tables Schema

#### w_users
```sql
id              INT PRIMARY KEY
username        VARCHAR(255)
email           VARCHAR(255)
password        VARCHAR(255) -- hashed
balance         DECIMAL(20,6)
role_id         INT
shop_id         INT
status          ENUM('Active', 'Blocked')
created_at      TIMESTAMP
```

#### w_games
```sql
id              INT PRIMARY KEY
name            VARCHAR(255) -- e.g., 'BugsParadise100VP'
title           VARCHAR(255) -- Display name
gamebank        VARCHAR(50)  -- 'fish' or 'slot'
device          VARCHAR(50)  -- 'desktop,mobile'
view            INT          -- Play count
```

#### w_game_log
```sql
id              INT PRIMARY KEY
user_id         INT
game_id         INT
bet             DECIMAL(20,6)
win             DECIMAL(20,6)
balance         DECIMAL(20,6)
shop_id         INT
created_at      TIMESTAMP
```

#### w_credits
```sql
id              INT PRIMARY KEY
user_id         INT
type            VARCHAR(50)  -- 'add', 'out'
sum             DECIMAL(20,6)
balance         DECIMAL(20,6)
created_at      TIMESTAMP
```

---

## 💻 Database Connection Examples

### If You Absolutely Need Direct Access

**⚠️ NOT RECOMMENDED for production mobile apps** - Use API instead!

#### Node.js (for backend services)

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'sql_cashout_realconnect_online',
  password: '29d0e9b83561c',
  database: 'sql_cashout_realconnect_online',
  waitForConnections: true,
  connectionLimit: 10
});

// Query example
const [rows] = await pool.query('SELECT * FROM w_games WHERE gamebank = ?', ['fish']);
console.log(rows);
```

#### PHP (Laravel already handles this)

```php
// In Laravel, use Eloquent ORM
$games = DB::table('games') // Automatically prefixed as w_games
    ->where('gamebank', 'fish')
    ->get();

// Or use models
$user = User::find($userId);
$balance = $user->balance;
```

#### Python (for analytics/tools)

```python
import mysql.connector

db = mysql.connector.connect(
    host="127.0.0.1",
    user="sql_cashout_realconnect_online",
    password="29d0e9b83561c",
    database="sql_cashout_realconnect_online"
)

cursor = db.cursor()
cursor.execute("SELECT * FROM w_games")
games = cursor.fetchall()
```

---

## 📱 Mobile App Data Flow Examples

### Example 1: User Login & Balance

```javascript
// Step 1: Mobile app sends login request
POST /api/login
{
  "username": "player1",
  "password": "password123"
}

// Step 2: Laravel API queries database
// Query: SELECT * FROM w_users WHERE username = 'player1'
// Verifies password hash
// Generates JWT token

// Step 3: Returns token + user data
{
  "token": "eyJ0eXAi...",
  "user": {
    "id": 123,
    "username": "player1",
    "balance": 1000.50
  }
}

// Step 4: Mobile app stores token
localStorage.setItem('jwt_token', token);
```

### Example 2: Play Arcade Game

```javascript
// Step 1: Get game list from API
const games = await fetch('/api/games');
// Laravel queries: SELECT * FROM w_games

// Step 2: Connect to WebSocket
const ws = new WebSocket('wss://bxbet.asia:22180/arcade');

// Step 3: WebSocket server authenticates
// Queries: SELECT * FROM w_users WHERE id = ?

// Step 4: Game actions update database
// WebSocket server writes to:
// - w_game_log (game results)
// - w_users (update balance)
// - w_fish_bank (jackpot amounts)
```

### Example 3: Transaction History

```javascript
// Mobile app requests transaction history
GET /api/credits

// Laravel API queries:
// SELECT * FROM w_credits WHERE user_id = ? ORDER BY created_at DESC LIMIT 50

// Returns formatted data
{
  "transactions": [
    {
      "type": "add",
      "amount": 100.00,
      "balance": 1100.50,
      "date": "2025-12-01 10:30:00"
    }
  ]
}
```

---

## 🔍 Database Monitoring & Analytics

### View Active Connections

```sql
SHOW PROCESSLIST;
```

### Check Table Sizes

```sql
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'sql_cashout_realconnect_online'
    AND table_name LIKE 'w_%'
ORDER BY (data_length + index_length) DESC;
```

### Monitor Game Activity

```sql
SELECT
    g.name,
    COUNT(*) as plays,
    SUM(gl.bet) as total_bet,
    SUM(gl.win) as total_win
FROM w_game_log gl
JOIN w_games g ON gl.game = g.name
WHERE DATE(gl.created_at) = CURDATE()
GROUP BY g.name
ORDER BY plays DESC
LIMIT 10;
```

---

## 🚀 Best Practices

### For Mobile App Development

1. ✅ **Always use REST API** for data access
2. ✅ **Store JWT tokens securely** (SecureStorage, KeyChain)
3. ✅ **Never store database credentials** in mobile app
4. ✅ **Use WebSocket** for real-time game data
5. ✅ **Implement proper error handling** for API failures
6. ✅ **Cache data locally** when appropriate
7. ✅ **Respect rate limits** on API calls

### For Database Operations

1. ✅ **Use prepared statements** (Laravel does this automatically)
2. ✅ **Validate all input** before database queries
3. ✅ **Use transactions** for critical operations (balance updates)
4. ✅ **Index frequently queried columns**
5. ✅ **Monitor slow queries**
6. ✅ **Regular backups** (database backups exist in root directory)

---

## 🛠️ Troubleshooting

### Mobile App Can't Fetch Data

1. **Check API endpoint** - Ensure correct URL
2. **Verify JWT token** - Token might be expired
3. **Check network** - HTTPS required, no mixed content
4. **Review API logs** - Laravel logs: `casino/storage/logs/laravel.log`

### WebSocket Connection Issues

1. **Port accessibility** - Ports 22150, 22180, 22190 must be open
2. **SSL certificate** - Must be valid for wss:// connections
3. **Authentication** - Send CheckAuth command after connect
4. **Monitor logs** - `pm2 logs Arcade --lines 50`

### Database Performance

1. **Slow queries** - Check MySQL slow query log
2. **Too many connections** - Adjust connection pool settings
3. **Large tables** - Archive old game_log entries

---

## 📞 Summary

### ✅ What's Already Set Up

- ✅ REST API connects to database automatically
- ✅ WebSocket servers connect to database for real-time data
- ✅ JWT authentication secures all API access
- ✅ Database has 76 tables with all necessary data
- ✅ Table prefix `w_` separates app data

### 🎯 Mobile App Should

- Use REST API for user data, games, transactions
- Use WebSocket for real-time game play
- Store JWT token securely
- NEVER connect directly to database

### 📁 Connection Already Configured In

- Laravel: `casino/.env` (DB credentials)
- WebSocket: `PTWebSocket/Arcade.js`, `Server.js`, `Slots.js`
- Mobile API: Uses Laravel's database connection

**Your mobile app has full access to all data through the secure REST API!** 🎉

# Mobile API Documentation
## VanguardLTE Casino Platform

**Base URL:** `https://bxbet.asia`
**API Version:** v1
**Generated:** <?php echo date('Y-m-d H:i:s'); ?>

---

## 📱 Quick Start

### 1. Authentication Flow

```javascript
// Login to get JWT token
const response = await fetch('https://bxbet.asia/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    username: 'player1',
    password: 'password123'
  })
});

const data = await response.json();
const jwtToken = data.token;

// Store token securely
localStorage.setItem('jwt_token', jwtToken);
```

### 2. Making API Requests

```javascript
// Get user profile
const profile = await fetch('https://bxbet.asia/api/me', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Accept': 'application/json'
  }
});

// Get games list
const games = await fetch('https://bxbet.asia/api/games', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Accept': 'application/json'
  }
});
```

### 3. WebSocket Connection

```javascript
// Connect to Arcade games WebSocket
const ws = new WebSocket('wss://bxbet.asia:22180/arcade');

ws.onopen = () => {
  console.log('WebSocket connected');

  // Authenticate
  ws.send(JSON.stringify({
    command: 'CheckAuth'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

---

## 🔐 API Keys

### Generated API Keys

**Production:**
```
XwZLCzYHh44zLCQgebMzuOdJdy5Zs8TLETgnmgxKbLI77PhoYL8hg2PYyiO4OVHy
```

**Development:**
```
j5VkzT5A8ikNICicxkTENKC4RAjFZPra0loFFVwYyOQcAyVRxCiRJQzjhE9XPxTl
```

**Testing:**
```
uGsRd4jw5h1aoZ4IAIhcLAD6V8u9ofGEcXcn7Ur7PnqzvFfMsv1S7fcjotpLt3EA
```

### Usage

Include API key in requests (optional, JWT is primary authentication):

```javascript
headers: {
  'X-API-Key': 'your_api_key_here',
  'Authorization': `Bearer ${jwtToken}`
}
```

---

## 🌐 API Endpoints

### Authentication

#### Login
**POST** `/api/login`

```json
Request:
{
  "username": "player1",
  "password": "password123"
}

Response:
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJI...",
  "user": {
    "id": 123,
    "username": "player1",
    "email": "player@example.com",
    "balance": 1000.50
  }
}
```

#### Logout
**POST** `/api/logout`

Headers: `Authorization: Bearer {token}`

#### Get Current User
**GET** `/api/me`

Headers: `Authorization: Bearer {token}`

```json
Response:
{
  "id": 123,
  "username": "player1",
  "email": "player@example.com",
  "balance": 1000.50,
  "role": "user",
  "shop_id": 1
}
```

---

### Games

#### Get Games List
**GET** `/api/games`

Query parameters:
- `category` (optional) - Filter by category ID
- `search` (optional) - Search by game name
- `limit` (optional) - Limit results (default: 50)

```json
Response:
{
  "games": [
    {
      "id": 1,
      "name": "BugsParadise100VP",
      "title": "Bugs Paradise 100",
      "gamebank": "fish",
      "device": "desktop,mobile",
      "view": 1234
    }
  ]
}
```

#### Get Categories
**GET** `/api/category`

```json
Response:
{
  "categories": [
    {
      "id": 1,
      "title": "Arcade Games",
      "position": 1
    }
  ]
}
```

#### Get Jackpots
**GET** `/api/jackpots`

```json
Response:
{
  "jackpots": [
    {
      "id": 1,
      "name": "Mega Jackpot",
      "balance": 50000.00,
      "shop_id": 0
    }
  ]
}
```

---

### User Profile

#### Update Profile
**PATCH** `/api/me/details`

```json
Request:
{
  "email": "newemail@example.com",
  "phone": "1234567890"
}
```

#### Get Balance
**POST** `/api/me/balance`

```json
Response:
{
  "balance": 1000.50,
  "currency": "USD"
}
```

#### Get Refunds
**GET** `/api/me/refund`

---

### Transactions

#### Get Credits History
**GET** `/api/credits`

#### Deposit
**GET** `/api/credits/depositusb`

Query parameters:
- `amount` - Deposit amount
- `method` - Payment method

---

## 🎮 WebSocket Servers

### Slots Server

- **URL:** `wss://bxbet.asia:22150/slots`
- **Port:** 22150
- **SSL:** Required
- **Games:** Slot machines

#### Connection Example

```javascript
const slotsWS = new WebSocket('wss://bxbet.asia:22150/slots');

slotsWS.onopen = () => {
  // Send authentication
  slotsWS.send(JSON.stringify({
    command: 'CheckAuth',
    userId: userId,
    sessionId: sessionId
  }));
};
```

### Arcade Server

- **URL:** `wss://bxbet.asia:22180/arcade`
- **Port:** 22180
- **SSL:** Required
- **Games:** Fish/Arcade games (BirdHunter, BugsParadise, etc.)

#### Supported Games

- BirdHunterVP
- BirdHunter10000VP
- BugsParadise100VP
- BugsParadise10000VP
- BuffaloThunderVP
- FirePhoenixVP
- FishHunterKA
- GoldenDragonKA

#### Message Format

```javascript
// Login
{
  "type": "login",
  "message": {
    "uid": userId
  }
}

// Fire (shoot)
{
  "type": "fire",
  "message": {
    "gunid": 1,
    "bulletid": 12345
  }
}

// Hit (catch fish)
{
  "type": "hit",
  "message": {
    "fblist": [{
      "bulletid": 12345,
      "fishids": [1, 2, 3],
      "fishpids": [10, 11, 12]
    }]
  }
}
```

### Server (Alternative)

- **URL:** `wss://bxbet.asia:22190/server`
- **Port:** 22190
- **SSL:** Required

---

## 🔧 Configuration Files

### Arcade Config

**URL:** `https://bxbet.asia/arcade_config.json`

```json
{
  "port": "22180/arcade",
  "host": "bxbet.asia",
  "prefix": "https://",
  "host_ws": "bxbet.asia",
  "prefix_ws": "wss://",
  "ssl": true,
  "timezone": "Asia/Manila"
}
```

### Mobile App Config

**URL:** `https://bxbet.asia/mobile_api_config.json`

Contains complete mobile app configuration including all endpoints and settings.

---

## 📊 Game Launch Flow

### 1. Get Game List
```javascript
const games = await fetch('/api/games');
```

### 2. Select Game
```javascript
const selectedGame = games.find(g => g.name === 'BugsParadise100VP');
```

### 3. Connect to WebSocket
```javascript
const gameType = selectedGame.gamebank; // 'fish' for arcade games
const wsUrl = gameType === 'fish'
  ? 'wss://bxbet.asia:22180/arcade'
  : 'wss://bxbet.asia:22150/slots';

const ws = new WebSocket(wsUrl);
```

### 4. Authenticate Game Session
```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'login',
    message: {
      uid: userId
    }
  }));
};
```

### 5. Play Game
```javascript
// Game-specific messages
ws.send(JSON.stringify({
  type: 'fire',
  message: { ... }
}));
```

---

## 🛡️ Security Best Practices

### 1. Token Storage

```javascript
// ✅ Good - Use secure storage
import SecureStore from 'react-native-secure-storage';
await SecureStore.setItemAsync('jwt_token', token);

// ❌ Bad - Don't use AsyncStorage for tokens
AsyncStorage.setItem('jwt_token', token); // Insecure!
```

### 2. HTTPS Only

```javascript
// Always use HTTPS
const baseURL = 'https://bxbet.asia';

// Never use HTTP
const badURL = 'http://bxbet.asia'; // ❌
```

### 3. Token Refresh

```javascript
// Refresh token before expiry
const tokenExpiry = jwt_decode(token).exp;
const now = Date.now() / 1000;

if (tokenExpiry - now < 300) { // 5 minutes before expiry
  await refreshToken();
}
```

### 4. Error Handling

```javascript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, re-login
      await handleReLogin();
    } else if (response.status === 419) {
      // CSRF error, refresh page/session
      await refreshSession();
    }
  }

  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

---

## 📱 Platform-Specific Examples

### React Native

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bxbet.asia/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const games = await api.get('/games');
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const baseUrl = 'https://bxbet.asia/api';

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password
      })
    );

    return jsonDecode(response.body);
  }

  Future<List> getGames(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/games'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json'
      }
    );

    return jsonDecode(response.body)['games'];
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Solution:** Server already configured with CORS headers. Ensure you're using HTTPS.

#### 2. WebSocket Connection Failed

**Checks:**
- Verify SSL certificate is valid
- Ensure port 22180/22150/22190 is accessible
- Check firewall rules

```javascript
ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
  // Try reconnecting after delay
  setTimeout(() => reconnect(), 3000);
};
```

#### 3. 419 CSRF Token Mismatch

**Solution:** Clear app cache/data and re-login

#### 4. 401 Unauthorized

**Solution:** Token expired, refresh or re-login

```javascript
if (response.status === 401) {
  await reLogin();
}
```

---

## 📞 Support

For API issues or questions:
- Check server logs: `pm2 logs Arcade`
- Monitor WebSocket: Browser DevTools → Network → WS
- API errors: Check response headers and body

---

## 🔄 Version History

### v1.0.0 (Current)
- Initial mobile API release
- JWT authentication
- WebSocket support for arcade games
- Game management endpoints
- User profile management

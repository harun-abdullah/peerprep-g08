## PeerPrep Matching Service
This service is a real-time microservice responsible for pairing users based on their programming language, difficulty level, and topic category. 
It uses **WebSockets (Socket.IO)** for bi-directional communication and **Redis** for managing the waiting queues.

## How it works
The matching service listens on port **3002**. It handles real-time matching requests and manages the matching lifecycle.
- Pair users immediately when matching criteria (userID, language[], topics[], difficulty) are met.
- Relaxes based on difficulty after 30s, Relaxes based on topic after 60s.
- Automatically removes users from the queue if no match is found within **120 seconds**.
- Automatically cleans up "ghost sockets" if a user disconnects before finding a match.

## Set-Up
1. Install Dependencies
In the `matching-service` folder:
npm install


2. Config Env Variables
Create `.env` file in the `matching-service` folder:

PORT=3002
REDIS_HOST=localhost
REDIS_PORT=6379


## Running the service
Run:
```bash
node index.js
```

Ensure that you run in this sequence:
1. Redis (Port 6379)
2. Matching Service (Port 3002)
3. API Gateway (Port 3000)

## Verification
You can verify if the service is running by visiting:
`http://localhost:3002/`

To verify the matching logic, you can run the standalone test script from this directory:
```bash
node test-matching.js
```

## WebSocket API
The service accepts connections via `ws://localhost:3002` (or through the API Gateway).

- **Event (Emit):** `find-match`
  - Payload: `{ userId, language, difficulty, category }`
- **Event (On):** `match-found`
  - Payload: `{ roomId, partnerId }`
- **Event (On):** `match-timeout`
  - Payload: `{ message }`

## File Structure
```
matching-service/
├── config/
│   └── redis.js                  # Redis client setup
├── controllers/
│   └── matchController.js        # Socket event handlers (find-match, cancel-match, disconnect)
├── services/
│   ├── matchingService.js        # Core matching logic, queue management, socket state
│   └── externalServices.js       # HTTP stubs for Question and Collaboration services (will replace with API calls)
├── socket/
│   └── socketHandler.js          # Registers socket events with Socket.IO
├── utils/
│   ├── queueKeys.js              # Queue key generation and criteria parsing helpers
│   └── lock.js                   # Redis locks
├── index.js                      # Express + Socket.IO server entry point
├── test-matching.js              # Test script
└── .env                          # Environment variables (see Set-Up)

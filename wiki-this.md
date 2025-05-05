# Testing the Leap25 API

This guide provides step-by-step instructions for setting up and testing the Leap25 API.

## Prerequisites

- Node.js v20 or later
- npm
- MySQL database
- Redis server (optional, but recommended)

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/dlsu-lscs/leap25-backend.git
   cd leap25-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and fill in the required information:

   - Database connection details
   - Redis connection details (if using Redis)
   - Google auth credentials (if using OAuth)
   - JWT secret
   - Session secret

4. **Initialize the database**

   ```bash
   npm run db:init
   ```

   This will run migrations and seed the database with initial data.

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Testing with the API Endpoint Examples

The project includes an `api.http` file that contains pre-configured HTTP requests for testing. If you're using VS Code, install the "REST Client" extension to execute these requests directly from the editor.

Alternatively, you can use tools like Postman, Insomnia, or curl to test the API endpoints.

### Basic Health Check

Send a GET request to verify the API is running:

```http
GET http://localhost:3000
```

Expected response: `"Hello World!"`

### User Management

1. **Create a User**

   ```http
   POST http://localhost:3000/users
   Content-Type: application/json

   {
     "email": "test@example.com",
     "name": "Test User",
     "display_picture": "https://example.com/pic.jpg"
   }
   ```

2. **Get All Users**

   ```http
   GET http://localhost:3000/users
   ```

3. **Get User by ID**  
   Replace `{USER_ID}` with the actual user ID:

   ```http
   GET http://localhost:3000/users/{USER_ID}
   ```

4. **Update User**  
   Replace `{USER_ID}` with the actual user ID:

   ```http
   PUT http://localhost:3000/users/{USER_ID}
   Content-Type: application/json

   {
     "name": "Updated User Name"
   }
   ```

5. **Delete User**  
   Replace `{USER_ID}` with the actual user ID:
   ```http
   DELETE http://localhost:3000/users/{USER_ID}
   ```

### Event Management

1. **Create an Event**

   ```http
   POST http://localhost:3000/events
   Content-Type: application/json

   {
     "org_id": 999,
     "title": "Workshop on Node.js",
     "description": "Learn Node.js basics",
     "venue": "Online",
     "schedule": "2023-12-30T10:00:00.000Z",
     "fee": 0,
     "code": "WORKSHOP101",
     "max_slots": 50
   }
   ```

2. **Get All Events**

   ```http
   GET http://localhost:3000/events
   ```

3. **Get Event by ID**  
   Replace `{EVENT_ID}` with the actual event ID:

   ```http
   GET http://localhost:3000/events/{EVENT_ID}
   ```

4. **Check Available Slots**  
   Replace `{EVENT_ID}` with the actual event ID:

   ```http
   GET http://localhost:3000/events/{EVENT_ID}/slots
   ```

5. **Update Event**  
   Replace `{EVENT_ID}` with the actual event ID:

   ```http
   PUT http://localhost:3000/events/{EVENT_ID}
   Content-Type: application/json

   {
     "title": "Updated Workshop Title",
     "max_slots": 75
   }
   ```

6. **Delete Event**  
   Replace `{EVENT_ID}` with the actual event ID:
   ```http
   DELETE http://localhost:3000/events/{EVENT_ID}
   ```

### Registrations

1. **Register User for Event**

   ```http
   POST http://localhost:3000/registrations
   Content-Type: application/json

   {
     "user_id": 1,
     "event_id": 1
   }
   ```

2. **Get User Registrations**  
   Replace `{USER_ID}` with the actual user ID:
   ```http
   GET http://localhost:3000/users/{USER_ID}/registrations
   ```

### Testing the Redis Slots Functionality

To test the Redis-based event slots system:

1. **Create a Test Event**

   ```http
   POST http://localhost:3000/events
   Content-Type: application/json

   {
     "org_id": 999,
     "title": "Redis Test Event",
     "description": "Event for testing Redis slots functionality",
     "venue": "Online",
     "schedule": "2023-12-30T10:00:00.000Z",
     "fee": 0,
     "code": "REDISTEST",
     "max_slots": 10
   }
   ```

2. **Check Initial Available Slots**  
   Replace `{EVENT_ID}` with the event ID returned from the previous request:

   ```http
   GET http://localhost:3000/events/{EVENT_ID}/slots
   ```

   Expected response:

   ```json
   {
     "available": 10,
     "total": 10
   }
   ```

3. **Register a User for the Event**

   ```http
   POST http://localhost:3000/registrations
   Content-Type: application/json

   {
     "user_id": 1,
     "event_id": {EVENT_ID}
   }
   ```

4. **Check Updated Available Slots**

   ```http
   GET http://localhost:3000/events/{EVENT_ID}/slots
   ```

   Expected response:

   ```json
   {
     "available": 9,
     "total": 10
   }
   ```

5. **Update Event Max Slots**

   ```http
   PUT http://localhost:3000/events/{EVENT_ID}
   Content-Type: application/json

   {
     "max_slots": 20
   }
   ```

6. **Check Slots After Update**

   ```http
   GET http://localhost:3000/events/{EVENT_ID}/slots
   ```

   Expected response:

   ```json
   {
     "available": 19,
     "total": 20
   }
   ```

## Troubleshooting

- **Database Connection Issues**: Verify database credentials in your `.env` file and ensure the database server is running.
- **Redis Connection Errors**: If Redis is not available, the API will still function but may show connection errors in the logs.
- **Port Already in Use**: If port 3000 is already in use, change the PORT value in your `.env` file.

## Running Tests

To run the automated tests:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

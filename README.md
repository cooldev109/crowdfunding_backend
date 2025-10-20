# Crowdfunding Investment Platform - Backend

Backend API for the Crowdfunding Investment Platform built with Node.js, Express, TypeScript, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT + bcrypt
- **Validation:** Zod
- **Payment:** Stripe
- **File Upload:** Multer + Cloudinary
- **Excel Processing:** ExcelJS
- **Logging:** Pino

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, env, logger)
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middlewares/     # Custom middleware
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Then fill in your environment variables:

```env
PORT=4000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret
# ... (see .env.example for all variables)
```

### 3. MongoDB Setup

- Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- Create a new cluster
- Get your connection string and add it to `MONGO_URI` in `.env`

### 4. Run the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:4000`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Authentication (Coming in Cycle 1)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects (Coming in Cycle 2)
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project (Admin only)
- `PUT /api/projects/:id` - Update project (Admin only)

### More endpoints will be added in subsequent cycles...

## Development Cycles

This project follows an 8-cycle development plan:

1. **Cycle 1:** Auth System
2. **Cycle 2:** Project Module
3. **Cycle 3:** Excel Upload
4. **Cycle 4:** Subscription System
5. **Cycle 5:** Simulation Module
6. **Cycle 6:** Premium Database
7. **Cycle 7:** Contact & Static Pages
8. **Cycle 8:** Analytics Dashboard

## Code Quality Rules

- TypeScript strict mode enabled
- No `any` types unless absolutely necessary
- All environment variables from `.env`
- Zod validation for all inputs
- Centralized error handling
- Consistent naming conventions
- Proper logging with Pino

## Security Features

- Helmet for security headers
- CORS configuration
- JWT in HTTP-only cookies
- Password hashing with bcrypt
- Input sanitization
- Rate limiting (to be added)

## Contributing

Follow the development plan and code quality rules specified in the project documentation.

## License

MIT

# StreetPaws Backend API

A comprehensive REST API for the StreetPaws pet adoption platform, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization** - JWT-based auth with role management
- **Pet Management** - Full CRUD operations for pet listings
- **Comments & Cheers** - Interactive features for user engagement
- **File Uploads** - Image upload handling for pet photos
- **AI Integration** - Google GenAI for description generation and name suggestions
- **Real-time Updates** - Socket.io for live comments and cheers
- **Search & Filtering** - Advanced search with text indexing
- **API Documentation** - Swagger/OpenAPI documentation
- **Rate Limiting** - Protection against abuse
- **Logging** - Winston-based logging system

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt
- **Real-time**: Socket.io
- **AI**: Google Generative AI
- **Documentation**: Swagger UI
- **Testing**: Jest, Supertest
- **Logging**: Winston

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Cloud account (for GenAI API)

### Installation

1. Clone the repository
2. Navigate to the server directory
3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Update the environment variables in `.env`

6. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## API Documentation

Once the server is running, visit `http://localhost:5000/api-docs` for interactive API documentation.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/streetpaws |
| `CLIENT_URL` | Frontend URL | http://localhost:3000 |
| `API_URL` | Backend API URL | http://localhost:5000 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Pets
- `GET /api/pets` - Get all pets (with filtering/pagination)
- `GET /api/pets/:id` - Get single pet
- `POST /api/pets` - Create new pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet
- `POST /api/pets/:id/comments` - Add comment
- `POST /api/pets/:id/cheer` - Toggle cheer

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:userId/pets` - Get user's pets

### Uploads
- `POST /api/upload/image` - Upload image
- `DELETE /api/upload/image/:filename` - Delete image

### AI
- `POST /api/ai/generate-description` - Generate pet description
- `POST /api/ai/suggest-names` - Suggest pet names

## Project Structure

```
server/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── utils/          # Utility functions
├── config/         # Configuration files
├── uploads/        # Uploaded files
├── logs/           # Log files
├── tests/          # Test files
├── server.js       # Main server file
├── package.json
├── .env.example
└── README.md
```

## Testing

Run tests with:
```bash
npm test
```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
Build and run with Docker:
```bash
docker build -t streetpaws-backend .
docker run -p 5000:5000 streetpaws-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@streetpaws.com or create an issue in the repository.
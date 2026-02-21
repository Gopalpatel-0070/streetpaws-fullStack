# StreetPaws - Pet Adoption Platform

A full-stack web application connecting people with stray animals for adoption and rescue. Built with **React + Vite** (frontend) and **Express.js + MongoDB** (backend).

## 🚀 Features

- **User Authentication**: JWT-based registration and login
- **Pet Listings**: CRUD operations for pet profiles
- **Real-time Interactions**: Comments, "cheers" (likes), and pet search
- **AI-Powered Descriptions**: Google GenAI integration for pet bios
- **Responsive Design**: Mobile-first UI with Tailwind CSS + Lucide icons
- **Image Uploads**: Support for pet photos with URL-based storage
- **Role-Based Access**: User and admin roles with authorization
- **Status Tracking**: Track pet adoption status (Available, Adopted, Fostered)

## 📁 Project Structure

```
streetpaws/
├── client/                 # React Vite Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.production
├── server/                 # Express.js Backend
│   ├── routes/            # API endpoints
│   ├── models/            # MongoDB schemas
│   ├── middleware/        # Auth, error handling
│   ├── package.json
│   ├── server.js
│   └── .env.production
├── package.json           # Root monorepo config
├── vercel.json           # Frontend Vercel deployment config
└── README.md             # This file
```

## 🛠️ Local Setup

### Prerequisites
- Node.js 18.x
- npm 9.x or higher
- MongoDB Atlas account

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <your-repo-url>
cd streetpaws
npm install
```

2. **Setup Environment Variables**

Create `server/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3001
API_URL=http://localhost:5000
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

Create `client/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. **Run Development Servers**
```bash
# From root directory
npm run dev

# Or separately:
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

Frontend: http://localhost:3001  
Backend: http://localhost:5000

## 📦 Build for Production

```bash
# Build both frontend and backend
npm run build

# Frontend output: client/dist/
# Backend ready for deployment as-is
```

## 🌐 Vercel Deployment

### Frontend Deployment (Recommended)

1. **Create Vercel Project from GitHub**
   - Connect your GitHub repository to Vercel
   - Select "Vite" as the framework
   - Root directory: `client`

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables** in Vercel Project Settings:
   ```
   VITE_API_BASE_URL=https://your-backend.vercel.app/api
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   **Important:** Set these as regular environment variables in your Vercel project dashboard, NOT as secrets.

4. **Deploy** - Vercel will auto-deploy on git push

### Backend Deployment (Recommended)

1. **Separate Repository Setup** (Optional but recommended)
   - Can be in same repo or separate for better CI/CD

2. **Create Vercel Project**
   - Select Node.js runtime
   - Root directory: `server` (if separate)

3. **Set Environment Variables** in Vercel Project Settings:
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=use_vercel_secrets_not_this_value
   CLIENT_URL=https://your-frontend.vercel.app
   API_URL=https://your-backend.vercel.app
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   ```

4. **Deploy** - Vercel auto-deploys on git push

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Deploy frontend
cd client && vercel

# Deploy backend
cd server && vercel
```

## 🔐 Environment Variables

### Production Secrets (Use Vercel Secrets for sensitive data)

```bash
# For MongoDB
vercel env add MONGO_URI

# For JWT
vercel env add JWT_SECRET

# For API Keys
vercel env add GOOGLE_GENAI_API_KEY
```

## 📡 API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Pet Routes
- `GET /api/pets` - List all pets (with filters)
- `GET /api/pets/:id` - Get single pet
- `POST /api/pets` - Create pet (protected)
- `PUT /api/pets/:id` - Update pet (protected)
- `DELETE /api/pets/:id` - Delete pet (protected)
- `POST /api/pets/:id/comments` - Add comment
- `POST /api/pets/:id/cheer` - Toggle cheer

### User Routes
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (protected)

## 🧪 Testing

### Manual API Testing
```bash
# Health check
curl http://localhost:5000/health

# List pets
curl http://localhost:5000/api/pets

# View API documentation
# Navigate to http://localhost:5000/api-docs
```

## 🐛 Troubleshooting

### CORS Errors
Ensure `CLIENT_URL` is set correctly in server `.env` and updated in Vercel production settings.

### MongoDB Connection Issues
- Verify connection string in `.env`
- Check MongoDB Atlas network access allows Vercel IPs
- Add `0.0.0.0/0` to IP whitelist (temporary for testing)

### Frontend Can't Reach Backend
- Check `VITE_API_BASE_URL` in frontend `.env`
- Ensure backend is deployed and running
- Verify CORS is properly configured

### Build Failures
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18.x)
- Review Vercel build logs for specific errors

## 📱 Features Demo

### User Registration & Login
1. Navigate to app
2. Click "Register" tab
3. Fill in username, email, password
4. Login with credentials

### Create Pet Listing
1. Login to account
2. Click "List new stray" button
3. Fill form with pet details
4. Add photo URL
5. Optional: Use AI to generate description
6. Submit

### Browse & Interact
1. View all pets in list/grid
2. Filter by type, urgency, or search
3. Click pet card to view details
4. Add comments or cheer (like)
5. Contact pet reporter via WhatsApp

## 🔄 CI/CD Pipeline

Vercel automatically:
- Builds on every git push
- Runs your build command
- Deploys to preview URL for PRs
- Goes live to production on merge to main

## 📊 Database Schema

### User Collection
- username, email, password (hashed)
- profile (firstName, lastName, avatar)
- role (user/admin)
- timestamps

### Pet Collection
- name, type, age, location
- description, imageUrl
- contactName, contactNumber
- postedBy (user reference)
- urgency, status
- comments, cheers arrays
- timestamps

## 🚨 Important Notes

1. **Never commit `.env` files** - Use `.gitignore`
2. **Always use environment variables** for secrets
3. **MongoDB Atlas requires IP whitelist** - Add Vercel's IPs in production
4. **Google Gemini API key** - Get from https://aistudio.google.com
5. **Image URLs must be publicly accessible** - Use services like Image2URL

## 📝 License

MIT License - feel free to use this project!

## 👥 Support

For issues, create a GitHub issue with:
- Error message
- Steps to reproduce
- Environment (local/production)
- Browser/Node version

---

**Made with ❤️ for street animals everywhere**

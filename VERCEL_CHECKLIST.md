# Vercel Deployment Checklist

## Pre-Deployment

- [ ] All code committed to GitHub
- [ ] No sensitive data in code (check for hardcoded secrets)
- [ ] `.gitignore` includes `.env` files
- [ ] All dependencies listed in `package.json`
- [ ] `package-lock.json` exists and committed

## Backend Setup (Express Server)

- [ ] `server/.env.production` configured with production values
- [ ] `vercel.json` exists in server directory
- [ ] Node version set to 18.x in `server/package.json`
- [ ] Main file is `server.js`
- [ ] Server listens on `process.env.PORT || 3000`
- [ ] CORS allows production frontend domain
- [ ] MongoDB connection tested with MongoDB Atlas
- [ ] IP whitelist updated in MongoDB Atlas (`0.0.0.0/0` for Vercel or specific IPs)

## Frontend Setup (Vite React)

- [ ] `client/.env.production` configured
- [ ] `VITE_API_BASE_URL` points to backend production URL
- [ ] `vercel.json` exists in root for frontend routing
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Node version set to 18.x in `client/package.json`
- [ ] API service uses dynamic URLs (not hardcoded)

## Environment Variables

### Backend (Via Vercel Settings)
- [ ] `NODE_ENV=production`
- [ ] `MONGO_URI=<your_connection_string>`
- [ ] `JWT_SECRET=<secure_random_string>`
- [ ] `CLIENT_URL=https://<frontend-domain>`
- [ ] `API_URL=https://<backend-domain>`
- [ ] `GOOGLE_GENAI_API_KEY=<your_api_key>` (optional)

## Environment Variables

### Backend (Via Vercel Settings)
- [ ] `NODE_ENV=production`
- [ ] `MONGO_URI=<your_connection_string>`
- [ ] `JWT_SECRET=<secure_random_string>`
- [ ] `CLIENT_URL=https://<frontend-domain>`
- [ ] `API_URL=https://<backend-domain>`
- [ ] `GOOGLE_GENAI_API_KEY=<your_api_key>` (optional)

### Frontend (Via Vercel Settings - Regular Environment Variables, NOT Secrets)
- [ ] `VITE_API_BASE_URL=https://<backend-domain>/api`
- [ ] `VITE_GEMINI_API_KEY=<api_key>` (optional)

## GitHub Repository

- [ ] Repository is public (or Vercel has access)
- [ ] Main/master branch contains production-ready code
- [ ] All branches pushed to GitHub
- [ ] Repository linked to Vercel projects

## Vercel Projects

### Backend Project
- [ ] Project created in Vercel
- [ ] GitHub repository connected
- [ ] Root directory set to `server`
- [ ] Framework: Node.js
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] All environment variables set

### Frontend Project  
- [ ] Project created in Vercel
- [ ] GitHub repository connected
- [ ] Root directory: `client`
- [ ] Framework: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] All environment variables set

## MongoDB Atlas

- [ ] Database user created
- [ ] Connection string ready
- [ ] Network access configured:
  - [ ] Allow Vercel IPs or `0.0.0.0/0` (for testing)
  - [ ] SSL enabled
  - [ ] Replica Set required for some features

## API Testing

- [ ] Backend health check: `curl https://<backend>/health`
- [ ] Frontend loads without console errors
- [ ] API requests work (login, create pet, etc.)
- [ ] Images load correctly
- [ ] AI features work (if API key configured)

## Production URLs

- [ ] Frontend URL: `https://<frontend>.vercel.app`
- [ ] Backend URL: `https://<backend>.vercel.app`
- [ ] API Base: `https://<backend>.vercel.app/api`
- [ ] API Docs: `https://<backend>.vercel.app/api-docs`

## Final Validation

- [ ] Test registration/login flow end-to-end
- [ ] Create a pet listing
- [ ] Search and filter pets
- [ ] Add comments and cheers
- [ ] Test image upload/preview
- [ ] Test on mobile browser
- [ ] Check console for errors
- [ ] Monitor Vercel logs for issues

## Post-Deployment

- [ ] Set up monitoring/error tracking (optional)
- [ ] Configure custom domain (optional)
- [ ] Set up automated backups for MongoDB
- [ ] Document production URLs
- [ ] Share with team/stakeholders

## Troubleshooting Commands

```bash
# View Vercel logs
vercel logs <project-name>

# Check build artifacts
vercel artifacts

# Rebuild and redeploy
vercel --prod --force

# View function execution
vercel log <function-name>
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 404 API errors | Check `VITE_API_BASE_URL` in frontend env |
| CORS errors | Verify `CLIENT_URL` in backend env |
| MongoDB timeout | Add Vercel IPs to MongoDB Atlas whitelist |
| Build failures | Check build logs in Vercel dashboard |
| Images not loading | Ensure image URLs are publicly accessible |
| Auth not working | Verify `JWT_SECRET` matches between instances |

---

✅ Once all items are checked, your deployment is ready!

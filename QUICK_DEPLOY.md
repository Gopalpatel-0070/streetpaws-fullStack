# 🚀 Quick Deployment Guide

## TL;DR - Deploy in 5 Minutes

### What Changed?
Your app is now Vercel-ready with:
- ✅ Production-grade configuration
- ✅ Dynamic API URLs (dev vs production)
- ✅ Proper CORS setup
- ✅ Environment variable templates
- ✅ Optimized builds

### Fastest Deployment Path

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy Backend
```bash
cd server
vercel --prod
# Follow prompts to create project
# Add env variables when prompted (see section below)
```

#### 3. Deploy Frontend  
```bash
cd ../client
vercel --prod
# Framework: Vite
# Root: ./
# Output: dist
# Add env variables
```

#### 4. Done! 🎉
- Backend: `https://<backend>.vercel.app`
- Frontend: `https://<frontend>.vercel.app`

---

## Environment Variables Needed

### Backend (`server`)
Copy-paste these into Vercel dashboard:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://Gopalpatel:gopal2026@streetpawdb.xdkzhvf.mongodb.net/streetpaws
JWT_SECRET=generate-random-string-32-chars-minimum
CLIENT_URL=https://your-frontend-url.vercel.app
API_URL=https://your-backend-url.vercel.app
GOOGLE_GENAI_API_KEY=optional-if-you-have-it
```

### Frontend (`client`)
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
VITE_GEMINI_API_KEY=optional-if-you-have-it
```

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| `vercel.json` | Frontend routing config |
| `server/vercel.json` | Backend serverless config |
| `client/.env.production` | Frontend production template |
| `server/.env.production` | Backend production template |
| `DEPLOYMENT.md` | Detailed deployment guide |
| `VERCEL_READY.md` | Full context & architecture |

---

## Common Issues & Fixes

### "API is not reachable"
1. Check `VITE_API_BASE_URL` in frontend env vars
2. Backend URL should not have `/api` at the end
3. Wait 2-3 minutes for deployment to fully propagate

### "MongoDB connection timeout"
1. Go to MongoDB Atlas → Network Access
2. Add `0.0.0.0/0` (for testing) or Vercel IPs (production)
3. Save and retry

### "CORS Error"
1. Check `CLIENT_URL` in backend env vars
2. Must exactly match frontend URL (including https://)
3. Restart backend deployment after fix

### "Build Failed"
1. Check Vercel build logs (Dashboard → Deployments)
2. Usually means missing env vars or dependency issue
3. Try: `npm install` locally, then push again

---

## Monitoring Deployments

```bash
# View logs from deployed function
vercel logs <project-name>

# View deployment status
vercel deployments

# Promote preview to production
vercel promote <deployment-url>
```

---

## File Structure After Setup

```
streetpaws/
├── .gitignore              ← Excludes .env files
├── .env                    ← Local only (NOT committed)
├── package.json            ← Root monorepo config
├── vercel.json             ← Frontend deployment config
├── DEPLOYMENT.md           ← Full guide
├── VERCEL_READY.md         ← Detailed context
├── VERCEL_CHECKLIST.md     ← Pre-deployment check
├── client/
│   ├── .env.production     ← Production template
│   ├── package.json        ← Updated with build script
│   ├── vite.config.ts      ← Production API URL support
│   └── src/
│       └── apiService.ts   ← Dynamic API base URL
└── server/
    ├── vercel.json         ← Serverless config
    ├── .env.production     ← Production template
    ├── package.json        ← Updated with Node 18.x
    └── server.js           ← Enhanced CORS
```

---

## Verification Checklist During Deployment

- [ ] Both projects created in Vercel
- [ ] Environment variables set in both
- [ ] Backend deploys successfully  → test at `/health`
- [ ] Frontend deploys successfully → loads without errors
- [ ] Frontend can reach backend → check browser console
- [ ] Can login and create pet → test full flow
- [ ] Images display correctly
- [ ] No console errors on frontend
- [ ] MongoDB Atlas allows Vercel IPs

---

## URLs After Deployment

Replace these with your actual Vercel URLs:

```
Frontend: https://streetpaws.vercel.app
Backend:  https://streetpaws-api.vercel.app
Health:   https://streetpaws-api.vercel.app/health
API Docs: https://streetpaws-api.vercel.app/api-docs
```

---

## Support & Resources

- 📖 Full Guide: `DEPLOYMENT.md`
- ✅ Checklist: `VERCEL_CHECKLIST.md`  
- 📊 Context: `VERCEL_READY.md`
- 🆘 Issues: Check troubleshooting sections above

---

**Ready! Push to GitHub and deploy! 🚀**

Questions? See the detailed guides in the repo.

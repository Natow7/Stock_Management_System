# 🚀 Deploy to Render.com (Fastest - 15 Minutes)

## Why Render.com?

- ✅ **FREE tier available** (with limitations)
- ✅ **Zero configuration needed**
- ✅ **Auto-deploy from Git**
- ✅ **Free PostgreSQL database**
- ✅ **Free SSL certificates**
- ✅ **No credit card required for free tier**

**Limitations of Free Tier:**
- Services spin down after 15 minutes of inactivity (30-60 second cold start)
- 750 hours/month (enough for one service 24/7)
- Good for demos and testing, upgrade to $7/month for production

---

## 📋 Step-by-Step Deployment

### Step 1: Push Code to GitHub (if not already)

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### Step 3: Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `sms-database`
   - **Database**: `spms`
   - **User**: `postgres` (or custom)
   - **Region**: Choose closest to your users
   - **Plan**: **Free** (or Starter $7/month for production)
3. Click **"Create Database"**
4. Wait 2-3 minutes for provisioning
5. **Save** the **Internal Database URL** (you'll need it)

### Step 4: Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sms-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `sms-backend`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node src/app.js`
   - **Plan**: **Free** (or Starter $7/month)

4. **Environment Variables** (click "Advanced"):
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<paste your Internal Database URL from Step 3>
   JWT_SECRET=your_very_long_secure_random_string_at_least_32_chars
   JWT_EXPIRES_IN=8h
   ```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for build and deployment
7. **Save** your backend URL (e.g., `https://sms-backend.onrender.com`)

### Step 5: Run Database Migrations

1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run migrations:
   ```bash
   cd db
   node migrate.js
   node seed.js
   ```

Or use Render's **"Manual Deploy"** → **"Clear build cache & deploy"**

### Step 6: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sms-frontend`
   - **Branch**: `main`
   - **Root Directory**: `sms-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=<your backend URL from Step 4>
   ```
   Example: `VITE_API_URL=https://sms-backend.onrender.com`

5. Click **"Create Static Site"**
6. Wait 5-10 minutes for build

### Step 7: Update Frontend API URL

You need to update the frontend to use the Render backend URL:

**Edit `sms-frontend/src/lib/api.js`:**

```javascript
// Change this line:
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// To use environment variable:
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:4000/api";
```

Push changes:
```bash
git add .
git commit -m "Update API URL for Render deployment"
git push
```

Render will auto-deploy the changes!

### Step 8: Test Your Application

1. Go to your frontend URL: `https://sms-frontend.onrender.com`
2. Login with default credentials:
   - **Email**: `admin@example.com`
   - **Password**: `password123` (or whatever you set in seed.js)

🎉 **Your application is now live!**

---

## 🔒 Custom Domain (Optional)

### Add Custom Domain to Frontend

1. Go to your frontend service → **"Settings"** → **"Custom Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain: `yourdomain.com`
4. Add DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: sms-frontend.onrender.com
   ```
5. SSL certificate is automatically provisioned!

### Add Custom Domain to Backend

Same process for backend if you want `api.yourdomain.com`

---

## 💰 Cost Breakdown

### Free Tier (Good for testing/demo):
- Database: Free (90 days, then $7/month for 1GB)
- Backend: Free (with sleep after 15min inactivity)
- Frontend: Free forever
- **Total**: $0 initially, then $7/month after 90 days

### Production Tier:
- Database: $7/month (1GB, always on)
- Backend: $7/month (512MB RAM, always on)
- Frontend: Free
- **Total**: $14/month

### Comparison:
- **Render Free**: $0 (with limitations)
- **Render Production**: $14/month
- **VPS (DigitalOcean)**: $6/month (but you manage everything)
- **AWS/Azure**: $20-50/month (more complex)

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you push to GitHub!

```bash
# Make changes to your code
git add .
git commit -m "Add new feature"
git push

# Render automatically:
# 1. Detects the push
# 2. Builds the application
# 3. Deploys the new version
# 4. Shows deployment progress
```

---

## 📊 Monitoring

### View Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. See real-time logs

### Metrics

1. Click **"Metrics"** tab
2. See:
   - CPU usage
   - Memory usage
   - Response times
   - Request count

### Health Checks

Render automatically monitors your services and restarts them if they crash.

---

## 🐛 Troubleshooting

### Problem: Backend won't connect to database

**Solution**: Check that `DATABASE_URL` environment variable is set correctly:
1. Go to backend service → **"Environment"**
2. Verify `DATABASE_URL` matches your database's Internal URL
3. Redeploy if changed

### Problem: Frontend can't reach backend

**Solution**: Update frontend `VITE_API_URL`:
1. Frontend service → **"Environment"**
2. Add/update: `VITE_API_URL=https://your-backend.onrender.com`
3. Clear build cache and redeploy

### Problem: Service keeps spinning down (Free tier)

**Solution**: Upgrade to paid plan ($7/month) for always-on service

Or create a cron job to ping your service every 14 minutes:
```bash
# Use cron-job.org or similar
curl https://sms-backend.onrender.com/api/health
```

### Problem: Build failed

**Solution**: Check build logs:
1. Go to service → **"Events"** tab
2. Click failed deployment
3. Read error messages
4. Common issues:
   - Missing dependencies in package.json
   - Wrong Node version (add `engines` in package.json)
   - Build command incorrect

### Problem: Database connection timeout

**Solution**: Use **Internal Database URL**, not External:
- ✅ Internal: `postgresql://...@<internal-host>/spms`
- ❌ External: `postgresql://...@<external-host>/spms`

Internal URL has no connection limits on free tier.

---

## 🚀 Performance Optimization

### Enable Persistent Disk (Paid plans)

For faster cold starts:
1. Backend service → **"Settings"** → **"Disk"**
2. Add persistent disk (25GB free with paid plan)
3. Mount at: `/app/cache`

### Database Optimization

1. **Add indexes** for frequently queried columns
2. **Enable connection pooling** (already in your code)
3. **Monitor slow queries**:
   ```sql
   -- In database shell
   SELECT * FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

### Frontend Optimization

Already optimized with:
- ✅ Vite build optimization
- ✅ Code splitting
- ✅ Asset compression
- ✅ CDN delivery (Render's built-in)

---

## 🔐 Security Best Practices

### 1. Rotate JWT Secret

```bash
# Generate new secret
openssl rand -base64 32

# Update in Render:
# Backend → Environment → JWT_SECRET → Save → Redeploy
```

### 2. Change Default Passwords

After first login, change all default user passwords!

### 3. Enable CORS Properly

In `sms-backend/src/app.js`, update CORS origin:
```javascript
app.use(cors({
  origin: 'https://your-frontend.onrender.com',
  credentials: true
}));
```

### 4. Database Backups

Render automatically backs up databases daily (retained 7 days on free, 30 days on paid).

Manual backup:
1. Database → **"Backups"** → **"Create Backup"**

### 5. Environment Variables

Never commit `.env` files! Use Render's environment variables.

---

## 📈 Scaling to Production

### When to Upgrade:

**Upgrade Database** ($7/month) when:
- You have >100 users
- Need 24/7 uptime
- Need more than 1GB storage

**Upgrade Backend** ($7/month) when:
- Cold starts are unacceptable
- You have >50 concurrent users
- Need more than 512MB RAM

**Consider VPS** ($12/month) when:
- You need >2GB RAM
- You want full control
- Cost of multiple Render services >$20/month

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Database URL saved
- [ ] Backend deployed with correct env vars
- [ ] Database migrations run
- [ ] Frontend deployed with backend URL
- [ ] Application accessible and working
- [ ] Default password changed
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Monitoring enabled

---

## 📞 Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Render Status**: https://status.render.com

---

## 🎯 Next Steps

1. **Test thoroughly** - Try all features
2. **Change passwords** - Update default credentials
3. **Add users** - Create real user accounts
4. **Monitor** - Check logs and metrics daily
5. **Backup** - Create manual backups regularly
6. **Upgrade** - Move to paid tier when ready for production

**Your Stock Management System is live on Render!** 🎉

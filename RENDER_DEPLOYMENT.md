# Render Deployment Guide

This guide outlines the steps to deploy CollabCanvas to Render with PostgreSQL and Redis.

## 🏗️ Architecture

### Services:
- **Backend**: Flask API with Socket.IO (Web Service)
- **Database**: PostgreSQL (Managed Database)
- **Cache**: Redis (Managed Redis)
- **Frontend**: Vercel (existing deployment)

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Firebase Project**: Ensure Firebase is configured

## 🚀 Deployment Steps

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"PostgreSQL"**
3. **Configure Database**:
   - **Name**: `collabcanvas-db`
   - **Database**: `collabcanvas`
   - **User**: `collabcanvas_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or Starter for production)
4. **Click "Create Database"**
5. **Note the connection details** (you'll need these later)

### Step 2: Create Redis Instance

1. **Click "New +"** → **"Redis"**
2. **Configure Redis**:
   - **Name**: `collabcanvas-redis`
   - **Region**: Same as PostgreSQL
   - **Plan**: Free (or Starter for production)
3. **Click "Create Redis"**
4. **Note the connection details**

### Step 3: Deploy Backend Service

1. **Click "New +"** → **"Web Service"**
2. **Connect Repository**:
   - **Connect your GitHub repository**
   - **Select the repository**: `gauntlet-collab-canvas-24hr`
3. **Configure Service**:
   - **Name**: `collabcanvas-backend`
   - **Root Directory**: `collabcanvas-mvp-24/backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`
4. **Environment Variables**:
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   REDIS_URL=redis://user:pass@host:port
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----"
   FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project.iam.gserviceaccount.com
   ```
5. **Click "Create Web Service"**

### Step 4: Update Frontend Environment Variables

1. **Go to Vercel Dashboard**
2. **Select your project**: `gauntlet-collab-canvas-24hr`
3. **Go to Settings → Environment Variables**
4. **Update `VITE_API_URL`**:
   ```
   VITE_API_URL=https://collabcanvas-backend.onrender.com
   ```
5. **Redeploy** (Vercel will auto-redeploy)

### Step 5: Run Database Migrations

1. **Go to your Render service dashboard**
2. **Click "Shell"** (or use Render CLI)
3. **Run migrations**:
   ```bash
   cd backend
   flask db upgrade
   ```

## 🔧 Configuration Details

### Environment Variables Explained:

#### **Required Variables:**
- `FLASK_ENV=production` - Sets Flask to production mode
- `SECRET_KEY` - Flask secret key (generate a random string)
- `DATABASE_URL` - PostgreSQL connection string from Render
- `REDIS_URL` - Redis connection string from Render

#### **Firebase Variables:**
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY_ID` - From your Firebase service account JSON
- `FIREBASE_PRIVATE_KEY` - From your Firebase service account JSON
- `FIREBASE_CLIENT_EMAIL` - From your Firebase service account JSON
- `FIREBASE_CLIENT_ID` - From your Firebase service account JSON
- `FIREBASE_AUTH_URI` - Standard Google OAuth URI
- `FIREBASE_TOKEN_URI` - Standard Google token URI
- `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` - Standard Google cert URL
- `FIREBASE_CLIENT_X509_CERT_URL` - From your Firebase service account JSON

### Database Connection:
Render provides the `DATABASE_URL` automatically. It looks like:
```
postgresql://username:password@hostname:port/database
```

### Redis Connection:
Render provides the `REDIS_URL` automatically. It looks like:
```
redis://username:password@hostname:port
```

## 📊 API Endpoints

After deployment, your API will be available at:
- **Base URL**: `https://collabcanvas-backend.onrender.com`
- **Swagger UI**: `https://collabcanvas-backend.onrender.com/docs`
- **Health Check**: `https://collabcanvas-backend.onrender.com/health`

### Available Endpoints:
- `POST /api/auth/register` - Register user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify` - Verify token
- `GET /api/canvas/` - Get user canvases
- `POST /api/canvas/` - Create canvas
- `GET /api/canvas/{id}` - Get canvas
- `POST /api/objects/` - Create object
- `POST /api/collaboration/invite` - Invite user

## 🧪 Testing

### Health Check:
```bash
curl https://collabcanvas-backend.onrender.com/health
```

### API Test:
```bash
curl https://collabcanvas-backend.onrender.com/api/auth/me
```

## ⚠️ Important Notes

### Free Tier Limitations:
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes ~30 seconds
- **Bandwidth**: 100GB/month limit
- **Database**: 1GB storage limit

### Production Considerations:
- **Upgrade to Starter Plan** for always-on service
- **Set up monitoring** and alerts
- **Configure custom domain** if needed
- **Set up SSL certificates**

## 🔄 Auto-Deployment

Render automatically deploys when you push to your main branch:
1. **Push changes** to GitHub
2. **Render detects changes**
3. **Builds and deploys** automatically
4. **Updates your service**

## 📈 Monitoring

### Render Dashboard:
- **View logs** in real-time
- **Monitor performance** metrics
- **Check service health**
- **View deployment history**

### Logs:
- **Access logs** from Render dashboard
- **Filter by level** (info, warning, error)
- **Download logs** for analysis

## 🆘 Troubleshooting

### Common Issues:

1. **Service won't start**:
   - Check build logs for errors
   - Verify all environment variables are set
   - Ensure requirements.txt is correct

2. **Database connection errors**:
   - Verify DATABASE_URL is correct
   - Check if database is running
   - Ensure migrations are run

3. **Redis connection errors**:
   - Verify REDIS_URL is correct
   - Check if Redis instance is running

4. **CORS errors**:
   - Check allowed origins in Flask app
   - Verify frontend URL is in CORS list

### Debug Commands:
```bash
# Check service logs
# Go to Render dashboard → Your service → Logs

# Test database connection
# Use Render Shell to run:
python -c "from app import create_app; app = create_app(); print('App created successfully')"

# Test Redis connection
# Use Render Shell to run:
python -c "import redis; r = redis.from_url('$REDIS_URL'); print(r.ping())"
```

## 💰 Cost Considerations

### Free Tier:
- **Web Service**: Free (with sleep mode)
- **PostgreSQL**: Free (1GB limit)
- **Redis**: Free (25MB limit)

### Paid Plans:
- **Starter**: $7/month (always-on, no sleep)
- **Standard**: $25/month (better performance)
- **Pro**: $85/month (production-ready)

## 🔐 Security

### Environment Variables:
- **Never commit** sensitive data to Git
- **Use Render's** environment variable system
- **Rotate secrets** regularly

### Database Security:
- **Use strong passwords**
- **Enable SSL** connections
- **Restrict access** to necessary IPs

### API Security:
- **Use HTTPS** (automatic with Render)
- **Validate all inputs**
- **Implement rate limiting**

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases/postgresql)
- [Redis on Render](https://render.com/docs/databases/redis)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

## 🎯 Next Steps

1. **Deploy to Render** following this guide
2. **Test all endpoints** using Swagger UI
3. **Update frontend** environment variables
4. **Test end-to-end** functionality
5. **Set up monitoring** and alerts
6. **Configure custom domain** (optional)
7. **Upgrade to paid plan** for production use

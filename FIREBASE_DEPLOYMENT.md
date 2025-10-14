# Firebase Cloud Functions Deployment Guide

This guide outlines the steps to deploy CollabCanvas to Firebase Cloud Functions and Firebase Hosting.

## 🏗️ Architecture Changes

### Backend Changes:
- **Flask → Firebase Cloud Functions**: Converted Flask app to run as Cloud Functions
- **PostgreSQL → Firestore**: Replaced SQLAlchemy with Firestore for data storage
- **Socket.IO → Removed**: Cloud Functions don't support WebSockets (real-time features disabled)
- **Redis → Removed**: No longer needed for Cloud Functions

### Frontend Changes:
- **Vercel → Firebase Hosting**: Frontend will be served from Firebase Hosting
- **Socket.IO → Mocked**: Real-time features are disabled in this deployment

## 📋 Prerequisites

1. **Firebase CLI**: Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. **Python 3.11**: Required for Cloud Functions
   ```bash
   python --version  # Should be 3.11+
   ```

3. **Firebase Project**: Ensure you have a Firebase project set up

## 🚀 Deployment Steps

### Step 1: Firebase CLI Setup

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Initialize Firebase in your project**:
   ```bash
   cd collabcanvas-mvp-24
   firebase init
   ```

3. **Select the following services**:
   - ✅ Functions
   - ✅ Firestore
   - ✅ Hosting

4. **Configure Functions**:
   - Language: Python
   - Source directory: `backend`
   - Dependencies: Yes (install from requirements.txt)

5. **Configure Firestore**:
   - Use existing rules: No
   - Use existing indexes: No

6. **Configure Hosting**:
   - Public directory: `frontend/dist`
   - Single-page app: Yes
   - Overwrite index.html: No

### Step 2: Environment Variables

1. **Set Firebase project**:
   ```bash
   firebase use collabcanvas-24-mvp
   ```

2. **Set environment variables for Cloud Functions**:
   ```bash
   firebase functions:config:set app.secret_key="your-secret-key-here"
   firebase functions:config:set app.flask_env="production"
   ```

### Step 3: Build Frontend

1. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Build for production**:
   ```bash
   npm run build
   ```

3. **Update environment variables for Firebase Hosting**:
   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=collabcanvas-24-mvp.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=collabcanvas-24-mvp
   VITE_FIREBASE_STORAGE_BUCKET=collabcanvas-24-mvp.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Rebuild with production environment**:
   ```bash
   npm run build
   ```

### Step 4: Deploy to Firebase

1. **Deploy everything**:
   ```bash
   firebase deploy
   ```

2. **Or deploy individually**:
   ```bash
   # Deploy Functions only
   firebase deploy --only functions
   
   # Deploy Firestore rules only
   firebase deploy --only firestore:rules
   
   # Deploy Hosting only
   firebase deploy --only hosting
   ```

## 🔧 Configuration

### Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `collabcanvas-24-mvp`

#### Authentication Setup:
1. **Authentication → Sign-in method**
2. **Enable Google provider**
3. **Add authorized domains**:
   - `collabcanvas-24-mvp.web.app`
   - `collabcanvas-24-mvp.firebaseapp.com`
   - `localhost` (for development)

#### Firestore Setup:
1. **Firestore Database → Create database**
2. **Start in production mode**
3. **Choose location**: `us-central1` (or your preferred region)

#### Hosting Setup:
1. **Hosting → Add custom domain** (optional)
2. **Configure redirects** (handled by firebase.json)

### Vercel Configuration (Alternative Frontend)

If you prefer to keep the frontend on Vercel:

1. **Update Vercel environment variables**:
   ```
   VITE_API_URL=https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app
   ```

2. **Redeploy on Vercel**

## 📊 API Endpoints

After deployment, your API will be available at:
- **Base URL**: `https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app`
- **Swagger UI**: `https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app/docs`
- **Health Check**: `https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app/health`

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

### Local Development:
```bash
# Start Firebase emulators
firebase emulators:start

# Test functions locally
curl http://localhost:5001/collabcanvas-24-mvp/us-central1/app/health
```

### Production Testing:
```bash
# Test deployed function
curl https://us-central1-collabcanvas-24-mvp.cloudfunctions.net/app/health
```

## ⚠️ Limitations

### Real-time Features:
- **WebSockets not supported** in Cloud Functions
- **Real-time collaboration disabled**
- **Cursor tracking disabled**
- **Live presence disabled**

### Workarounds:
- Use Firestore real-time listeners for basic real-time features
- Implement polling for object updates
- Consider Firebase Realtime Database for real-time features

## 🔄 Migration from Railway

### Data Migration:
1. **Export data from PostgreSQL** (if needed)
2. **Import to Firestore** using Firebase Admin SDK
3. **Update frontend API URLs**

### Rollback Plan:
1. **Keep Railway deployment** as backup
2. **Update DNS/domain** to point back to Railway
3. **Restore PostgreSQL data** if needed

## 📈 Monitoring

### Firebase Console:
- **Functions → Logs**: View function execution logs
- **Firestore → Usage**: Monitor database usage
- **Hosting → Analytics**: View hosting analytics

### Cloud Monitoring:
- **Set up alerts** for function errors
- **Monitor performance** metrics
- **Track usage** and costs

## 💰 Cost Considerations

### Firebase Pricing:
- **Cloud Functions**: Pay per invocation
- **Firestore**: Pay per read/write operation
- **Hosting**: Free tier available
- **Authentication**: Free tier available

### Optimization:
- **Implement caching** to reduce Firestore reads
- **Use batch operations** for multiple writes
- **Monitor usage** regularly

## 🆘 Troubleshooting

### Common Issues:

1. **Function timeout**:
   - Increase timeout in firebase.json
   - Optimize function performance

2. **CORS errors**:
   - Check CORS configuration in main.py
   - Verify allowed origins

3. **Authentication errors**:
   - Verify Firebase project configuration
   - Check authorized domains

4. **Firestore permission errors**:
   - Review firestore.rules
   - Test rules in Firebase Console

### Debug Commands:
```bash
# View function logs
firebase functions:log

# Test functions locally
firebase emulators:start --only functions

# Deploy with debug info
firebase deploy --debug
```

## 📚 Additional Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Flask on Cloud Functions](https://cloud.google.com/functions/docs/frameworks/python)

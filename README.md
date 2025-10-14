# CollabCanvas MVP - 24 Hour Build

A real-time collaborative canvas application built with React, Flask, and Socket.IO.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd collabcanvas-mvp-24
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your configuration
   python run.py
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm run dev
   ```

4. **Run tests:**
   ```bash
   cd backend
   python -m pytest tests/ -v
   ```

## 🌐 Deployment

### Frontend (Vercel)

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.herokuapp.com
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
   
   **⚠️ Important:** Replace all placeholder values with your actual configuration:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://collabcanvas-backend-123.herokuapp.com`)
   - Firebase values: Get these from your Firebase project settings

3. **Deploy:**
   - Vercel will auto-deploy on git push
   - Custom domain can be configured in Vercel dashboard

### Backend (Heroku)

1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku app:**
   ```bash
   cd backend
   heroku create your-app-name
   ```
   
   **Note:** Choose a unique app name as it becomes your public URL: `https://your-app-name.herokuapp.com`

3. **Add PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set FIREBASE_PROJECT_ID=your-project-id
   heroku config:set FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----"
   heroku config:set FIREBASE_CLIENT_EMAIL=your-client-email
   heroku config:set FIREBASE_CLIENT_ID=your-client-id
   heroku config:set FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   heroku config:set FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   ```

5. **Deploy:**
   ```bash
   git subtree push --prefix=backend heroku main
   ```

6. **Verify Deployment:**
   ```bash
   heroku open
   # Your app will be available at: https://your-app-name.herokuapp.com
   ```

### Alternative Backend Hosting (Railway)

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder

2. **Add PostgreSQL:**
   - Add PostgreSQL service in Railway dashboard
   - Connect to your app

3. **Set environment variables in Railway dashboard:**
   - Same variables as Heroku above

4. **Deploy:**
   - Railway auto-deploys on git push

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379/0
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

## 📁 Project Structure

```
collabcanvas-mvp-24/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── schemas/         # Data validation
│   │   ├── middleware/      # Auth middleware
│   │   └── socket_handlers/ # Socket.IO handlers
│   ├── tests/               # Backend tests
│   ├── requirements.txt     # Python dependencies
│   └── run.py              # Flask app entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
└── README.md
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Database connection issues:**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running locally

3. **Firebase authentication errors:**
   - Verify Firebase project configuration
   - Check environment variables

4. **Socket.IO connection issues:**
   - Ensure CORS is properly configured
   - Check API_URL in frontend .env.local

### Getting Help

- Check the logs: `heroku logs --tail` (for Heroku)
- Review environment variables in hosting dashboard
- Test locally first before deploying

## 🎯 Features

- ✅ Real-time collaborative canvas
- ✅ Multiplayer cursors with names
- ✅ Shape creation (rectangles, circles, text)
- ✅ Pan and zoom functionality
- ✅ User authentication (Firebase)
- ✅ Canvas permissions and invitations
- ✅ Presence awareness
- ✅ Object synchronization
- ✅ Responsive design

## 📝 License

MIT License - see LICENSE file for details.

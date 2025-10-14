import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SocketProvider } from './hooks/useSocket'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import CanvasPage from './components/CanvasPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/canvas/:canvasId" 
              element={
                <ProtectedRoute>
                  <CanvasPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App

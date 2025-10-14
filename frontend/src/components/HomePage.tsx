import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Eye, Edit3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { canvasAPI } from '../services/api'
import { Canvas } from '../types'
import toast from 'react-hot-toast'

const HomePage: React.FC = () => {
  const { user, isAuthenticated, signIn } = useAuth()
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCanvasTitle, setNewCanvasTitle] = useState('')
  const [newCanvasDescription, setNewCanvasDescription] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      loadCanvases()
    }
  }, [isAuthenticated])

  const loadCanvases = async () => {
    try {
      setIsLoading(true)
      const response = await canvasAPI.getCanvases()
      setCanvases(response.canvases)
    } catch (error) {
      console.error('Failed to load canvases:', error)
      toast.error('Failed to load canvases')
    } finally {
      setIsLoading(false)
    }
  }

  const createCanvas = async () => {
    if (!newCanvasTitle.trim()) {
      toast.error('Canvas title is required')
      return
    }

    try {
      const response = await canvasAPI.createCanvas({
        title: newCanvasTitle,
        description: newCanvasDescription,
        is_public: false
      })
      
      setCanvases(prev => [response.canvas, ...prev])
      setShowCreateModal(false)
      setNewCanvasTitle('')
      setNewCanvasDescription('')
      toast.success('Canvas created successfully!')
    } catch (error) {
      console.error('Failed to create canvas:', error)
      toast.error('Failed to create canvas')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="card p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CollabCanvas</h1>
            <p className="text-gray-600 mb-8">
              Real-time collaborative canvas for teams
            </p>
            <button
              onClick={signIn}
              className="btn btn-primary w-full"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CollabCanvas</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Canvas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Canvases</h2>
          <p className="text-gray-600">Create and collaborate on visual designs in real-time</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : canvases.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Edit3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No canvases yet</h3>
            <p className="text-gray-600 mb-6">Create your first canvas to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canvases.map((canvas) => (
              <Link
                key={canvas.id}
                to={`/canvas/${canvas.id}`}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {canvas.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>{canvas.object_count}</span>
                    <Users className="w-4 h-4" />
                    <span>{canvas.collaborator_count}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {canvas.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Updated {new Date(canvas.updated_at).toLocaleDateString()}</span>
                  {canvas.is_public && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Public
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Canvas Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Canvas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newCanvasTitle}
                  onChange={(e) => setNewCanvasTitle(e.target.value)}
                  className="input"
                  placeholder="Enter canvas title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newCanvasDescription}
                  onChange={(e) => setNewCanvasDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Enter canvas description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createCanvas}
                className="btn btn-primary"
              >
                Create Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage

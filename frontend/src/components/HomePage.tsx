import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Eye, Edit3, Trash2 } from 'lucide-react'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [canvasToDelete, setCanvasToDelete] = useState<Canvas | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadCanvases()
    }
  }, [isAuthenticated])

  // Handle keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showCreateModal || showDeleteModal) {
        if (event.key === 'Escape') {
          if (showCreateModal) {
            setShowCreateModal(false)
          }
          if (showDeleteModal) {
            handleDeleteCancel()
          }
        } else if (event.key === 'Tab') {
          // Trap focus within modal
          const modal = modalRef.current
          if (modal) {
            const focusableElements = modal.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            if (event.shiftKey) {
              if (document.activeElement === firstElement) {
                event.preventDefault()
                lastElement.focus()
              }
            } else {
              if (document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
              }
            }
          }
        }
      }
    }

    if (showCreateModal || showDeleteModal) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the title input when create modal opens
      if (showCreateModal) {
        setTimeout(() => {
          titleInputRef.current?.focus()
        }, 100)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showCreateModal, showDeleteModal])

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

  const handleDeleteClick = (canvas: Canvas, event: React.MouseEvent) => {
    event.preventDefault() // Prevent navigation to canvas
    event.stopPropagation() // Prevent event bubbling
    setCanvasToDelete(canvas)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!canvasToDelete) return

    try {
      setIsDeleting(true)
      await canvasAPI.deleteCanvas(canvasToDelete.id)
      
      // Remove canvas from local state
      setCanvases(prev => prev.filter(canvas => canvas.id !== canvasToDelete.id))
      
      setShowDeleteModal(false)
      setCanvasToDelete(null)
      toast.success('Canvas deleted successfully!')
    } catch (error) {
      console.error('Failed to delete canvas:', error)
      toast.error('Failed to delete canvas')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setCanvasToDelete(null)
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
                data-testid="create-canvas-button"
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
              data-testid="create-canvas-button-empty"
            >
              Create Canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="canvas-list">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className="card p-6 hover:shadow-md transition-shadow relative group"
                data-testid="canvas-list-item"
              >
                <Link
                  to={`/canvas/${canvas.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate pr-8">
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
                
                {/* Delete button - only show for owned canvases */}
                {user && canvas.owner_id === user.id && (
                  <button
                    onClick={(e) => handleDeleteClick(canvas, e)}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete canvas"
                    aria-label={`Delete canvas "${canvas.title}"`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Canvas Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-canvas-title"
          aria-describedby="create-canvas-description"
        >
          <div ref={modalRef} className="card p-6 w-full max-w-md">
            <h3 id="create-canvas-title" className="text-lg font-medium text-gray-900 mb-4">Create New Canvas</h3>
            <p id="create-canvas-description" className="sr-only">Create a new collaborative canvas with a title and optional description</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={newCanvasTitle}
                  onChange={(e) => setNewCanvasTitle(e.target.value)}
                  className="input"
                  placeholder="Enter canvas title"
                  data-testid="canvas-title-input"
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
                  data-testid="canvas-description-input"
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
                data-testid="create-canvas-submit"
              >
                Create Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && canvasToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-canvas-title"
          aria-describedby="delete-canvas-description"
        >
          <div ref={modalRef} className="card p-6 w-full max-w-md">
            <h3 id="delete-canvas-title" className="text-lg font-medium text-gray-900 mb-4">
              Delete Canvas
            </h3>
            <p id="delete-canvas-description" className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{canvasToDelete.title}</strong>"? 
              This action cannot be undone and will permanently remove the canvas and all its contents.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete Canvas'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage

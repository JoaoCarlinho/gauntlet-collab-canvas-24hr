import React, { useState, useRef, useEffect } from 'react'
import { X, Mail, MessageSquare, Send } from 'lucide-react'
import { collaborationAPI } from '../services/api'
import toast from 'react-hot-toast'

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  canvasId: string
  canvasTitle: string
}

const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  canvasId,
  canvasTitle
}) => {
  const [email, setEmail] = useState('')
  const [permissionType, setPermissionType] = useState<'view' | 'edit'>('view')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      emailInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('')
      setPermissionType('view')
      setMessage('')
      setErrors({})
    }
  }, [isOpen])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (message.length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      await collaborationAPI.inviteUser({
        canvas_id: canvasId,
        invitee_email: email.trim(),
        permission_type: permissionType
      })

      toast.success(`Invitation sent to ${email}`)
      onClose()
    } catch (error: any) {
      console.error('Failed to send invitation:', error)
      toast.error(error.response?.data?.error || 'Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Invite Collaborator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Canvas Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Canvas</h3>
            <p className="text-sm text-gray-600">{canvasTitle}</p>
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter collaborator's email address"
                disabled={isLoading}
              />
              <Mail className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Permission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permission Level *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="permission"
                  value="view"
                  checked={permissionType === 'view'}
                  onChange={(e) => setPermissionType(e.target.value as 'view' | 'edit')}
                  className="mr-3 text-primary-600 focus:ring-primary-500"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium text-gray-900">View Only</div>
                  <div className="text-sm text-gray-500">Can view and comment on the canvas</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="permission"
                  value="edit"
                  checked={permissionType === 'edit'}
                  onChange={(e) => setPermissionType(e.target.value as 'view' | 'edit')}
                  className="mr-3 text-primary-600 focus:ring-primary-500"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium text-gray-900">Edit</div>
                  <div className="text-sm text-gray-500">Can view, edit, and add objects to the canvas</div>
                </div>
              </label>
            </div>
          </div>

          {/* Optional Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Add a personal message to your invitation..."
              disabled={isLoading}
            />
            <div className="flex justify-between mt-1">
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {message.length}/1000 characters
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteCollaboratorModal

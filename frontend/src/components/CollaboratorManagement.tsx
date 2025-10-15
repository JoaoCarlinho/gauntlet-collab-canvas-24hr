import React, { useState, useEffect } from 'react'
import { Users, Mail, Clock, CheckCircle, XCircle, MoreVertical, Trash2 } from 'lucide-react'
import { collaborationAPI } from '../services/api'
import toast from 'react-hot-toast'

interface Collaborator {
  id: string
  user_id: string
  email: string
  display_name?: string
  permission_type: 'view' | 'edit'
  granted_at: string
  granted_by: string
}

interface Invitation {
  id: string
  canvas_id: string
  inviter_id: string
  invitee_email: string
  permission_type: 'view' | 'edit'
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

interface CollaboratorManagementProps {
  canvasId: string
  isOwner: boolean
}

const CollaboratorManagement: React.FC<CollaboratorManagementProps> = ({
  canvasId,
  isOwner
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedInvitation, setExpandedInvitation] = useState<string | null>(null)

  useEffect(() => {
    if (isOwner) {
      loadCollaborators()
      loadInvitations()
    }
  }, [canvasId, isOwner])

  const loadCollaborators = async () => {
    try {
      const response = await collaborationAPI.getCollaborators(canvasId)
      setCollaborators(response.collaborators)
    } catch (error) {
      console.error('Failed to load collaborators:', error)
      toast.error('Failed to load collaborators')
    }
  }

  const loadInvitations = async () => {
    try {
      const response = await collaborationAPI.getCanvasInvitations(canvasId)
      setInvitations(response.invitations)
    } catch (error) {
      console.error('Failed to load invitations:', error)
      toast.error('Failed to load invitations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await collaborationAPI.resendInvitation(invitationId)
      toast.success('Invitation resent successfully')
    } catch (error: any) {
      console.error('Failed to resend invitation:', error)
      toast.error(error.response?.data?.error || 'Failed to resend invitation')
    }
  }

  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return
    }

    try {
      await collaborationAPI.removeCollaborator(canvasId, userId)
      setCollaborators(prev => prev.filter(c => c.user_id !== userId))
      toast.success('Collaborator removed successfully')
    } catch (error: any) {
      console.error('Failed to remove collaborator:', error)
      toast.error(error.response?.data?.error || 'Failed to remove collaborator')
    }
  }

  const handleUpdatePermission = async (userId: string, newPermission: 'view' | 'edit') => {
    try {
      await collaborationAPI.updateCollaboratorPermission(canvasId, userId, newPermission)
      setCollaborators(prev => 
        prev.map(c => 
          c.user_id === userId ? { ...c, permission_type: newPermission } : c
        )
      )
      toast.success('Permission updated successfully')
    } catch (error: any) {
      console.error('Failed to update permission:', error)
      toast.error(error.response?.data?.error || 'Failed to update permission')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'accepted':
        return 'text-green-600 bg-green-100'
      case 'declined':
        return 'text-red-600 bg-red-100'
      case 'expired':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (!isOwner) {
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Collaborators Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
              {collaborators.length}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {collaborators.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No collaborators yet</p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {(collaborator.display_name || collaborator.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {collaborator.display_name || collaborator.email}
                      </p>
                      <p className="text-sm text-gray-500">{collaborator.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={collaborator.permission_type}
                      onChange={(e) => handleUpdatePermission(collaborator.user_id, e.target.value as 'view' | 'edit')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>
                    
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove collaborator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invitations Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
              {invitations.filter(inv => inv.status === 'pending' && !isExpired(inv.expires_at)).length}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {invitations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No invitations sent yet</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.invitee_email}</p>
                        <p className="text-sm text-gray-500">
                          {invitation.permission_type === 'edit' ? 'Edit' : 'View'} permission
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1 capitalize">{invitation.status}</span>
                      </span>
                      
                      <button
                        onClick={() => setExpandedInvitation(
                          expandedInvitation === invitation.id ? null : invitation.id
                        )}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {expandedInvitation === invitation.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Sent</p>
                          <p className="font-medium">{formatDate(invitation.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expires</p>
                          <p className={`font-medium ${isExpired(invitation.expires_at) ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(invitation.expires_at)}
                          </p>
                        </div>
                      </div>
                      
                      {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-300 rounded hover:bg-primary-50 transition-colors"
                          >
                            Resend Invitation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaboratorManagement

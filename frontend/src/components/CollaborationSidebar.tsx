import React, { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Settings, 
  Bell, 
  MessageSquare, 
  Activity,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { collaborationAPI } from '../services/api'
import toast from 'react-hot-toast'
import InviteCollaboratorModal from './InviteCollaboratorModal'
import CollaboratorManagement from './CollaboratorManagement'
import PresenceIndicators from './PresenceIndicators'
import UserStatus from './UserStatus'

interface CollaborationSidebarProps {
  canvasId: string
  canvasTitle: string
  currentUserId: string
  isOwner: boolean
  isOpen: boolean
  onClose: () => void
}

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

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
  canvasId,
  canvasTitle,
  currentUserId,
  isOwner,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'presence' | 'collaborators' | 'invitations' | 'notifications'>('presence')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['presence']))

  useEffect(() => {
    if (isOpen) {
      loadCollaborationData()
    }
  }, [isOpen, canvasId])

  const loadCollaborationData = async () => {
    setIsLoading(true)
    try {
      if (isOwner) {
        const [collaboratorsRes, invitationsRes] = await Promise.all([
          collaborationAPI.getCollaborators(canvasId),
          collaborationAPI.getCanvasInvitations(canvasId)
        ])
        setCollaborators(collaboratorsRes.collaborators)
        setInvitations(invitationsRes.invitations)
      }
    } catch (error) {
      console.error('Failed to load collaboration data:', error)
      toast.error('Failed to load collaboration data')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Collaboration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">{canvasTitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: 'presence', label: 'Presence', icon: Users },
          { id: 'collaborators', label: 'People', icon: Users },
          { id: 'invitations', label: 'Invites', icon: UserPlus },
          { id: 'notifications', label: 'Activity', icon: Bell }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'presence' && (
          <div className="p-4 space-y-4">
            {/* User Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Your Status</h3>
              <UserStatus 
                userId={currentUserId} 
                canvasId={canvasId}
                compact={false}
              />
            </div>

            {/* Active Users */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Active Users</h3>
              <PresenceIndicators 
                canvasId={canvasId} 
                currentUserId={currentUserId}
                maxVisible={10}
                showTooltips={false}
              />
            </div>

            {/* Activity Feed */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">User joined the canvas</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <Edit3 className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Object was created</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaborators' && (
          <div className="p-4">
            {isOwner ? (
              <CollaboratorManagement 
                canvasId={canvasId} 
                isOwner={isOwner} 
              />
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Only canvas owners can manage collaborators</p>
                </div>
                
                {/* Show current collaborators for non-owners */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Collaborators</h3>
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {(collaborator.display_name || collaborator.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {collaborator.display_name || collaborator.email}
                          </p>
                          <p className="text-sm text-gray-500">{collaborator.email}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {collaborator.permission_type === 'edit' ? (
                            <Edit3 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-xs text-gray-500 capitalize">
                            {collaborator.permission_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="p-4">
            {isOwner ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Invitations</h3>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No invitations sent yet</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Send First Invitation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserPlus className="w-3 h-3 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900">{invitation.invitee_email}</span>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="capitalize">{invitation.permission_type} permission</span>
                          <span>{formatDate(invitation.created_at)}</span>
                        </div>
                        {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                // Handle resend invitation
                                toast.success('Invitation resent')
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              Resend Invitation
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Only canvas owners can manage invitations</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Activity Feed</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Invitation accepted</p>
                  <p className="text-xs text-gray-500">john@example.com joined the canvas</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Object created</p>
                  <p className="text-xs text-gray-500">Rectangle added to canvas</p>
                  <p className="text-xs text-gray-400 mt-1">15 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Invitation sent</p>
                  <p className="text-xs text-gray-500">Invited jane@example.com</p>
                  <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invitation Modal */}
      <InviteCollaboratorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        canvasId={canvasId}
        canvasTitle={canvasTitle}
      />
    </div>
  )
}

export default CollaborationSidebar

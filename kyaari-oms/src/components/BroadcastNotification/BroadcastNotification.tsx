// @ts-nocheck
// Admin Broadcast Notification Component
// Allows admins to send notifications to all users or specific roles

import React, { useState } from 'react';
import { Send, Users, AlertTriangle, Info, Clock } from 'lucide-react';
import { ApiService } from '../../services/api';

interface BroadcastFormData {
  title: string;
  message: string;
  targetType: 'all' | 'role';
  role?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface BroadcastNotificationProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const BroadcastNotification: React.FC<BroadcastNotificationProps> = ({
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    message: '',
    targetType: 'all',
    role: 'ADMIN',
    priority: 'MEDIUM'
  });
  
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'ADMIN', label: 'Administrators', icon: Users },
    { value: 'OPERATIONS', label: 'Operations Team', icon: Users },
    { value: 'ACCOUNTS', label: 'Accounts Team', icon: Users },
    { value: 'VENDOR', label: 'Vendors', icon: Users }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertTriangle size={16} className="text-red-600" />;
      case 'HIGH': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'MEDIUM': return <Info size={16} className="text-blue-600" />;
      case 'LOW': return <Clock size={16} className="text-gray-600" />;
      default: return <Info size={16} className="text-blue-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      onError?.('Title and message are required');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (formData.targetType === 'all') {
        // Broadcast to all users
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ApiService.getCurrentUserFromStorage()?.id}` // This will be corrected by API interceptor
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            priority: formData.priority,
            data: {
              type: 'ADMIN_BROADCAST',
              timestamp: new Date().toISOString()
            }
          })
        });
        
        result = await response.json();
      } else {
        // Broadcast to specific role
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/notifications/broadcast/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ApiService.getCurrentUserFromStorage()?.id}` // This will be corrected by API interceptor
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            role: formData.role,
            priority: formData.priority,
            data: {
              type: 'ROLE_BROADCAST',
              timestamp: new Date().toISOString()
            }
          })
        });
        
        result = await response.json();
      }

      if (result.success) {
        // Reset form
        setFormData({
          title: '',
          message: '',
          targetType: 'all',
          role: 'ADMIN',
          priority: 'MEDIUM'
        });
        
        onSuccess?.(result.data);
      } else {
        onError?.(result.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Broadcast notification error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Send className="text-blue-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-900">Send Broadcast Notification</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Send To</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={formData.targetType === 'all'}
                onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value as 'all' | 'role' }))}
                className="mr-2"
              />
              <span className="text-sm">All Users</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="targetType"
                value="role"
                checked={formData.targetType === 'role'}
                onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value as 'all' | 'role' }))}
                className="mr-2"
              />
              <span className="text-sm">Specific Role</span>
            </label>
          </div>
        </div>

        {/* Role Selection */}
        {formData.targetType === 'role' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: option.value as any }))}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  formData.priority === option.value
                    ? `${option.bg} ${option.color} border-current`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getPriorityIcon(option.value)}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter notification title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            required
          />
          <div className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter notification message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
            required
          />
          <div className="text-xs text-gray-500 mt-1">{formData.message.length}/500 characters</div>
        </div>

        {/* Preview */}
        {(formData.title || formData.message) && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
            <div className="bg-white rounded border-l-4 border-blue-500 p-3">
              <div className="flex items-start gap-2">
                {getPriorityIcon(formData.priority)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{formData.title || 'Notification Title'}</div>
                  <div className="text-sm text-gray-600 mt-1">{formData.message || 'Notification message'}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    To: {formData.targetType === 'all' ? 'All Users' : roleOptions.find(r => r.value === formData.role)?.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BroadcastNotification;
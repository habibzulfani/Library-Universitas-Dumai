'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CameraIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { authAPI, Department, publicAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    nim_nidn: '',
    department_id: '',
    faculty: '' as 'Fakultas Ekonomi' | 'Fakultas Ilmu Komputer' | 'Fakultas Hukum' | '',
    address: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [message, setMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        nim_nidn: user.nim_nidn || '',
        department_id: user.department_id?.toString() || '',
        faculty: user.faculty || '',
        address: user.address || '',
      });
      if (user.profile_picture_url) {
        setPreviewUrl(user.profile_picture_url);
      }
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!editData.faculty) return;
      setIsLoadingDepartments(true);
      try {
        const response = await publicAPI.getDepartments(editData.faculty);
        setDepartments(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        toast.error('Failed to load departments');
      } finally {
        setIsLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [editData.faculty]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-[#38b36c] text-white rounded-lg hover:bg-[#2e8c55] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        nim_nidn: user.nim_nidn || '',
        department_id: user.department_id?.toString() || '',
        faculty: user.faculty || '',
        address: user.address || '',
      });
      setProfilePicture(null);
      setPreviewUrl(user.profile_picture_url || null);
    }
    setMessage('');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('nim_nidn', editData.nim_nidn);
      formData.append('department_id', editData.department_id);
      formData.append('faculty', editData.faculty);
      formData.append('address', editData.address);
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }

      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
      toast.success('Password changed successfully!');
    } catch {
      toast.error('Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!user) return null;

    if (user.status === 'active' && user.is_approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Active
        </span>
      );
    } else if (user.status === 'pending' || !user.is_approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending Approval
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Inactive
        </span>
      );
    }
  };

  const getUserTypeBadge = () => {
    if (!user) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.user_type === 'lecturer'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-purple-100 text-purple-800'
        }`}>
        <AcademicCapIcon className="h-3 w-3 mr-1" />
        {user.user_type === 'lecturer' ? 'Lecturer' : 'Student'}
      </span>
    );
  };

  const getRoleBadge = () => {
    if (!user) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800'
        }`}>
        <ShieldCheckIcon className="h-3 w-3 mr-1" />
        {user.role === 'admin' ? 'Administrator' : 'User'}
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/dashboard" className="hover:text-[#38b36c] flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Profile</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#38b36c] to-[#2e8c55] px-6 py-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30">
                        {previewUrl ? (
                          <Image
                            src={previewUrl}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <UserIcon className="h-10 w-10 text-white" />
                        )}
                      </div>
                      {isEditing && (
                        <label
                          htmlFor="profile-picture"
                          className="absolute -bottom-1 -right-1 h-8 w-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-50 transition-colors"
                        >
                          <CameraIcon className="h-4 w-4 text-[#38b36c]" />
                        </label>
                      )}
                    </div>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        {user?.name || 'User Profile'}
                      </h1>
                      <div className="flex items-center space-x-2 mt-2">
                        {getUserTypeBadge()}
                        {getRoleBadge()}
                        {getStatusBadge()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-4 w-full sm:w-auto justify-end">
                    {!isEditing && !isChangingPassword && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors w-full sm:w-auto"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setIsChangingPassword(true)}
                          className="flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-sm font-medium text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors w-full sm:w-auto"
                        >
                          <KeyIcon className="h-4 w-4 mr-2" />
                          Change Password
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {message && (
                  <div className={`mb-6 p-4 rounded-lg border ${message.includes('success')
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {message}
                  </div>
                )}

                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        }}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#38b36c] hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editData.name}
                            onChange={handleChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border">
                            {user?.name || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg border">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <p className="text-gray-900">
                            {user?.email || 'Not provided'}
                          </p>
                          {user?.email_verified && (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" title="Email verified" />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {user?.user_type === 'lecturer' ? 'NIDN' : 'NIM'}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="nim_nidn"
                            value={editData.nim_nidn}
                            onChange={handleChange}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                          />
                        ) : (
                          <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border">
                            {user?.nim_nidn || 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        {isEditing ? (
                          <select
                            name="department_id"
                            value={editData.department_id}
                            onChange={handleChange}
                            disabled={isLoadingDepartments}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg border">
                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <p className="text-gray-900">
                              {typeof user?.department === 'object' && user?.department !== null
                                ? user.department.name
                                : user?.department || 'Not provided'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        {isEditing ? (
                          <textarea
                            name="address"
                            value={editData.address}
                            onChange={handleChange}
                            rows={3}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                            placeholder="Enter your address..."
                          />
                        ) : (
                          <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg border">
                            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <p className="text-gray-900">{user?.address || 'Not provided'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faculty
                      </label>
                      {isEditing ? (
                        <select
                          name="faculty"
                          value={editData.faculty}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38b36c] focus:border-[#38b36c] transition-colors"
                        >
                          <option value="">Select Faculty</option>
                          <option value="Fakultas Ekonomi">Fakultas Ekonomi</option>
                          <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                          <option value="Fakultas Hukum">Fakultas Hukum</option>
                        </select>
                      ) : (
                        <div className="flex items-center bg-gray-50 px-4 py-3 rounded-lg border">
                          <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <p className="text-gray-900">
                            {user?.faculty || 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          onClick={handleCancel}
                          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#38b36c] hover:bg-[#2e8c55] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38b36c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isLoading ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verification</span>
                  {user?.email_verified ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Approval</span>
                  {user?.is_approved ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${user?.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user?.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <span>User ID: {user?.id}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  Go to Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-3" />
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client'

import { useEffect, useState } from 'react'
import { supabase, Resource } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Modal from '@/components/Modal'
import { FiFileText, FiDownload, FiEye, FiImage, FiFile, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'

export default function ResourcesPage() {
  const { user, activeOrgId, isTeamLeadInActiveOrg } = useAuthStore()
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'resources'
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchResources()
  }, [activeOrgId])

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('org_id', activeOrgId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setResources(data)
    }
    setLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !user || !isTeamLeadInActiveOrg || !activeOrgId) return

    setUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${selectedFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      // Save resource metadata to database
      const { error: dbError } = await supabase.from('resources').insert({
        org_id: activeOrgId,
        title: formData.title,
        description: formData.description,
        file_name: selectedFile.name,
        file_path: fileName,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: user.id,
      })

      if (dbError) throw dbError

      // Log activity
      await supabase.from('activity_logs').insert({
        org_id: activeOrgId,
        action: 'resource_uploaded',
        user_id: user.id,
        user_name: user.name,
        details: `Uploaded resource "${formData.title}"`,
      })

      // Reset form
      setFormData({ title: '', description: '' })
      setSelectedFile(null)
      setIsUploadModalOpen(false)
      fetchResources()
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Failed to upload file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (resource: Resource) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(resource.file_path)

    if (error) {
      alert('Failed to download file')
      return
    }

    // Create download link
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = resource.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePreview = async (resource: Resource) => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(resource.file_path)

    window.open(data.publicUrl, '_blank')
  }

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) return

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([resource.file_path])

    if (storageError) {
      alert('Failed to delete file from storage')
      return
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resource.id)

    if (!dbError) {
      await supabase.from('activity_logs').insert({
        org_id: activeOrgId,
        action: 'resource_deleted',
        user_id: user?.id,
        user_name: user?.name || '',
        details: `Deleted resource "${resource.title}"`,
      })
      fetchResources()
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return FiImage
    if (fileType.includes('pdf')) return FiFileText
    return FiFile
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(2)} KB`
    return `${mb.toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading resources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Resources & Downloads</h1>
          <p className="text-gray-400">Project documentation, diagrams, and reference materials</p>
        </div>
        {isTeamLeadInActiveOrg && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <FiPlus />
            <span>Upload Resource</span>
          </button>
        )}
      </div>

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const Icon = getFileIcon(resource.file_type)
            return (
              <div
                key={resource.id}
                className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="text-primary text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold mb-1 truncate">{resource.title}</h3>
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">{resource.description || 'No description'}</p>
                    <p className="text-gray-500 text-xs">{formatFileSize(resource.file_size)}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiDownload />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handlePreview(resource)}
                    className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiEye />
                    <span>Preview</span>
                  </button>
                  {isTeamLeadInActiveOrg && (
                    <button
                      onClick={() => handleDelete(resource)}
                      className="bg-dark-bg border border-gray-700 text-red-500 px-3 py-2 rounded-lg text-sm hover:border-red-500 transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-dark-card p-12 rounded-xl border border-gray-700 text-center">
          <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFile className="text-gray-600 text-4xl" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Resources Yet</h3>
          <p className="text-gray-400 mb-6">
            {isTeamLeadInActiveOrg 
              ? 'Upload project files, documentation, and resources for your team.'
              : 'No resources have been uploaded yet.'}
          </p>
          {isTeamLeadInActiveOrg && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
            >
              <FiPlus />
              <span>Upload First Resource</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Resource"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary"
              placeholder="e.g., Project Documentation"
              required
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-dark-bg border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-primary resize-none"
              rows={3}
              placeholder="Brief description of the resource"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">File *</label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                required
              />
              <label
                htmlFor="file-upload"
                className="w-full bg-dark-bg border border-gray-700 text-gray-400 px-4 py-3 rounded-lg cursor-pointer hover:border-primary transition-colors flex items-center justify-center space-x-2"
              >
                <FiUpload />
                <span>{selectedFile ? selectedFile.name : 'Choose a file'}</span>
              </label>
            </div>
            {selectedFile && (
              <p className="text-xs text-gray-500 mt-2">
                Size: {formatFileSize(selectedFile.size)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

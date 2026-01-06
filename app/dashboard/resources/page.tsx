'use client'

import { FiFileText, FiDownload, FiEye, FiImage } from 'react-icons/fi'

const resources = [
  {
    id: 1,
    title: 'Project Documentation',
    description: 'Complete project requirements and specifications',
    type: 'PDF',
    icon: FiFileText,
  },
  {
    id: 2,
    title: 'System Architecture',
    description: 'Technical architecture diagrams and flowcharts',
    type: 'Image',
    icon: FiImage,
  },
  {
    id: 3,
    title: 'API Reference',
    description: 'Complete API documentation and endpoints',
    type: 'PDF',
    icon: FiFileText,
  },
  {
    id: 4,
    title: 'User Guide',
    description: 'Step-by-step user manual for the application',
    type: 'PDF',
    icon: FiFileText,
  },
]

export default function ResourcesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white text-3xl font-bold mb-2">Resources & Downloads</h1>
        <p className="text-gray-400">Project documentation, diagrams, and reference materials</p>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <div
              key={resource.id}
              className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary transition-colors"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="text-primary text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-1">{resource.title}</h3>
                  <p className="text-gray-400 text-sm">{resource.description}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors flex items-center justify-center space-x-2">
                  <FiDownload />
                  <span>Download</span>
                </button>
                <button className="flex-1 bg-dark-bg border border-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:border-primary transition-colors flex items-center justify-center space-x-2">
                  <FiEye />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sample Resources Note */}
      <div className="mt-8 bg-dark-card p-6 rounded-xl border border-gray-700">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiDownload className="text-primary text-xl" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-2">Sample Resources</h3>
            <p className="text-gray-400 text-sm mb-4">
              The above are placeholder resources. Team leads can add actual project files through the database.
              To integrate real file uploads, you would need to:
            </p>
            <ul className="text-gray-500 text-sm space-y-2 list-disc list-inside">
              <li>Set up Supabase Storage buckets for file uploads</li>
              <li>Create a resources table in the database</li>
              <li>Implement file upload functionality for team leads</li>
              <li>Add download and preview handlers for different file types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

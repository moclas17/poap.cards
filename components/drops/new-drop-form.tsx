'use client'

import { useState } from 'react'

interface NewDropFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewDropForm({ isOpen, onClose, onSuccess }: NewDropFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropPreview, setDropPreview] = useState<{
    title: string
    description: string
    image: string
    totalCodes: number
  } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.txt')) {
      setError('Please select a .txt file')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Process file to extract URLs and preview data
    const text = await selectedFile.text()
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    console.log('File content preview:', text.substring(0, 200))
    console.log('Total lines:', lines.length)

    // Look for URLs containing POAP-related domains (support both http and https)
    const urls = lines.filter(line => {
      return (line.includes('http://') || line.includes('https://')) && (
        line.toLowerCase().includes('poap.xyz') ||
        line.toLowerCase().includes('app.poap.xyz') ||
        line.toLowerCase().includes('poap.delivery') ||
        line.toLowerCase().includes('poap.tech')
      )
    })

    console.log('Found POAP URLs:', urls.length)

    // If no POAP URLs found, look for any http/https URLs
    if (urls.length === 0) {
      const anyUrls = lines.filter(line => line.includes('http://') || line.includes('https://'))
      console.log('Found any URLs:', anyUrls.length, anyUrls.slice(0, 3))

      if (anyUrls.length > 0) {
        setError(`Found ${anyUrls.length} URLs but none appear to be POAP URLs. Please ensure your file contains POAP URLs like http://POAP.xyz/mint/xxx or https://poap.xyz/claim/xxx`)
        return
      }
    }

    if (urls.length === 0) {
      setError('No valid POAP URLs found in file. Please upload a .txt file with POAP URLs (like http://POAP.xyz/mint/xxx or https://poap.xyz/claim/xxx), one per line.')
      return
    }

    setLoading(true)
    try {
      // Extract metadata from first URL
      const response = await fetch('/api/drops/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urls[0] })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch POAP metadata')
      }

      const metadata = await response.json()
      setDropPreview({
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        totalCodes: urls.length
      })
    } catch (err) {
      setError('Failed to extract POAP metadata')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !dropPreview) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', dropPreview.title)
      formData.append('description', dropPreview.description)
      formData.append('image', dropPreview.image)

      const response = await fetch('/api/drops/create', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to create drop')
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create drop')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setDropPreview(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Create New Drop</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload POAP URLs (.txt file)
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a .txt file with one POAP claim URL per line
              </p>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Processing file...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {dropPreview && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Drop Preview</h3>
                <div className="flex items-start space-x-4">
                  <img
                    src={dropPreview.image}
                    alt={dropPreview.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{dropPreview.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{dropPreview.description}</p>
                    <p className="text-sm text-primary font-medium mt-2">
                      {dropPreview.totalCodes} POAP codes
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!dropPreview || loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Drop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
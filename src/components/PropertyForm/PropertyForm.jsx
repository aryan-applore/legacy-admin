import { useState } from 'react'
import { FileText, ExternalLink, Trash2 } from 'lucide-react'

function PropertyForm({ 
  propertyData, 
  onChange, 
  projects = [], 
  isEditMode = false,
  showGallery = false,
  showDocuments = false,
  galleryImages = [],
  loadingGallery = false,
  onUploadGalleryImage,
  onQueueGalleryFile,
  pendingGalleryFiles = [],
  documents = [],
  loadingDocuments = false,
  onUploadDocument,
  onQueueDocument,
  pendingDocuments = [],
  onDeleteDocument
}) {
  const [galleryFile, setGalleryFile] = useState(null)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [documentFile, setDocumentFile] = useState(null)
  const [documentType, setDocumentType] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [uploadingDocument, setUploadingDocument] = useState(false)

  // Use propertyData directly - it's controlled by parent
  const formData = propertyData || {
    flatNo: '',
    buildingName: '',
    projectId: '',
    specifications: {
      area: '',
      bedrooms: '',
      bathrooms: '',
      balconies: '',
      floor: '',
      facing: ''
    },
    pricing: {
      totalPrice: '',
      pricePerSqft: '',
      bookingAmount: ''
    },
    status: 'active',
    possessionDate: '',
    progressPercentage: 0,
    currentStage: 'foundation'
  }

  const handleInputChange = (field, value) => {
    if (onChange) {
      const updated = { ...formData, [field]: value }
      onChange(updated)
    }
  }

  const handleNestedChange = (parent, field, value) => {
    if (onChange) {
      const updated = {
        ...formData,
        [parent]: {
          ...(formData[parent] || {}),
          [field]: value
        }
      }
      onChange(updated)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        e.target.value = ''
        return
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        e.target.value = ''
        return
      }
      setGalleryFile(file)
    }
  }

  const handleUploadGallery = async () => {
    if (galleryFile && onUploadGalleryImage) {
      setUploadingImage(true)
      try {
        await onUploadGalleryImage(galleryFile, galleryCaption)
        setGalleryFile(null)
        setGalleryCaption('')
        // Reset file input
        const fileInput = document.getElementById('gallery-file-input')
        if (fileInput) {
          fileInput.value = ''
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        e.target.value = ''
        return
      }
      setDocumentFile(file)
    }
  }

  const handleUploadDocument = async () => {
    if (documentFile && documentType && documentTitle && onUploadDocument) {
      setUploadingDocument(true)
      try {
        await onUploadDocument(documentFile, documentType, documentTitle, documentDescription)
        setDocumentFile(null)
        setDocumentType('')
        setDocumentTitle('')
        setDocumentDescription('')
        const fileInput = document.getElementById('document-file-input')
        if (fileInput) {
          fileInput.value = ''
        }
      } catch (error) {
        console.error('Error uploading document:', error)
      } finally {
        setUploadingDocument(false)
      }
    }
  }

  return (
    <div>
      {/* Project Selection (only for add mode) */}
      {!isEditMode && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Project *
          </label>
          <select
            value={formData.projectId || ''}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project._id || project.id} value={project._id || project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Basic Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Flat/Unit Number *
          </label>
          <input
            type="text"
            value={formData.flatNo || ''}
            onChange={(e) => handleInputChange('flatNo', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Building Name
          </label>
          <input
            type="text"
            value={formData.buildingName || ''}
            onChange={(e) => handleInputChange('buildingName', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Status
        </label>
        <select
          value={formData.status || 'active'}
          onChange={(e) => handleInputChange('status', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Specifications */}
      <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Specifications</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Area (sqft)
          </label>
          <input
            type="number"
            value={formData.specifications?.area || ''}
            onChange={(e) => handleNestedChange('specifications', 'area', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Bedrooms
          </label>
          <input
            type="number"
            value={formData.specifications?.bedrooms || ''}
            onChange={(e) => handleNestedChange('specifications', 'bedrooms', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Bathrooms
          </label>
          <input
            type="number"
            value={formData.specifications?.bathrooms || ''}
            onChange={(e) => handleNestedChange('specifications', 'bathrooms', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Floor
          </label>
          <input
            type="number"
            value={formData.specifications?.floor || ''}
            onChange={(e) => handleNestedChange('specifications', 'floor', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Facing
          </label>
          <input
            type="text"
            value={formData.specifications?.facing || ''}
            onChange={(e) => handleNestedChange('specifications', 'facing', e.target.value)}
            placeholder="e.g., North, South, East, West"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Balconies
          </label>
          <input
            type="number"
            value={formData.specifications?.balconies || ''}
            onChange={(e) => handleNestedChange('specifications', 'balconies', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Pricing */}
      <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Pricing</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Total Price (₹)
          </label>
          <input
            type="number"
            value={formData.pricing?.totalPrice || ''}
            onChange={(e) => handleNestedChange('pricing', 'totalPrice', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Price per sqft (₹)
          </label>
          <input
            type="number"
            value={formData.pricing?.pricePerSqft || ''}
            onChange={(e) => handleNestedChange('pricing', 'pricePerSqft', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Booking Amount (₹)
          </label>
          <input
            type="number"
            value={formData.pricing?.bookingAmount || ''}
            onChange={(e) => handleNestedChange('pricing', 'bookingAmount', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Dates and Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Possession Date
          </label>
          <input
            type="date"
            value={formData.possessionDate || ''}
            onChange={(e) => handleInputChange('possessionDate', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Progress Percentage (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.progressPercentage || 0}
            onChange={(e) => handleInputChange('progressPercentage', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Current Stage */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Current Stage
        </label>
        <div style={{ display: 'flex', gap: '24px', marginTop: '8px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="currentStage"
              value="foundation"
              checked={formData.currentStage === 'foundation'}
              onChange={(e) => handleInputChange('currentStage', e.target.value)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
              required
            />
            <span>Foundation</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="currentStage"
              value="structure"
              checked={formData.currentStage === 'structure'}
              onChange={(e) => handleInputChange('currentStage', e.target.value)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Structure</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="currentStage"
              value="finishing"
              checked={formData.currentStage === 'finishing'}
              onChange={(e) => handleInputChange('currentStage', e.target.value)}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Finishing</span>
          </label>
        </div>
      </div>

      {/* Gallery Section (edit or create) */}
      {showGallery && (
        <div className="details-section" style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Project Gallery</h4>
          {isEditMode ? (
            loadingGallery ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading gallery...</p>
            ) : galleryImages.length > 0 ? (
              <div className="gallery-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '12px',
                marginTop: '12px',
                marginBottom: '12px'
              }}>
                {galleryImages.map((img) => (
                  <div key={img.id} className="gallery-item" style={{ position: 'relative' }}>
                    <img 
                      src={img.url} 
                      alt={img.caption || 'Gallery image'} 
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(img.url, '_blank')}
                    />
                    {img.caption && (
                      <p style={{ 
                        fontSize: '0.75em', 
                        color: 'var(--text-secondary)', 
                        marginTop: '4px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No gallery images yet</p>
            )
          ) : (
            pendingGalleryFiles.length > 0 ? (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Queued gallery images:</p>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {pendingGalleryFiles.map((item, idx) => (
                    <li key={idx} style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                      {item.file?.name || 'Image'} {item.caption ? `- ${item.caption}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No gallery images queued</p>
            )
          )}
          <div style={{ marginTop: '12px' }}>
            <input
              id="gallery-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            {galleryFile && (
              <p style={{ 
                fontSize: '0.875em', 
                color: 'var(--text-secondary)', 
                marginBottom: '8px' 
              }}>
                Selected: {galleryFile.name}
              </p>
            )}
            <input
              type="text"
              placeholder="Caption (optional)"
              value={galleryCaption}
              onChange={(e) => setGalleryCaption(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {isEditMode ? (
              <button 
                className="btn btn-primary" 
                onClick={handleUploadGallery}
                disabled={!galleryFile || uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Gallery Image'}
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (!galleryFile) return
                  if (onQueueGalleryFile) {
                    onQueueGalleryFile(galleryFile, galleryCaption)
                    setGalleryFile(null)
                    setGalleryCaption('')
                    const fileInput = document.getElementById('gallery-file-input')
                    if (fileInput) fileInput.value = ''
                  }
                }}
                disabled={!galleryFile}
              >
                Add to Gallery Queue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Documents Section is disabled here; use Document Management page */}
      {showDocuments && isEditMode && (
        <div className="details-section" style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            Documents
          </h4>
          {loadingDocuments ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading documents...</p>
          ) : documents.length > 0 ? (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.map((doc) => (
                <div key={doc.id || doc._id} style={{ 
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FileText size={16} style={{ color: '#6b7280' }} />
                      <p style={{ fontWeight: '500', margin: 0 }}>
                        {doc.name || doc.fileName || 'Document'}
                      </p>
                    </div>
                    <div style={{ fontSize: '0.875em', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                      {doc.type && <span style={{ textTransform: 'capitalize' }}>{doc.type}</span>}
                      {doc.fileSize && <span> • {(doc.fileSize / 1024).toFixed(2)} KB</span>}
                      {doc.uploadedAt && <span> • {new Date(doc.uploadedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                    )}
                    {onDeleteDocument && (
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this document?')) {
                            onDeleteDocument(doc.id || doc._id)
                          }
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.875rem', color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>No documents uploaded yet</p>
          )}
          
          <div style={{ marginTop: '12px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h5 style={{ marginBottom: '12px', fontSize: '0.875rem', fontWeight: '600' }}>Upload New Document</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }}
                  required
                >
                  <option value="">Select Document Type</option>
                  <option>Welcome Letter</option>
                  <option>Sale Agreement</option>
                  <option>Payment Receipt</option>
                  <option>Invoice</option>
                  <option>Floor Plan</option>
                  <option>Construction Update</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g., Welcome Letter - 2024"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                  Upload File *
                </label>
                <input
                  id="document-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleDocumentFileChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                />
                {documentFile && (
                  <p style={{ fontSize: '0.75em', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Selected: {documentFile.name}
                  </p>
                )}
                <small style={{ fontSize: '0.75em', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                  Description (optional)
                </label>
                <textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  placeholder="Add any notes or description about this document"
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', resize: 'vertical' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleUploadDocument}
                disabled={!documentFile || !documentType || !documentTitle || uploadingDocument}
                style={{ alignSelf: 'flex-start' }}
              >
                {uploadingDocument ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyForm


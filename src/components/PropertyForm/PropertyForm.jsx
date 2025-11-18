import { useState } from 'react'

function PropertyForm({ 
  propertyData, 
  onChange, 
  projects = [], 
  isEditMode = false,
  showGallery = false,
  galleryImages = [],
  loadingGallery = false,
  onUploadGalleryImage
}) {
  const [galleryFile, setGalleryFile] = useState(null)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

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
    currentStage: ''
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
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="currentStage"
              value=""
              checked={!formData.currentStage || (formData.currentStage !== 'foundation' && formData.currentStage !== 'structure' && formData.currentStage !== 'finishing')}
              onChange={(e) => handleInputChange('currentStage', '')}
              style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>None</span>
          </label>
        </div>
      </div>

      {/* Gallery Section (only in edit mode) */}
      {showGallery && isEditMode && (
        <div className="details-section" style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Project Gallery</h4>
          {loadingGallery ? (
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
            <button 
              className="btn btn-primary" 
              onClick={handleUploadGallery}
              disabled={!galleryFile || uploadingImage}
            >
              {uploadingImage ? 'Uploading...' : 'Upload Gallery Image'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyForm


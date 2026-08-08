import { useRef, useState } from 'react'
import {
  createProduct,
  formatRelativeTime,
  getProductImageCropUrl,
  updateProduct,
} from '../api/products'
import { categories } from '../data/products'

const maxImages = 5
const cardImageAspectRatio = 1.18
const cropOutputHeight = 1100
const cropOutputWidth = Math.round(cropOutputHeight * cardImageAspectRatio)
const postCategories = categories.filter((category) => category !== 'All')

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function createCroppedFile(imageItem, crop) {
  const sourceImage = await loadImage(imageItem.cropSource || imageItem.preview)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const sourceAspectRatio = sourceImage.naturalWidth / sourceImage.naturalHeight
  const baseWidth = sourceAspectRatio > cardImageAspectRatio
    ? sourceImage.naturalHeight * cardImageAspectRatio
    : sourceImage.naturalWidth
  const baseHeight = sourceAspectRatio > cardImageAspectRatio
    ? sourceImage.naturalHeight
    : sourceImage.naturalWidth / cardImageAspectRatio
  const sourceWidth = baseWidth / crop.scale
  const sourceHeight = baseHeight / crop.scale
  const maxOffsetX = (sourceImage.naturalWidth - sourceWidth) / 2
  const maxOffsetY = (sourceImage.naturalHeight - sourceHeight) / 2
  const sourceX = Math.max(
    0,
    Math.min(
      sourceImage.naturalWidth - sourceWidth,
      sourceImage.naturalWidth / 2 - sourceWidth / 2 - crop.x * maxOffsetX,
    ),
  )
  const sourceY = Math.max(
    0,
    Math.min(
      sourceImage.naturalHeight - sourceHeight,
      sourceImage.naturalHeight / 2 - sourceHeight / 2 - crop.y * maxOffsetY,
    ),
  )

  canvas.width = cropOutputWidth
  canvas.height = cropOutputHeight
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    cropOutputWidth,
    cropOutputHeight,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const sourceName = imageItem.file?.name || imageItem.originalUrl || 'product-photo'
      const fileName = sourceName.replace(/\.[^.]+$/, '').split('/').pop()
      const croppedFile = new File([blob], `${fileName}-cropped.jpg`, {
        type: 'image/jpeg',
      })

      resolve({
        file: croppedFile,
        preview: URL.createObjectURL(croppedFile),
      })
    }, 'image/jpeg', 0.92)
  })
}

function PostItemSection({ editingProduct, onCancel, onCreateListing, onUpdateListing, user }) {
  const fileInputRef = useRef(null)
  const dragRef = useRef(null)
  const [images, setImages] = useState(() =>
    editingProduct?.images?.map((imageUrl, index) => ({
      id: `existing-${editingProduct.apiId}-${index}`,
      cropSource: getProductImageCropUrl(editingProduct.apiId, index),
      existing: true,
      file: null,
      originalUrl: imageUrl,
      preview: imageUrl,
    })) || [],
  )
  const [cropTargetId, setCropTargetId] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 })
  const [form, setForm] = useState({
    title: editingProduct?.title || '',
    category: editingProduct?.category || 'General',
    condition: editingProduct?.condition || 'Used',
    description: editingProduct?.description || '',
    phone: editingProduct?.details?.Phone || '',
    price: editingProduct?.price ? String(editingProduct.price) : '',
    status: editingProduct?.status || 'Available',
    telegram: editingProduct?.details?.Telegram || '',
  })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const uploadIcon = (
    <span className="upload-icon">
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M17.5 18a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.7 1.8A3.8 3.8 0 0 0 6 18h11.5Z" />
        <path d="M12 12v7" />
        <path d="m8.5 15.5 3.5-3.5 3.5 3.5" />
      </svg>
    </span>
  )

  function getTouchDistance(touches) {
    const firstTouch = touches[0]
    const secondTouch = touches[1]
    const xDistance = firstTouch.clientX - secondTouch.clientX
    const yDistance = firstTouch.clientY - secondTouch.clientY

    return Math.hypot(xDistance, yDistance)
  }

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function addFiles(fileList) {
    const selectedFiles = Array.from(fileList)
      .filter((file) =>
        ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type),
      )
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        preview: URL.createObjectURL(file),
      }))

    setImages((current) => {
      const remainingSlots = maxImages - current.length
      const filesToAdd = selectedFiles.slice(0, remainingSlots)
      const filesNotUsed = selectedFiles.slice(remainingSlots)

      filesNotUsed.forEach((image) => URL.revokeObjectURL(image.preview))

      return [...current, ...filesToAdd]
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeImage(imageId) {
    setImages((current) => {
      const image = current.find((item) => item.id === imageId)
      if (image) {
        URL.revokeObjectURL(image.preview)
      }

      return current.filter((item) => item.id !== imageId)
    })
  }

  function openCropper(imageId) {
    setCropTargetId(imageId)
    setCrop({ x: 0, y: 0, scale: 1 })
  }

  function closeCropper() {
    setCropTargetId(null)
  }

  async function saveCrop() {
    const image = images.find((item) => item.id === cropTargetId)

    if (!image) {
      closeCropper()
      return
    }

    const croppedImage = await createCroppedFile(image, crop)

    URL.revokeObjectURL(image.preview)
    setImages((current) =>
      current.map((item) =>
        item.id === image.id
          ? {
              ...item,
              cropSource: croppedImage.preview,
              existing: false,
              file: croppedImage.file,
              preview: croppedImage.preview,
            }
          : item,
      ),
    )
    closeCropper()
  }

  function clampCrop(nextCrop) {
    return {
      x: Math.max(-1, Math.min(1, nextCrop.x)),
      y: Math.max(-1, Math.min(1, nextCrop.y)),
      scale: Math.max(1, Math.min(4, nextCrop.scale)),
    }
  }

  function updateCrop(partialCrop) {
    setCrop((current) => clampCrop({ ...current, ...partialCrop }))
  }

  function startCropDrag(event) {
    if (event.touches?.length >= 2) {
      dragRef.current = {
        distance: getTouchDistance(event.touches),
        mode: 'pinch',
        scale: crop.scale,
      }
      return
    }

    const point = event.touches?.[0] || event
    dragRef.current = {
      crop,
      mode: 'move',
      x: point.clientX,
      y: point.clientY,
    }
  }

  function moveCropDrag(event) {
    if (!dragRef.current) {
      return
    }

    if (dragRef.current.mode === 'pinch' && event.touches?.length >= 2) {
      const nextDistance = getTouchDistance(event.touches)
      const nextScale = dragRef.current.scale * (nextDistance / dragRef.current.distance)

      updateCrop({ scale: nextScale })
      return
    }

    const point = event.touches?.[0] || event
    const movementScale = 160 * crop.scale
    const nextX = dragRef.current.crop.x + (point.clientX - dragRef.current.x) / movementScale
    const nextY = dragRef.current.crop.y + (point.clientY - dragRef.current.y) / movementScale

    updateCrop({ x: nextX, y: nextY })
  }

  function stopCropDrag() {
    dragRef.current = null
  }

  function handleCropWheel(event) {
    event.preventDefault()
    updateCrop({ scale: crop.scale + (event.deltaY > 0 ? -0.08 : 0.08) })
  }

  function handleDrop(event) {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  function resetCrop() {
    setCrop({ x: 0, y: 0, scale: 1 })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!images.length && !editingProduct) {
      setMessage('Please upload at least one photo.')
      return
    }

    if (!form.phone.trim() || !form.telegram.trim()) {
      setMessage('Please add both your phone number and Telegram account.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    const listingPayload = {
      title: form.title,
      category: form.category,
      condition: form.condition,
      price: Number(form.price),
      description: form.description,
      usage_duration: 'Not specified',
      location: 'Phnom Penh',
      seller_phone: form.phone,
      seller_telegram: form.telegram,
      status: form.status,
    }
    const postedAt = new Date().toISOString()

    const localImageUrls = editingProduct
      ? []
      : await Promise.all(images.map((image) => fileToDataUrl(image.file)))

    const localListing = {
      id: Date.now(),
      title: form.title,
      category: form.category,
      condition: form.condition,
      location: 'Phnom Penh',
      price: Number(form.price),
      priceDisplay: form.price,
      seller: user?.name || 'Seller',
      sellerId: user?.id,
      duration: formatRelativeTime(postedAt),
      createdAt: postedAt,
      status: 'Available',
      image: localImageUrls[0],
      images: localImageUrls,
      description: form.description,
      posted: new Date(postedAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      usage: 'Not specified',
      details: {
        Category: form.category,
        ...(form.phone ? { Phone: form.phone } : {}),
        ...(form.telegram ? { Telegram: form.telegram } : {}),
      },
    }

    try {
      const result = editingProduct?.apiId
        ? await updateProduct(
            editingProduct.apiId,
            listingPayload,
            images,
          )
        : await createProduct(
            listingPayload,
            images.map((image) => image.file),
          )

      if (editingProduct) {
        onUpdateListing?.(result.product)
      } else {
        onCreateListing(result.demo ? localListing : result.product)
      }

      if (!result.demo) {
        images.forEach((image) => URL.revokeObjectURL(image.preview))
      }

      setForm({
        title: '',
        category: 'General',
        condition: 'Used',
        description: '',
        phone: '',
        price: '',
        status: 'Available',
        telegram: '',
      })
      setImages([])
      setMessage(editingProduct ? 'Your item has been updated.' : 'Your item has been posted.')
    } catch (error) {
      setMessage(error.message || 'Could not save this item. Please make sure the backend is running and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cropTargetImage = images.find((image) => image.id === cropTargetId)

  return (
    <section className="post-item-section" id="post-item">
      <form className="post-item-card" onSubmit={handleSubmit}>
        <div className="post-item-heading">
          <div>
            <h2>{editingProduct ? 'Edit Item' : 'Post an Item'}</h2>
            <p>
              {editingProduct
                ? 'Update the details below to keep your listing accurate.'
                : 'Fill in the details below to list your item for sale.'}
            </p>
          </div>
          <button className="post-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="post-item-inner">
          <label>
            <span>
              Upload Photo(s) {!editingProduct && <strong>*</strong>}
            </span>
            <button
              className="upload-dropzone"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {uploadIcon}
              <span>Click to upload or drag and drop</span>
              <small>PNG, JPG, JPEG or WEBP (Max. 5MB each)</small>
            </button>
            <input
              accept="image/png,image/jpeg,image/jpg,image/webp"
              hidden
              multiple
              ref={fileInputRef}
              type="file"
              onChange={(event) => addFiles(event.target.files)}
            />
          </label>

          <p className="upload-note">
            {editingProduct
              ? 'Upload new photos only if you want to replace the current ones.'
              : 'You can upload up to 5 images.'}
          </p>

          <div className="image-slots" aria-label="Selected images">
            {Array.from({ length: maxImages }).map((_, index) => {
              const image = images[index]

              return (
                <div className="image-slot" key={image?.id || index}>
                  {image ? (
                    <>
                      <img src={image.preview} alt={`Upload preview ${index + 1}`} />
                      <button
                        className="crop-image"
                        type="button"
                        onClick={() => openCropper(image.id)}
                      >
                        Crop
                      </button>
                      <button
                        aria-label="Remove image"
                        className="remove-image"
                        type="button"
                        onClick={() => removeImage(image.id)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="image-placeholder">▧</span>
                  )}
                </div>
              )
            })}
          </div>

          <label>
            <span>
              Item Name <strong>*</strong>
            </span>
            <input
              name="title"
              placeholder="Enter item name"
              type="text"
              value={form.title}
              onChange={updateField}
              required
            />
          </label>

          <label>
            <span>
              Category <strong>*</strong>
            </span>
            <select
              name="category"
              value={form.category}
              onChange={updateField}
              required
            >
              {postCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>
              Condition <strong>*</strong>
            </span>
            <select
              name="condition"
              value={form.condition}
              onChange={updateField}
              required
            >
              <option value="New">New</option>
              <option value="Used">Old / Used</option>
            </select>
          </label>

          <label>
            <span>
              Description
            </span>
            <textarea
              name="description"
              placeholder="Describe your item in detail..."
              value={form.description}
              onChange={updateField}
            />
          </label>

          <div className="contact-fields">
            <label>
              <span>
                Phone number <strong>*</strong>
              </span>
              <input
                name="phone"
                placeholder="Enter phone number"
                type="tel"
                value={form.phone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              <span>
                Telegram account <strong>*</strong>
              </span>
              <input
                name="telegram"
                placeholder="@username or phone"
                type="text"
                value={form.telegram}
                onChange={updateField}
                required
              />
            </label>
          </div>

          <label>
            <span>
              Price <strong>*</strong>
            </span>
            <div className="price-field">
              <span>$</span>
              <input
                min="0"
                name="price"
                placeholder="Enter price"
                step="0.01"
                type="number"
                value={form.price}
                onChange={updateField}
                required
              />
            </div>
          </label>

          {editingProduct && (
            <label className="stock-status-field">
              <span>Stock status</span>
              <select name="status" value={form.status} onChange={updateField}>
                <option value="Available">In stock</option>
                <option value="Sold">Out of stock</option>
                <option value="Reserved">Reserved</option>
              </select>
            </label>
          )}

          {message && <p className="post-message">{message}</p>}

          <button className="post-submit" type="submit">
            {isSubmitting
              ? editingProduct ? 'Saving...' : 'Posting...'
              : editingProduct ? 'Save Changes' : 'Post Item'}
          </button>
        </div>
      </form>

      {cropTargetId && (
        <div className="crop-modal" role="dialog" aria-modal="true" aria-label="Crop image">
          <div className="crop-card">
            <div className="crop-header">
              <button type="button" onClick={closeCropper}>
                Cancel
              </button>
              <button className="crop-reset-button" type="button" onClick={resetCrop}>
                Reset
              </button>
              <button type="button" onClick={saveCrop}>
                Done
              </button>
            </div>
            <div className="crop-tool-strip" aria-label="Crop tools">
              <span className="crop-tool-icon active">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M7 3v14h14" />
                  <path d="M3 7h14v14" />
                </svg>
              </span>
              <span className="crop-tool-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 12a8 8 0 1 0 8-8" />
                  <path d="M4 4v5h5" />
                </svg>
              </span>
              <span className="crop-tool-icon">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4v16" />
                  <path d="M4 12h16" />
                </svg>
              </span>
            </div>
            <div
              className="crop-stage"
              onMouseDown={startCropDrag}
              onMouseLeave={stopCropDrag}
              onMouseMove={moveCropDrag}
              onMouseUp={stopCropDrag}
              onTouchCancel={stopCropDrag}
              onTouchEnd={stopCropDrag}
              onTouchMove={moveCropDrag}
              onTouchStart={startCropDrag}
              onWheel={handleCropWheel}
            >
              <img className="crop-backdrop-image" src={cropTargetImage?.preview} alt="" />
              <div className="crop-window">
                <img
                  className="crop-preview-image"
                  src={cropTargetImage?.preview}
                  alt=""
                  style={{
                    transform: `translate(${crop.x * 32}%, ${crop.y * 32}%) scale(${crop.scale})`,
                  }}
                />
                <span className="crop-frame" />
                <span className="crop-grid crop-grid-vertical-one" />
                <span className="crop-grid crop-grid-vertical-two" />
                <span className="crop-grid crop-grid-horizontal-one" />
                <span className="crop-grid crop-grid-horizontal-two" />
                <span className="crop-handle crop-handle-tl" />
                <span className="crop-handle crop-handle-tr" />
                <span className="crop-handle crop-handle-bl" />
                <span className="crop-handle crop-handle-br" />
                <span className="crop-edge crop-edge-top" />
                <span className="crop-edge crop-edge-right" />
                <span className="crop-edge crop-edge-bottom" />
                <span className="crop-edge crop-edge-left" />
              </div>
            </div>
            <div className="crop-controls">
              <div className="crop-ratio-row" aria-label="Crop shape">
                <span>Original</span>
                <span className="active">Product</span>
                <span>Square</span>
                <span>16:9</span>
                <span>4:3</span>
              </div>
              <div className="crop-nudge-row" aria-label="Move image">
                <button type="button" onClick={() => updateCrop({ x: crop.x - 0.08 })}>
                  ←
                </button>
                <button type="button" onClick={() => updateCrop({ y: crop.y - 0.08 })}>
                  ↑
                </button>
                <button type="button" onClick={() => updateCrop({ y: crop.y + 0.08 })}>
                  ↓
                </button>
                <button type="button" onClick={() => updateCrop({ x: crop.x + 0.08 })}>
                  →
                </button>
              </div>
              <label>
                <span>Zoom</span>
                <input
                  max="4"
                  min="1"
                  step="0.01"
                  type="range"
                  value={crop.scale}
                  onChange={(event) =>
                    updateCrop({ scale: Number(event.target.value) })
                  }
                />
              </label>
            </div>
            <div className="crop-bottom-bar" aria-hidden="true">
              <span />
              <span className="active" />
              <span />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PostItemSection

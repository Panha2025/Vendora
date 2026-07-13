import { useRef, useState } from 'react'
import { createProduct, formatRelativeTime } from '../api/products'
import { categories } from '../data/products'

const maxImages = 5
const postCategories = categories.filter((category) => category !== 'All')

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function PostItemSection({ onCancel, onCreateListing, user }) {
  const fileInputRef = useRef(null)
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    description: '',
    phone: '',
    price: '',
    telegram: '',
  })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function addFiles(fileList) {
    const selectedFiles = Array.from(fileList)
      .filter((file) => file.type.startsWith('image/'))
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

  function handleDrop(event) {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!images.length) {
      setMessage('Please upload at least one photo.')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    const listingPayload = {
      title: form.title,
      category: form.category,
      condition: 'Used',
      price: Number(form.price),
      description: form.description,
      usage_duration: 'Not specified',
      location: 'Phnom Penh',
      seller_phone: form.phone,
      seller_telegram: form.telegram,
      status: 'Available',
    }
    const postedAt = new Date().toISOString()

    const localImageUrls = await Promise.all(
      images.map((image) => fileToDataUrl(image.file)),
    )

    const localListing = {
      id: Date.now(),
      title: form.title,
      category: form.category,
      condition: 'Used',
      location: 'Phnom Penh',
      price: Number(form.price),
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
      const result = await createProduct(
        listingPayload,
        images.map((image) => image.file),
      )

      onCreateListing(result.demo ? localListing : result.product)

      if (!result.demo) {
        images.forEach((image) => URL.revokeObjectURL(image.preview))
      }

      setForm({
        title: '',
        category: 'General',
        description: '',
        phone: '',
        price: '',
        telegram: '',
      })
      setImages([])
      setMessage('Your item has been posted.')
    } catch {
      setMessage('Could not save this item. Please make sure the backend is running and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="post-item-section" id="post-item">
      <form className="post-item-card" onSubmit={handleSubmit}>
        <div className="post-item-heading">
          <div>
            <h2>Post an Item</h2>
            <p>Fill in the details below to list your item for sale.</p>
          </div>
          <button className="post-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="post-item-inner">
          <label>
            <span>
              Upload Photo(s) <strong>*</strong>
            </span>
            <button
              className="upload-dropzone"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="upload-icon">⇧</span>
              <span>Click to upload or drag and drop</span>
              <small>PNG, JPG or JPEG (Max. 5MB each)</small>
            </button>
            <input
              accept="image/png,image/jpeg,image/jpg"
              hidden
              multiple
              ref={fileInputRef}
              type="file"
              onChange={(event) => addFiles(event.target.files)}
            />
          </label>

          <p className="upload-note">You can upload up to 5 images.</p>

          <div className="image-slots" aria-label="Selected images">
            {Array.from({ length: maxImages }).map((_, index) => {
              const image = images[index]

              return (
                <div className="image-slot" key={image?.id || index}>
                  {image ? (
                    <>
                      <img src={image.preview} alt={`Upload preview ${index + 1}`} />
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
              Description <strong>*</strong>
            </span>
            <textarea
              name="description"
              placeholder="Describe your item in detail..."
              value={form.description}
              onChange={updateField}
              required
            />
          </label>

          <div className="contact-fields">
            <label>
              <span>Phone number</span>
              <input
                name="phone"
                placeholder="Enter phone number"
                type="tel"
                value={form.phone}
                onChange={updateField}
              />
            </label>

            <label>
              <span>Telegram account</span>
              <input
                name="telegram"
                placeholder="@username or phone"
                type="text"
                value={form.telegram}
                onChange={updateField}
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

          {message && <p className="post-message">{message}</p>}

          <button className="post-submit" type="submit">
            {isSubmitting ? 'Posting...' : 'Post Item'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default PostItemSection

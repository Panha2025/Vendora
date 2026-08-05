import { useState } from 'react'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function createAvatarFile(source, sourceName, crop) {
  const sourceImage = await loadImage(source)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const size = Math.min(sourceImage.naturalWidth, sourceImage.naturalHeight) / crop.scale
  const maxOffsetX = (sourceImage.naturalWidth - size) / 2
  const maxOffsetY = (sourceImage.naturalHeight - size) / 2
  const sourceX = Math.max(
    0,
    Math.min(sourceImage.naturalWidth - size, sourceImage.naturalWidth / 2 - size / 2 - crop.x * maxOffsetX),
  )
  const sourceY = Math.max(
    0,
    Math.min(sourceImage.naturalHeight - size, sourceImage.naturalHeight / 2 - size / 2 - crop.y * maxOffsetY),
  )

  canvas.width = 512
  canvas.height = 512
  context.drawImage(sourceImage, sourceX, sourceY, size, size, 0, 0, 512, 512)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const baseName = sourceName.replace(/\.[^.]+$/, '') || 'profile-photo'

      resolve(new File([blob], `${baseName}-profile.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  })
}

function ProfileCropper({ fileName, onCancel, onSave, source }) {
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 })
  const [isSaving, setIsSaving] = useState(false)

  function updateCrop(nextCrop) {
    setCrop({
      x: Math.max(-1, Math.min(1, nextCrop.x ?? crop.x)),
      y: Math.max(-1, Math.min(1, nextCrop.y ?? crop.y)),
      scale: Math.max(1, Math.min(4, nextCrop.scale ?? crop.scale)),
    })
  }

  async function saveCrop() {
    setIsSaving(true)
    const croppedFile = await createAvatarFile(source, fileName, crop)

    onSave(croppedFile)
  }

  return (
    <div className="crop-modal profile-crop-modal" role="dialog" aria-modal="true" aria-label="Crop profile picture">
      <div className="crop-card profile-crop-card">
        <div className="crop-header">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-reset-button" type="button" onClick={() => setCrop({ x: 0, y: 0, scale: 1 })}>
            Reset
          </button>
          <button type="button" disabled={isSaving} onClick={saveCrop}>
            {isSaving ? 'Saving...' : 'Done'}
          </button>
        </div>

        <div className="crop-stage profile-crop-stage">
          <img className="crop-backdrop-image" src={source} alt="" />
          <div className="crop-window profile-crop-window">
            <img
              className="crop-preview-image"
              src={source}
              alt=""
              style={{
                transform: `translate(${crop.x * 32}%, ${crop.y * 32}%) scale(${crop.scale})`,
              }}
            />
            <span className="crop-frame" />
          </div>
        </div>

        <div className="crop-controls">
          <div className="crop-nudge-row" aria-label="Move image">
            <button type="button" onClick={() => updateCrop({ x: crop.x - 0.08 })}>Left</button>
            <button type="button" onClick={() => updateCrop({ y: crop.y - 0.08 })}>Up</button>
            <button type="button" onClick={() => updateCrop({ y: crop.y + 0.08 })}>Down</button>
            <button type="button" onClick={() => updateCrop({ x: crop.x + 0.08 })}>Right</button>
          </div>
          <label>
            <span>Zoom</span>
            <input
              max="4"
              min="1"
              step="0.05"
              type="range"
              value={crop.scale}
              onChange={(event) => updateCrop({ scale: Number(event.target.value) })}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default ProfileCropper

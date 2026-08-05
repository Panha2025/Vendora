import { useRef, useState } from 'react'

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
  const dragRef = useRef(null)

  function updateCrop(nextCrop) {
    setCrop((current) => ({
      x: Math.max(-1, Math.min(1, nextCrop.x ?? current.x)),
      y: Math.max(-1, Math.min(1, nextCrop.y ?? current.y)),
      scale: Math.max(1, Math.min(4, nextCrop.scale ?? current.scale)),
    }))
  }

  function startDrag(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop,
    }
  }

  function moveDrag(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    updateCrop({
      x: drag.crop.x + (event.clientX - drag.startX) / 180,
      y: drag.crop.y + (event.clientY - drag.startY) / 180,
    })
  }

  function endDrag(event) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  function zoomWithWheel(event) {
    event.preventDefault()
    updateCrop({ scale: crop.scale + event.deltaY * -0.003 })
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

        <div
          className="crop-stage profile-crop-stage"
          role="presentation"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={zoomWithWheel}
        >
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
          <div className="profile-crop-scrolls">
            <label>
              <span>Horizontal</span>
              <input
                aria-label="Move profile photo horizontally"
                max="1"
                min="-1"
                step="0.01"
                type="range"
                value={crop.x}
                onChange={(event) => updateCrop({ x: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Vertical</span>
              <input
                aria-label="Move profile photo vertically"
                max="1"
                min="-1"
                step="0.01"
                type="range"
                value={crop.y}
                onChange={(event) => updateCrop({ y: Number(event.target.value) })}
              />
            </label>
          </div>
          <label className="profile-crop-zoom">
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

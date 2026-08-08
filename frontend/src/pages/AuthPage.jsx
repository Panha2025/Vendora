import { useEffect, useState } from 'react'
import {
  getSocialLoginProviders,
  loginUser,
  registerUser,
  socialLoginUser,
} from '../api/auth'
import LanguageSelect from '../components/LanguageSelect'
import ProfileCropper from '../components/ProfileCropper'

function CameraIcon() {
  return (
    <svg className="avatar-camera-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8.8 6.5 10.2 5h3.6l1.4 1.5H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h2.8Z" />
      <circle cx="12" cy="12.6" r="3.1" fill="#5f666d" />
    </svg>
  )
}

function AuthPage({
  initialMode = 'login',
  language,
  onAuthenticated,
  onBack,
  onLanguageChange,
  t,
}) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: null,
    password: '',
    password_confirmation: '',
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [socialProviders, setSocialProviders] = useState(null)
  const [avatarCropTarget, setAvatarCropTarget] = useState(null)

  const isRegistering = mode === 'register'
  const authTitle = isRegistering ? 'Register' : 'Log In'
  const selectedProviderKey = selectedProvider.toLowerCase()
  const isSelectedProviderConfigured =
    !selectedProvider || socialProviders?.[selectedProviderKey] !== false

  useEffect(() => {
    let isActive = true

    getSocialLoginProviders()
      .then((providers) => {
        if (isActive) {
          setSocialProviders(providers)
        }
      })
      .catch(() => {
        if (isActive) {
          setSocialProviders({})
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  function updateAvatar(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      return
    }

    setAvatarCropTarget({
      file,
      preview: URL.createObjectURL(file),
    })
    event.target.value = ''
  }

  function saveAvatarCrop(file) {
    const preview = URL.createObjectURL(file)

    setForm((current) => ({
      ...current,
      avatar: file,
    }))
    setAvatarPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }

      return preview
    })
    setAvatarCropTarget((current) => {
      if (current?.preview) {
        URL.revokeObjectURL(current.preview)
      }

      return null
    })
  }

  function cancelAvatarCrop() {
    setAvatarCropTarget((current) => {
      if (current?.preview) {
        URL.revokeObjectURL(current.preview)
      }

      return null
    })
  }

  useEffect(() => () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  async function handleSubmit(event) {
    event.preventDefault()

    const validationMessage = validateForm()

    if (validationMessage) {
      setMessage(validationMessage)
      setMessageType('error')
      return
    }

    setIsLoading(true)
    setMessage('')
    setMessageType('info')

    try {
      const action = isRegistering ? registerUser : loginUser
      const session = await action(form)

      setMessage(session.message || 'Welcome to Vendora.')
      setMessageType('success')
      onAuthenticated(session.user)
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSocialLogin(provider = selectedProvider) {
    if (!provider) {
      return
    }

    setIsLoading(true)
    setMessage('')
    setMessageType('info')

    try {
      const session = await socialLoginUser(provider)
      setSelectedProvider('')
      onAuthenticated(session.user)
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  function openSocialDialog(provider) {
    setMessage('')
    setSelectedProvider(provider)
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setMessage('')
    setMessageType('info')
    setSelectedProvider('')
  }

  function validateForm() {
    const email = form.email.trim()
    const password = form.password

    if (isRegistering && !form.name.trim()) {
      return 'Please enter your full name.'
    }

    if (isRegistering && !form.phone.trim()) {
      return 'Please enter your phone number.'
    }

    if (isRegistering && !form.avatar) {
      return 'Please upload a profile picture.'
    }

    if (!email) {
      return 'Please enter your email address.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.'
    }

    if (!password) {
      return 'Please enter your password.'
    }

    if (isRegistering && password.length < 8) {
      return 'Password must be at least 8 characters.'
    }

    if (isRegistering && !form.password_confirmation) {
      return 'Please confirm your password.'
    }

    if (isRegistering && password !== form.password_confirmation) {
      return 'Password and confirm password must match.'
    }

    return ''
  }

  return (
    <main className="auth-page">
      <form className="auth-card plain-auth-card" noValidate onSubmit={handleSubmit}>
        {onBack && (
          <button className="auth-back-button" type="button" onClick={onBack}>
            {t('backToMarketplace')}
          </button>
        )}

        <LanguageSelect
          className="auth-language-select"
          label={t('language')}
          language={language}
          onLanguageChange={onLanguageChange}
        />

        <div className="plain-auth-header">
          <h1>{authTitle}</h1>
          <p>
            {isRegistering
              ? 'Create your account to start using the marketplace.'
              : 'Welcome back! Please login to your account.'}
          </p>
        </div>

        {isRegistering && (
          <>
            <label className="avatar-upload-field">
              <span>Profile picture</span>
              <div className="avatar-upload-row">
                <div className={`avatar-preview-circle ${avatarPreview ? '' : 'avatar-empty-placeholder'}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile preview" />
                  ) : (
                    <CameraIcon />
                  )}
                </div>
                <div className="avatar-upload-copy">
                  <strong>{form.avatar ? 'Profile photo selected' : 'Upload profile photo'}</strong>
                  <small>{form.avatar?.name || 'JPG, PNG, or WebP. You can crop it after choosing.'}</small>
                </div>
                <input
                  id="profile-picture"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  name="avatar"
                  type="file"
                  onChange={updateAvatar}
                  required
                />
              </div>
            </label>

            <label>
              <span>{t('fullName')}</span>
              <input
                name="name"
                placeholder="Enter your name"
                type="text"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>

            <label>
              <span>{t('phoneNumber')}</span>
              <input
                name="phone"
                placeholder="Enter your phone number"
                type="tel"
                value={form.phone}
                onChange={updateField}
                required
              />
            </label>
          </>
        )}

        <label>
          <span>{t('emailAddress')}</span>
          <input
            name="email"
            placeholder="Enter your email"
            type="email"
            value={form.email}
            onChange={updateField}
            required
          />
        </label>

        <label>
          <span>{t('password')}</span>
          <input
            name="password"
            placeholder="Enter your password"
            type="password"
            value={form.password}
            onChange={updateField}
            required
          />
        </label>

        {isRegistering && (
          <label>
            <span>Confirm password</span>
            <input
              name="password_confirmation"
              placeholder="Repeat your password"
              type="password"
              value={form.password_confirmation}
              onChange={updateField}
              required
            />
          </label>
        )}

        {!isRegistering && (
          <div className="login-options">
            <label className="remember-field">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button className="link-button" type="button">
              Forgot password?
            </button>
          </div>
        )}

        {message && <p className={`auth-message ${messageType}`}>{message}</p>}

        <button className="auth-submit" type="submit">
          {isLoading
            ? 'Please wait...'
            : isRegistering
              ? 'Register'
              : 'Log In'}
        </button>

        <p className="auth-switch-text">
          {isRegistering
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <button
            className="link-button"
            type="button"
            onClick={() => switchMode(isRegistering ? 'login' : 'register')}
          >
            {isRegistering ? 'Log In' : 'Register'}
          </button>
        </p>

        <div className="social-login-area">
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-login-buttons">
            <button
              type="button"
              disabled={isLoading}
              title={
                socialProviders?.google === false
                  ? 'Google login is not configured yet.'
                  : 'Continue with Google'
              }
              onClick={() => openSocialDialog('Google')}
            >
              <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.1 3.2v2.7h3.4c2-1.8 3.3-4.5 3.3-7.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3 0 5.5-1 7.3-2.9l-3.4-2.7c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.8H2.1v2.8C3.9 20.3 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 13.6c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V6.6H2.1C1.4 8.1 1 9.7 1 11.5s.4 3.4 1.1 4.9l3.5-2.8z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.6c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 1.2 15 0 12 0 7.7 0 3.9 2.7 2.1 6.6l3.5 2.8c.9-2.8 3.4-4.8 6.4-4.8z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              disabled={isLoading}
              title={
                socialProviders?.facebook === false
                  ? 'Facebook login is not configured yet.'
                  : 'Continue with Facebook'
              }
              onClick={() => openSocialDialog('Facebook')}
            >
              <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#1877F2"
                  d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"
                />
                <path
                  fill="#fff"
                  d="m16.7 15.5.5-3.5h-3.4V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.7 0-4.5 1.7-4.5 4.7V12h-3v3.5h3v8.4a12.6 12.6 0 0 0 3.7 0v-8.4h2.9z"
                />
              </svg>
              Facebook
            </button>
            <button
              type="button"
              disabled={isLoading}
              title={
                socialProviders?.apple === false
                  ? 'Apple login is not configured yet.'
                  : 'Continue with Apple'
              }
              onClick={() => openSocialDialog('Apple')}
            >
              <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#111827"
                  d="M17.6 12.8c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1-.9 0-2.3-1-3.8-.9-1.9 0-3.7 1.1-4.7 2.8-2 3.5-.5 8.7 1.4 11.5 1 1.4 2.1 2.9 3.6 2.9 1.5-.1 2-.9 3.8-.9s2.3.9 3.8.9c1.6 0 2.6-1.4 3.6-2.8 1.1-1.6 1.5-3.1 1.5-3.2-.1 0-3.4-1.3-3.4-4.9zM15 4.7c.8-1 1.4-2.3 1.2-3.7-1.2.1-2.6.8-3.4 1.8-.8.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.6 3.4-1.6z"
                />
              </svg>
              Apple
            </button>
          </div>
        </div>

        {selectedProvider && (
          <div className="connect-dialog-backdrop" role="presentation">
            <section
              aria-labelledby="connect-title"
              aria-modal="true"
              className="connect-dialog"
              role="dialog"
            >
              <button
                aria-label="Close connection dialog"
                className="connect-close"
                type="button"
                onClick={() => setSelectedProvider('')}
              >
                x
              </button>
              <div className="connect-provider-mark">
                {selectedProvider.charAt(0)}
              </div>
              <h2 id="connect-title">Continue with {selectedProvider}</h2>
              <p>
                {isSelectedProviderConfigured
                  ? `Vendora will create or open your marketplace account using your ${selectedProvider} sign-in.`
                  : `${selectedProvider} login is not connected yet. Add the ${selectedProvider} OAuth credentials in the backend environment, then redeploy the backend.`}
              </p>
              <div className="connect-dialog-actions">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('')}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading || !isSelectedProviderConfigured}
                  onClick={() => handleSocialLogin()}
                >
                  {isLoading
                    ? 'Connecting...'
                    : isSelectedProviderConfigured
                      ? `Connect ${selectedProvider}`
                      : 'Setup Required'}
                </button>
              </div>
            </section>
          </div>
        )}

        {avatarCropTarget && (
          <ProfileCropper
            fileName={avatarCropTarget.file.name}
            source={avatarCropTarget.preview}
            onCancel={cancelAvatarCrop}
            onSave={saveAvatarCrop}
          />
        )}
      </form>
    </main>
  )
}

export default AuthPage

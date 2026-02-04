import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingState from '../components/LoadingState'

const initialForm = {
  email: '',
  password: '',
}

const MIN_EMAIL_LENGTH = 4
const MIN_PASSWORD_LENGTH = 6

function LoginPage() {
  const { session, hasAdminAccess, loading, error, signInWithMagicLink, signInWithPassword, clearError } =
    useAuth()
  const [form, setForm] = useState(initialForm)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isReady = useMemo(
    () =>
      form.email.trim().length >= MIN_EMAIL_LENGTH &&
      (mode === 'magic' || form.password.trim().length >= MIN_PASSWORD_LENGTH),
    [form.email, form.password, mode],
  )

  if (loading) {
    return <LoadingState message="Vérification de la session..." />
  }

  if (session && hasAdminAccess) {
    return <Navigate to="/" replace />
  }

  if (session && !hasAdminAccess) {
    return <Navigate to="/access-denied" replace />
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    clearError()
    setMessage(null)
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleModeChange = (nextMode: 'password' | 'magic') => {
    clearError()
    setMessage(null)
    setMode(nextMode)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isReady) {
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(form.email.trim())
        setMessage('Un lien de connexion vient d’être envoyé par email.')
      } else {
        await signInWithPassword(form.email.trim(), form.password)
      }
      setForm(initialForm)
    } catch (submitError) {
      const err = submitError as Error
      setMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h1>Connexion administrateur</h1>
      <p className="muted">Utilisez vos identifiants Supabase pour accéder au back-office.</p>
      <div className="segmented">
        <button
          type="button"
          className={mode === 'password' ? 'primary' : 'secondary'}
          onClick={() => handleModeChange('password')}
        >
          Email + mot de passe
        </button>
        <button
          type="button"
          className={mode === 'magic' ? 'primary' : 'secondary'}
          onClick={() => handleModeChange('magic')}
        >
          Magic link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="vous@hotel.com"
            required
          />
        </label>
        {mode === 'password' && (
          <label>
            Mot de passe
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        {message && <p className="muted">{message}</p>}
        <button type="submit" disabled={!isReady || submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingState from '../components/LoadingState'
import { supabase } from '../lib/supabase'

const initialForm = {
  email: '',
  password: '',
}

const MIN_EMAIL_LENGTH = 4
const MIN_PASSWORD_LENGTH = 6

function LoginPage() {
  const { session, hasAdminAccess, loading, error: authError, clearError } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const isReady =
    form.email.trim().length >= MIN_EMAIL_LENGTH && form.password.trim().length >= MIN_PASSWORD_LENGTH

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
    setFormError(null)
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isReady) {
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (error) {
        throw error
      }
      setForm(initialForm)
    } catch (submitError) {
      const err = submitError as Error
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h1>Connexion administrateur</h1>
      <p className="muted">Utilisez vos identifiants Supabase pour accéder au back-office.</p>

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
        {(authError || formError) && <p className="error">{authError ?? formError}</p>}
        <button type="submit" disabled={!isReady || submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage

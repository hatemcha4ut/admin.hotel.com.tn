import { useEffect, useState } from 'react'

interface VersionInfo {
  sha: string
  builtAt: string
}

export default function VersionFooter() {
  const [version, setVersion] = useState<VersionInfo | null>(null)

  useEffect(() => {
    fetch('/version.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVersion(data))
      .catch(() => setVersion(null))
  }, [])

  if (!version) return null

  return (
    <footer className="version-footer">
      Build: {version.sha.slice(0, 7)} — {new Date(version.builtAt).toLocaleString()}
    </footer>
  )
}

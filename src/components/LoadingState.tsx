type LoadingStateProps = {
  message?: string
}

function LoadingState({ message = 'Chargement...' }: LoadingStateProps) {
  return (
    <div className="card">
      <p className="muted">{message}</p>
    </div>
  )
}

export default LoadingState

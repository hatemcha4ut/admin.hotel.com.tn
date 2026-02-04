type PlaceholderPageProps = {
  title: string
  description: string
}

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="card">
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </div>
  )
}

export default PlaceholderPage

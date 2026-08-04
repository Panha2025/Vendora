const features = [
  {
    id: 'auth',
    number: '01',
    title: 'Secure accounts',
    text: 'Ready for Laravel Sanctum authentication and profile controls.',
  },
  {
    id: 'messages',
    number: '02',
    title: 'Buyer-seller chat',
    text: 'Conversation history and real-time messaging can plug in next.',
  },
  {
    id: 'admin',
    number: '03',
    title: 'Admin oversight',
    text: 'Moderation tools for reports, fake listings, users, and stats.',
  },
]

function FeatureSection() {
  return (
    <section className="feature-grid">
      {features.map((feature) => (
        <article id={feature.id} key={feature.id}>
          <span className="feature-icon">{feature.number}</span>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>
        </article>
      ))}
    </section>
  )
}

export default FeatureSection

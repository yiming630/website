export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Translation Platform</h1>
      <p>Welcome to the Translation Platform Frontend</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Links:</h2>
        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
          <li><a href={process.env.NEXT_PUBLIC_GRAPHQL_URL} target="_blank" rel="noopener noreferrer">GraphQL Playground</a></li>
        </ul>
      </div>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p><strong>API Gateway:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
        <p><strong>GraphQL Endpoint:</strong> {process.env.NEXT_PUBLIC_GRAPHQL_URL}</p>
      </div>
    </div>
  )
}

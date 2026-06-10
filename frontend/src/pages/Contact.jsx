import LegalLayout from '../components/LegalLayout'

export default function Contact() {
  return (
    <LegalLayout title="Contact Us" lastUpdated={null}>
      <p>Have a question, feedback, or need help? We'd love to hear from you.</p>

      <h2>Email</h2>
      <p>
        For all queries — support, billing, refunds, or feedback — email us at:{' '}
        <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>
      </p>
      <p>We typically respond within <strong>1–2 business days</strong> (Monday to Friday, 10am–6pm IST).</p>

      <h2>What to include in your email</h2>
      <ul>
        <li>Your registered email address</li>
        <li>A clear description of your issue or question</li>
        <li>For billing issues: your Razorpay payment ID</li>
        <li>For technical issues: what you were doing when the problem occurred</li>
      </ul>

      <h2>Business Details</h2>
      <ul>
        <li><strong>Product:</strong> JobTrack AI</li>
        <li><strong>Website:</strong> jobtrackai.co.in</li>
        <li><strong>Owner:</strong> Bharti Rohilla</li>
        <li><strong>Country:</strong> India</li>
        <li><strong>Support email:</strong> support@jobtrackai.co.in</li>
      </ul>

      <h2>Feedback</h2>
      <p>We're actively building JobTrack AI and your feedback directly shapes the product. If something isn't working well or you have a feature idea, please write to us — we read every email.</p>
    </LegalLayout>
  )
}

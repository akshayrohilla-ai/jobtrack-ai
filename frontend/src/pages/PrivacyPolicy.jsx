import LegalLayout from '../components/LegalLayout'

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 2026">
      <p>This Privacy Policy explains how JobTrack AI ("we", "our", or "us"), owned and operated by Bharti, collects, uses, and protects your personal information when you use our website at <strong>jobtrackai.co.in</strong> and related services.</p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li><strong>Account information:</strong> Email address and password (or Google OAuth token) when you register.</li>
        <li><strong>CV data:</strong> The text extracted from your uploaded CV — skills, experience, job titles. We do not store your original CV file permanently.</li>
        <li><strong>Usage data:</strong> Actions you take within the app (e.g., JD evaluations, CV tailoring, interview preparation) to manage your credit balance.</li>
        <li><strong>Payment data:</strong> Order IDs and payment IDs from Razorpay. We do not store card numbers or UPI details — all payment processing is handled by Razorpay.</li>
        <li><strong>Technical data:</strong> Browser type, IP address, and access timestamps for security and debugging purposes.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and operate the JobTrack AI service</li>
        <li>To process credit purchases and maintain your credit balance</li>
        <li>To personalise job evaluations, CV tailoring, and interview preparation using your CV profile</li>
        <li>To send transactional emails (account verification, password reset)</li>
        <li>To improve the product based on aggregated usage patterns</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>Your data is stored on <strong>Supabase</strong> (PostgreSQL database hosted on AWS). We use Row-Level Security (RLS) to ensure your data is only accessible by you. All data is encrypted in transit using HTTPS/TLS.</p>
      <p>Our AI features are powered by <strong>Anthropic Claude API</strong>. Your CV text, job descriptions, and interview-related inputs are sent to Anthropic for processing. Anthropic does not use your data to train their models. See Anthropic's privacy policy for details.</p>

      <h2>4. Data Sharing</h2>
      <p>We do not sell, rent, or share your personal data with third parties, except:</p>
      <ul>
        <li><strong>Supabase</strong> — database and authentication provider</li>
        <li><strong>Anthropic</strong> — AI processing (CV and JD text only)</li>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>Vercel</strong> — frontend hosting</li>
        <li><strong>Render</strong> — backend API hosting</li>
        <li>As required by law or legal process</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We retain your account data for as long as your account is active. You may delete your account directly from the Account Settings section within the app, or by emailing <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>. Account deletion is immediate and permanent — all your CV data, applications, and credit balance are removed and cannot be recovered.</p>

      <h2>6. Cookies</h2>
      <p>We use minimal cookies necessary for authentication (session tokens via Supabase). We do not use advertising or tracking cookies.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this policy from time to time. We will notify you of material changes via email or a notice on the website. Continued use of the service after changes constitutes acceptance.</p>

      <h2>9. Contact</h2>
      <p>For privacy-related queries, contact us at <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>.</p>
    </LegalLayout>
  )
}

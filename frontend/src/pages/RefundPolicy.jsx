import LegalLayout from '../components/LegalLayout'

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="June 2026">
      <p>This Refund & Cancellation Policy applies to all credit purchases made on JobTrack AI, owned and operated by Bharti Rohilla, at <strong>jobtrackai.co.in</strong>.</p>

      <h2>1. Nature of the Product</h2>
      <p>JobTrack AI sells digital credits that are used to access AI-powered features (JD evaluation, CV tailoring, and interview preparation). Credits are consumed instantly when a feature is used. Because the service is delivered digitally and immediately upon use, special considerations apply to refunds.</p>

      <h2>2. Refund Eligibility</h2>

      <h3>Unused Credits</h3>
      <p>If you have purchased a credit pack and have <strong>not used any credits</strong> from that purchase, you may request a full refund within <strong>7 days</strong> of the purchase date.</p>

      <h3>Partially Used Credits</h3>
      <p>If you have used some credits from a purchased pack, we will refund the proportional value of the <strong>unused credits only</strong>, within 7 days of the purchase date.</p>
      <p>Example: You purchase 10 credits for ₹199 and use 3. You may request a refund for the remaining 7 credits (₹139.30).</p>

      <h3>Non-Refundable Cases</h3>
      <ul>
        <li>Refund requests made more than 7 days after the purchase date</li>
        <li>Credits that have already been consumed (features used)</li>
        <li>Free credits issued on signup (these have no monetary value)</li>
        <li>Accounts terminated due to violation of our Terms & Conditions</li>
        <li>Dissatisfaction with AI output quality (we recommend using your 3 free credits to evaluate the service before purchasing)</li>
      </ul>

      <h2>3. Technical Failures</h2>
      <p>If a credit was deducted but the feature failed to deliver output due to a technical error on our end, we will restore the credit to your account. Please report such issues within 48 hours at <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a> with details of the failed action.</p>

      <h2>4. How to Request a Refund</h2>
      <p>To request a refund, email us at <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a> with:</p>
      <ul>
        <li>Your registered email address</li>
        <li>Date of purchase</li>
        <li>Razorpay payment ID (found in your payment confirmation email)</li>
        <li>Reason for refund</li>
      </ul>
      <p>We will respond within <strong>2 business days</strong> and process eligible refunds within <strong>5–7 business days</strong>. Refunds will be credited to the original payment method.</p>

      <h2>5. Cancellation</h2>
      <p>JobTrack AI does not operate on a subscription model. There is nothing to cancel — you purchase credits as needed and use them at your own pace. To close your account, email <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>.</p>

      <h2>6. Contact</h2>
      <p>For refund queries, reach us at <a href="mailto:support@jobtrackai.co.in">support@jobtrackai.co.in</a>. We aim to respond within 2 business days.</p>
    </LegalLayout>
  )
}

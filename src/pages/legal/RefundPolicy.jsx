import LegalLayout from '../../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../../lib/legal'

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="When payments for TradeGradyzer are and are not refundable."
    >
      <p className="lead">
        This Refund Policy explains our position on refunds for paid plans on{' '}
        <strong>TradeGradyzer</strong> ("we", "us", "our"). It forms part of our{' '}
        <a href="/terms">Terms &amp; Conditions</a>. Please read it before purchasing.
      </p>

      <h2>1. The Service is a digital product delivered immediately</h2>
      <p>
        TradeGradyzer is a digital, on-demand service. When you purchase a plan, your access — and the
        ability to consume analyses — is made available to you straight away. Because of this, and to
        the maximum extent permitted by law, <strong>all payments are final and non-refundable</strong>,
        except where a refund is required by applicable law or expressly stated below.
      </p>

      <h2>2. No general right to a refund</h2>
      <p>We do not provide refunds for, among other things:</p>
      <ul>
        <li>change of mind after you have started using the Service;</li>
        <li>analyses you have already used or partially used;</li>
        <li>failure to use your plan, quota or remaining time before it expires or renews;</li>
        <li>dissatisfaction with an analysis, score, grade or suggested level — the Service is{' '}
          <strong>educational and not financial advice</strong>, and outcomes are not guaranteed
          (see our <a href="/disclaimer">Disclaimer</a>);</li>
        <li>trading or investment losses of any kind;</li>
        <li>account suspension or termination resulting from your breach of the Terms.</li>
      </ul>

      <h2>3. Your statutory rights (where they apply)</h2>
      <p>
        Nothing in this Policy removes or limits any refund or cancellation right you have under
        mandatory law in your country of residence. In particular:
      </p>
      <ul>
        <li>
          <strong>EU/EEA and UK consumers — 14-day right of withdrawal.</strong> Consumers normally
          have 14 days to withdraw from a distance contract for digital services. However, where you
          ask us to begin providing the Service immediately and acknowledge that you lose this right
          once performance has begun, the right to withdraw is lost once the Service has been fully
          performed. For digital content supplied immediately with your consent, the withdrawal right
          may not apply. If you have not yet used the Service, contact us within 14 days and we will
          honour a withdrawal where the law requires.
        </li>
        <li>
          <strong>Faulty or misdescribed service.</strong> If the Service is not as described, not
          fit for purpose, or not supplied with reasonable care and skill, you may be entitled to a
          remedy (which may include a repair, re-supply or refund) under applicable consumer law.
        </li>
        <li>
          <strong>Other jurisdictions.</strong> If the law that applies to you grants you a refund or
          cooling-off right, we will comply with it.
        </li>
      </ul>

      <h2>4. Duplicate, incorrect or unauthorised charges</h2>
      <p>
        We will refund a payment where you were charged in error — for example a duplicate charge, a
        clearly incorrect amount, or a charge for a plan you did not purchase. The{' '}
        <strong>Lifetime</strong> plan has a limited number of seats; if a payment is taken but the
        last seat is already claimed, that payment is refunded in full and you are not charged for a
        plan you did not receive.
      </p>

      <h2>5. Subscription renewals and cancellation</h2>
      <p>
        Weekly and Monthly plans renew automatically. You can cancel at any time from your account to
        stop future renewals; your access continues until the end of the current paid period.
        Cancelling does not, by itself, refund the current period. We do not provide pro-rated
        refunds for unused time except where required by law. The <strong>Lifetime</strong> plan is a
        one-time payment and does not renew.
      </p>

      <h2>6. How to request a refund</h2>
      <p>
        If you believe you are entitled to a refund under Section 3 or 4, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the email address on your account
        with:
      </p>
      <ul>
        <li>your account email;</li>
        <li>the payment date, amount and any payment/transaction reference; and</li>
        <li>the reason for your request.</li>
      </ul>
      <p>
        We aim to acknowledge requests within 5 business days and to resolve them promptly. Approved
        refunds are made to your original payment method via our payment processor (Paystack); the
        time for the funds to reach you depends on your bank or card provider. We may decline requests
        that fall outside this Policy and your statutory rights, and we may decline or claw back
        refunds where we reasonably suspect fraud or abuse.
      </p>

      <h2>7. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. The version in force at the time of your purchase
        applies to that purchase. The "Last updated" date above shows when this Policy last changed.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions about refunds? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}

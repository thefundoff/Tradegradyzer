import LegalLayout from '../../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../../lib/legal'

export default function ComplaintsPolicy() {
  return (
    <LegalLayout
      title="Complaints Policy"
      subtitle="How to raise a concern with TradeGradyzer and how we handle it."
    >
      <p className="lead">
        We want you to have a good experience with <strong>TradeGradyzer</strong> ("we", "us",
        "our"). If something goes wrong, this Complaints Policy explains how to tell us, what we will
        do, and where you can escalate if you are not satisfied.
      </p>

      <h2>1. What this Policy covers</h2>
      <p>
        This Policy covers complaints about the Service — for example billing and payments, account
        access, the operation of features, data protection and privacy, or the conduct of any
        communication from us. It does not change the nature of the Service: TradeGradyzer is an
        educational, AI-assisted tool and not financial advice (see our{' '}
        <a href="/disclaimer">Disclaimer</a>), so dissatisfaction with the outcome of a trade is not
        a matter we can compensate for.
      </p>

      <h2>2. How to make a complaint</h2>
      <p>
        Please email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject line
        "Complaint". To help us resolve it quickly, include:
      </p>
      <ul>
        <li>the email address registered to your account;</li>
        <li>a clear description of the problem and what went wrong;</li>
        <li>relevant dates, amounts and any payment/transaction references;</li>
        <li>any screenshots or supporting information; and</li>
        <li>what outcome you are seeking.</li>
      </ul>

      <h2>3. How we handle your complaint</h2>
      <p>Our process and target timescales are:</p>
      <table>
        <thead>
          <tr>
            <th>Stage</th>
            <th>What happens</th>
            <th>Target time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Acknowledge</td>
            <td>We confirm we have received your complaint and give it a reference.</td>
            <td>Within 5 business days</td>
          </tr>
          <tr>
            <td>Investigate</td>
            <td>We review the issue, the relevant records, and contact you if we need more
              information.</td>
            <td>Ongoing</td>
          </tr>
          <tr>
            <td>Respond</td>
            <td>We give you our findings, our decision and any resolution or next steps.</td>
            <td>Within 30 days</td>
          </tr>
        </tbody>
      </table>
      <p>
        If a complaint is complex and we need more time, we will let you know and keep you updated. We
        handle all complaints fairly, confidentially and without any detriment to you for raising one.
      </p>

      <h2>4. If you are not satisfied</h2>
      <p>
        If you are unhappy with our response, reply to our email and ask for the matter to be
        reviewed again, explaining why. A fresh review will be carried out where possible.
      </p>

      <h2>5. Escalating outside TradeGradyzer</h2>
      <p>
        You may also have the right to escalate to an external body, depending on the nature of your
        complaint and where you live:
      </p>
      <ul>
        <li>
          <strong>Data protection / privacy complaints:</strong> a supervisory authority — in Nigeria
          the Nigeria Data Protection Commission (NDPC); in the EU/EEA your local Data Protection
          Authority; in the UK the Information Commissioner's Office (ICO); in California the
          California Privacy Protection Agency. See our <a href="/privacy">Privacy Policy</a>.
        </li>
        <li>
          <strong>Payment complaints:</strong> you may be able to raise the matter with our payment
          processor (Paystack) or with your own bank or card provider.
        </li>
        <li>
          <strong>Consumer complaints:</strong> a consumer-protection or dispute-resolution body in
          your country may be able to assist.
        </li>
      </ul>
      <p>
        Raising a complaint does not affect your other legal rights, including any rights under our{' '}
        <a href="/terms">Terms &amp; Conditions</a>, <a href="/refund-policy">Refund Policy</a> and
        applicable consumer law.
      </p>

      <h2>6. Contact</h2>
      <p>
        To make a complaint or ask about this Policy, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}

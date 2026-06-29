import LegalLayout from '../../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../../lib/legal'

export default function Disclaimer() {
  return (
    <LegalLayout
      title="Disclaimer"
      subtitle="Important information about the nature and limits of TradeGradyzer's analysis."
    >
      <p className="lead">
        Please read this Disclaimer carefully. It applies to your use of <strong>TradeGradyzer</strong>{' '}
        (the "Service") and forms part of our <a href="/terms">Terms &amp; Conditions</a>. By using
        the Service, you acknowledge and accept everything below.
      </p>

      <h2>1. Not financial advice</h2>
      <p>
        TradeGradyzer is an <strong>educational and informational tool only</strong>. Nothing
        provided by the Service — including any score, confidence grade, bias, suggested support or
        resistance level, entry, stop-loss, take-profit, risk-to-reward figure, summary or warning —
        constitutes financial, investment, trading, legal, tax or accounting advice, or a personal
        recommendation. It is not an offer, solicitation or inducement to buy, sell or hold any
        currency, security, derivative, cryptocurrency or other financial instrument.
      </p>

      <h2>2. We are not your adviser or broker</h2>
      <p>
        TradeGradyzer is not a licensed broker, dealer, exchange, investment adviser, financial
        planner or financial institution, and is not registered with or authorised by any financial
        regulator. Using the Service does not create any advisory, fiduciary, brokerage or
        professional relationship between you and us. You should obtain independent advice from a
        suitably qualified and licensed professional before making any financial decision.
      </p>

      <h2>3. AI-generated, automated output</h2>
      <p>
        The analysis is generated automatically by a third-party artificial-intelligence model based
        on the chart images and information you provide. AI systems can be wrong, inconsistent,
        incomplete or out of date. The model may misread a chart, misidentify a timeframe or level,
        "hallucinate" details, or produce results that look confident but are inaccurate. The output
        is an opinion produced by software — not a statement of fact and not a guarantee. You must
        independently verify anything before relying on it.
      </p>

      <h2>4. No guarantee of results — trading is risky</h2>
      <p>
        <strong>Trading and investing carry a high level of risk and can result in the loss of some
        or all of your capital.</strong> Leveraged products such as forex, CFDs, futures and
        cryptocurrencies are especially risky and may not be suitable for everyone.{' '}
        <strong>Past performance is not indicative of future results.</strong> No score, grade or
        "A+" rating from the Service is a promise or prediction that a trade will be profitable. Any
        examples, hypothetical results or historical observations are for illustration only and do
        not represent actual results you will achieve.
      </p>

      <h2>5. You are solely responsible</h2>
      <p>
        You are solely and fully responsible for your own trading and investment decisions and for
        evaluating the merits and risks of any decision. Only trade with money you can afford to
        lose. You agree that you use the Service and act on any output entirely at your own risk, and
        that TradeGradyzer is not responsible or liable for any decision you make or any loss you
        incur.
      </p>

      <h2>6. Accuracy, third parties and availability</h2>
      <p>
        The Service depends on the images you upload and on third-party providers, and may be
        delayed, interrupted, inaccurate or unavailable. We do not warrant that the Service or its
        output is accurate, complete, current, reliable or error-free. Market data implied by your
        screenshots may be out of date by the time you act.
      </p>

      <h2>7. No liability</h2>
      <p>
        To the maximum extent permitted by law, TradeGradyzer and its operators accept no liability
        for any loss or damage — including trading or investment losses, lost profits or lost
        opportunities — arising from your use of, or reliance on, the Service or its output. This
        Disclaimer is subject to, and should be read together with, the "Disclaimer of warranties"
        and "Limitation of liability" sections of our <a href="/terms">Terms &amp; Conditions</a>.
        Nothing here excludes any liability that cannot be excluded under applicable law.
      </p>

      <h2>8. Jurisdiction and your responsibility to comply</h2>
      <p>
        Financial trading may be restricted or regulated in your country. It is your responsibility
        to ensure that your use of the Service and any trading you undertake is lawful where you live.
        The Service is not directed at any person in any jurisdiction where its use would be contrary
        to law.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this Disclaimer? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalLayout>
  )
}

// Canonicalize a timeframe string to compare them regardless of formatting.
// Handles the TradingView convention where 'M' = month and 'm' = minute, so
// "1M"/"1 month"/"monthly" → "1mo" but "1m"/"1 min" → "1m".
export function normTf(s) {
  if (!s) return ''
  const str = String(s).trim()
  if (/unknown|n\/?a|none/i.test(str)) return 'unknown'
  const num = (str.match(/\d+/) || ['1'])[0]

  let unit = ''
  if (/min|minute/i.test(str)) unit = 'm'
  else if (/month|monthly|\dmo\b/i.test(str)) unit = 'mo'
  else if (/hour|hr/i.test(str)) unit = 'h'
  else if (/week|wk/i.test(str)) unit = 'w'
  else if (/day|daily/i.test(str)) unit = 'd'
  else {
    // Single-letter unit — case matters (M=month, m=minute).
    const letters = str.match(/[a-zA-Z]/g)
    const last = letters ? letters[letters.length - 1] : ''
    if (last === 'm') unit = 'm'
    else if (last === 'M') unit = 'mo'
    else if (last === 'h' || last === 'H') unit = 'h'
    else if (last === 'd' || last === 'D') unit = 'd'
    else if (last === 'w' || last === 'W') unit = 'w'
  }
  return unit ? `${num}${unit}` : ''
}

/** Find the dropdown option that best matches a detected timeframe. */
export function matchOption(detected, options) {
  const target = normTf(detected)
  if (!target || target === 'unknown') return null
  return options.find((o) => normTf(o) === target) || null
}

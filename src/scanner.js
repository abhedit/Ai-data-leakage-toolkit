export const MAX_LENGTH = 20000

function isCard(value) {
  const digits = value.replace(/\D/g, '')
  if (/^(\d)\1+$/.test(digits)) return false
  const sum = [...digits].reverse().reduce((total, digit, index) => {
    const number = Number(digit) * (index % 2 ? 2 : 1)
    return total + (number > 9 ? number - 9 : number)
  }, 0)
  return sum % 10 === 0
}

export const detectors = {
  email: { label: 'Email address', marker: '[EMAIL]', pattern: /[\w.!#$%&'*+/=?^\x60{|}~-]+@[a-z\d-]+(?:\.[a-z\d-]+)+/gi },
  credential: {
    label: 'API credential', marker: '[CREDENTIAL]',
    pattern: /\b(?:veil_demo_[a-z\d_]{12,}|(?:sk_live_|sk_test_)[a-z\d]{16,}|AKIA[A-Z0-9]{16}|gh[pousr]_[a-zA-Z0-9]{30,}|sk-(?:proj-)?[a-zA-Z0-9_-]{20,})\b/g,
  },
  card: {
    label: 'Payment card', marker: '[PAYMENT CARD]',
    pattern: /(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g, validate: isCard,
  },
}

export function scan(text, rules) {
  if (text.length > MAX_LENGTH) throw new RangeError('Input exceeds the scan limit.')
  const spans = []
  const counts = {}
  let blocked = false

  for (const [type, detector] of Object.entries(detectors)) {
    const action = rules[type]
    if (!['allow', 'redact', 'block'].includes(action)) continue
    for (const match of text.matchAll(detector.pattern)) {
      if (detector.validate && !detector.validate(match[0])) continue
      counts[type] = (counts[type] ?? 0) + 1
      if (action === 'block') blocked = true
      if (action === 'redact') spans.push({ start: match.index, end: match.index + match[0].length, marker: detector.marker })
    }
  }

  const findings = Object.entries(counts).map(([type, count]) => ({ type, count, action: rules[type] }))
  if (blocked) return { decision: 'Blocked', output: null, findings }

  spans.sort((left, right) => left.start - right.start || right.end - left.end)
  const redactions = []
  for (const span of spans) {
    const previous = redactions.at(-1)
    if (previous && span.start < previous.end) {
      previous.end = Math.max(previous.end, span.end)
    } else {
      redactions.push(span)
    }
  }

  let output = ''
  let cursor = 0
  for (const span of redactions) {
    output += text.slice(cursor, span.start) + span.marker
    cursor = span.end
  }
  output += text.slice(cursor)
  return { decision: spans.length ? 'Redacted' : 'Allowed', output, findings }
}

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_LENGTH, scan } from '../src/scanner.js'

test('masks repeated addresses and a valid test card', () => {
  const result = scan('a@example.test / a@example.test / 4111 1111 1111 1111', {email: 'redact', card: 'redact'})
  assert.equal(result.output, '[EMAIL] / [EMAIL] / [PAYMENT CARD]')
  assert.deepEqual(result.findings, [
    {type: 'email', count: 2, action: 'redact'},
    {type: 'card', count: 1, action: 'redact'},
  ])
})

test('block takes priority and withholds the entire output', () => {
  const result = scan('a@example.test veil_demo_fixture00001', {email: 'redact', credential: 'block'})
  assert.equal(result.decision, 'Blocked')
  assert.equal(result.output, null)
  assert.equal(result.findings.length, 2)
  assert.doesNotMatch(JSON.stringify(result), /example\.test|fixture/)
})

test('allow reports matches and leaves the text intact', () => {
  const text = 'a@example.test with reference 4111 1111 1111 1112'
  const result = scan(text, {email: 'allow', card: 'block'})
  assert.equal(result.output, text)
  assert.equal(result.decision, 'Allowed')
  assert.deepEqual(result.findings, [{type: 'email', count: 1, action: 'allow'}])
})

test('a redacting credential rule masks a credential overlapping an allowed email', () => {
  const result = scan('veil_demo_fixture00001@example.test', {email: 'allow', credential: 'redact'})
  assert.equal(result.output, '[CREDENTIAL]@example.test')
})

test('oversized input is rejected', () => {
  assert.throws(() => scan('x'.repeat(MAX_LENGTH + 1), {}), RangeError)
})

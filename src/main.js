import home from 'lucide/icons/house.svg?url'
import scanIcon from 'lucide/icons/scan-text.svg?url'
import shield from 'lucide/icons/shield-check.svg?url'
import history from 'lucide/icons/chart-no-axes-column-increasing.svg?url'
import play from 'lucide/icons/play.svg?url'
import './style.css'
import examples from '../data/examples.json'
import policies from '../data/policies.json'
import { detectors, MAX_LENGTH, scan } from './scanner.js'

const app = document.querySelector('#app')
const icons = { overview: home, review: scanIcon, policies: shield, findings: history }
const pages = { overview: 'Overview', review: 'Prompt Review', policies: 'Policies', findings: 'Findings' }
const state = {
  surface: 'prompt',
  text: examples.prompt,
  policy: 'enterprise',
  result: scan(examples.prompt, policies.enterprise.rules),
  events: [],
  filter: 'All',
}

function activePage() {
  const page = location.hash.slice(1)
  return Object.hasOwn(pages, page) ? page : 'review'
}

function icon(url) {
  return `<img class="icon" alt="" src="${url}">`
}

function render() {
  const page = activePage()
  app.innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#review">Veil</a>
      <p>AI Data Loss<br>Prevention Toolkit</p>
      <nav aria-label="Main navigation">
        ${Object.entries(pages).map(([id, title]) =>
          `<a href="#${id}" ${page === id ? 'aria-current="page"' : ''}>${icon(icons[id])}${title}</a>`).join('')}
      </nav>
    </aside>
    <main id="main">${{ overview, review, policies: policyView, findings }[page]()}</main>`
  if (page === 'review') bindReview()
  if (page === 'policies') bindPolicies()
  if (page === 'findings') bindFindings()
}

function review() {
  const title = state.surface === 'prompt' ? 'Prompt' : 'Response'
  return `<header class="page-header">
    <div><h1>${title} Review</h1><p>Scan an AI ${title.toLowerCase()} for sensitive data and review the redacted result.</p></div>
    <div class="toolbar"><label for="policy">Policy</label><select id="policy">${Object.entries(policies).map(([id, policy]) =>
      `<option value="${id}" ${id === state.policy ? 'selected' : ''}>${policy.name}</option>`).join('')}</select>
      <button id="run" class="primary">${icon(play)}Run scan</button></div>
    </header>
    <div class="workbench">
      <section class="input-pane">
        <h2><label for="input">${title} (to scan)</label></h2>
        <p>Paste or edit the ${title.toLowerCase()} to analyze for sensitive data.</p>
        <textarea id="input" maxlength="${MAX_LENGTH}" spellcheck="false" autocomplete="off"></textarea>
        <div class="editor-controls"><label for="surface">Content type</label>
          <select id="surface"><option value="prompt">AI prompt</option><option value="response">AI response</option></select>
          <button id="sample" class="secondary">Load example</button>
        </div>
      </section>
      <section class="output-pane">
        <h2>Redacted preview</h2>
        <p>How the ${title.toLowerCase()} will look after applying the selected policy.</p>
        <div id="preview" class="preview" role="region" aria-label="Scan output" tabindex="0"></div>
        <div class="findings-bar"><h3>Findings</h3><div id="matches" role="status"></div><button id="copy" class="secondary" hidden>Copy result</button></div>
        <span id="copy-status" role="status"></span>
      </section>
    </div>`
}

function showResult() {
  const result = state.result
  const preview = document.querySelector('#preview')
  const matches = document.querySelector('#matches')
  const copy = document.querySelector('#copy')
  const run = document.querySelector('#run')
  run.disabled = !state.text.trim()
  copy.hidden = !result || result.output === null
  preview.classList.toggle('blocked', result?.decision === 'Blocked')
  preview.textContent = result ? (result.output ?? 'This policy blocks the content.') : 'Run a scan to see the result.'
  matches.replaceChildren()
  document.querySelector('#copy-status').textContent = ''
  if (!result) {
    matches.textContent = 'Awaiting scan'
    return
  }
  const summary = document.createElement('span')
  const total = result.findings.reduce((sum, finding) => sum + finding.count, 0)
  summary.textContent = `${result.decision} · ${total} found`
  matches.append(summary)
  for (const {type, count, action} of result.findings) {
    const badge = document.createElement('span')
    badge.className = `badge ${action}`
    badge.textContent = `${detectors[type].label} × ${count}`
    matches.append(badge)
  }
}

function bindReview() {
  const input = document.querySelector('#input')
  const surface = document.querySelector('#surface')
  input.value = state.text
  surface.value = state.surface
  function invalidate() {
    state.result = null
    showResult()
  }
  input.oninput = () => {
    state.text = input.value
    invalidate()
  }
  surface.onchange = () => {
    state.surface = surface.value
    state.result = null
    render()
    document.querySelector('#surface').focus()
  }
  document.querySelector('#sample').onclick = () => {
    input.value = examples[state.surface]
    state.text = input.value
    invalidate()
    input.focus()
  }
  document.querySelector('#policy').onchange = (event) => {
    state.policy = event.target.value
    invalidate()
  }
  document.querySelector('#run').onclick = () => {
    state.result = scan(state.text, policies[state.policy].rules)
    const {decision, findings} = state.result
    state.events.unshift({ time: new Date(), surface: state.surface, policy: policies[state.policy].name, decision, findings })
    if (state.events.length > 200) state.events.pop()
    showResult()
  }
  document.querySelector('#copy').onclick = async () => {
    const status = document.querySelector('#copy-status')
    try {
      await navigator.clipboard.writeText(state.result.output)
      status.textContent = 'Result copied.'
    } catch {
      status.textContent = 'Clipboard unavailable. Select the preview to copy it.'
    }
  }
  showResult()
}

function overview() {
  return `<header class="page-header"><div><h1>Overview</h1><p>Review sensitive data in AI prompts and responses.</p></div><a class="primary" href="#review">Open review</a></header>
  <div class="summary"><section><h2>${state.events.length}</h2><p>Scans this session</p></section>
    <section><h2>${state.events.filter(event => event.decision === 'Redacted').length}</h2><p>Redacted results</p></section>
    <section><h2>${state.events.filter(event => event.decision === 'Blocked').length}</h2><p>Blocked results</p></section></div>
  <p class="note">Veil scans in your browser. Findings record rule counts and decisions for this session.</p>`
}

function policyView() {
  return `<header class="page-header"><div><h1>Policies</h1><p>Choose what the custom policy does when it detects sensitive data.</p></div><button id="test-policy" class="primary">Test custom policy</button></header>
  <div class="table-wrap"><table><thead><tr><th scope="col">Data type</th><th scope="col">Default action</th><th scope="col">Custom action</th></tr></thead><tbody>
  ${Object.entries(detectors).map(([type, detector]) => `<tr><th scope="row">${detector.label}</th><td class="capitalize">${policies.enterprise.rules[type]}</td>
    <td><select aria-label="${detector.label} custom action" data-rule="${type}">${['redact', 'block', 'allow'].map(action =>
      `<option value="${action}" ${policies.custom.rules[type] === action ? 'selected' : ''}>${action[0].toUpperCase() + action.slice(1)}</option>`).join('')}</select></td></tr>`).join('')}
  </tbody></table></div><p class="note">Custom rules take effect for this session. Allow records matches, redact masks matches, and block withholds the entire preview.</p>`
}

function bindPolicies() {
  document.querySelectorAll('[data-rule]').forEach(select => {
    select.onchange = () => {
      policies.custom.rules[select.dataset.rule] = select.value
      if (state.policy === 'custom') state.result = null
    }
  })
  document.querySelector('#test-policy').onclick = () => {
    state.policy = 'custom'
    state.result = null
    location.hash = 'review'
  }
}

function findings() {
  return `<header class="page-header"><div><h1>Findings</h1><p>Review scan decisions and detected data types for this session.</p></div>
    <div class="toolbar"><label for="filter">Decision</label><select id="filter">${['All', 'Allowed', 'Redacted', 'Blocked'].map(value =>
      `<option ${value === state.filter ? 'selected' : ''}>${value}</option>`).join('')}</select>
    <button id="export" class="secondary" ${state.events.length ? '' : 'disabled'}>Export JSON</button></div></header>
    <div id="events"></div>`
}

function bindFindings() {
  const list = document.querySelector('#events')
  function update() {
    const events = state.events.filter(event => state.filter === 'All' || event.decision === state.filter)
    list.innerHTML = events.length ? `<div class="table-wrap"><table><thead><tr><th>Time</th><th>Content type</th><th>Policy</th><th>Decision</th><th>Matches</th></tr></thead>
      <tbody>${events.map(event => `<tr><td>${event.time.toLocaleTimeString()}</td><td class="capitalize">${event.surface}</td><td>${event.policy}</td>
      <td>${event.decision}</td><td>${event.findings.map(finding => `${detectors[finding.type].label} × ${finding.count}`).join(', ') || 'None'}</td></tr>`).join('')}</tbody></table></div>` :
      '<p class="note">No scans for this view. <a href="#review">Open review</a></p>'
  }
  document.querySelector('#filter').onchange = event => {
    state.filter = event.target.value
    update()
  }
  document.querySelector('#export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state.events, null, 2)], {type: 'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'veil-findings.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  update()
}

window.addEventListener('hashchange', render)
render()

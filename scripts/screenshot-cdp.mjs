// CDP screenshot capturer — drives an already-running Chrome (visible or headless)
// over the DevTools Protocol. Works with a VISIBLE window (unlike --screenshot,
// which is headless-only). Uses Node's built-in fetch + WebSocket (Node 22+).
//
// Usage: node scripts/screenshot-cdp.mjs <BASE_URL> <OUT_DIR> <WAIT_SECONDS> <CDP_PORT>
import { writeFileSync } from "node:fs"

const [BASE, OUT, WAIT_S = "8", PORT = "9222"] = process.argv.slice(2)
const WAIT = Math.max(1, Number(WAIT_S)) * 1000

const PAGES = [
  ["/demo", "dashboard"],
  ["/demo/components", "components"],
  ["/demo/server-table", "server-table"],
  ["/demo/form/kitchen-sink", "form-field-showcase"],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Open a fresh tab via the CDP HTTP endpoint (PUT is required on modern Chrome).
const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
const tab = await res.json()
const ws = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r, rej) => {
  ws.onopen = r
  ws.onerror = rej
})

let id = 0
const pending = new Map()
const events = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result)
    pending.delete(m.id)
  } else if (m.method) {
    events.push(m.method)
  }
}
const send = (method, params = {}) =>
  new Promise((r) => {
    const mid = ++id
    pending.set(mid, r)
    ws.send(JSON.stringify({ id: mid, method, params }))
  })

await send("Page.enable")
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
})

let ok = 0
for (const [path, name] of PAGES) {
  const url = BASE + path
  process.stdout.write(`→ ${name}  (${url})\n`)
  events.length = 0
  await send("Page.navigate", { url })
  // wait for the load event (or fall back to the fixed wait), then settle
  const start = Date.now()
  while (!events.includes("Page.loadEventFired") && Date.now() - start < WAIT) {
    await sleep(150)
  }
  await sleep(1500) // let SSR hydrate / fonts settle
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
  const out = `${OUT}/${name}.png`
  writeFileSync(out, Buffer.from(data, "base64"))
  const bytes = Buffer.from(data, "base64").length
  console.log(`   ✓ wrote ${out} (${bytes} bytes)`)
  ok++
}

ws.close()
console.log(`Done → ${OUT} (${ok}/${PAGES.length})`)

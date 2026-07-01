/**
 * Interactive demo page that exercises Sentry error capture + tracing on both
 * client and server. Styled to the project's dense token-based design system
 * (was a bespoke Sentry-purple layout that clashed with the rest of the app).
 */

import * as fs from 'node:fs/promises'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import {
  Activity,
  AlertTriangle,
  Bell,
  Bug,
  Check,
  Copy,
  MonitorPlay,
  Play,
  Server,
  ShieldAlert,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminShell, PageHeader } from '@/components/admin-shell'
import { FormSection, StatusBadge } from '@/demo/form/form-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/demo/sentry/testing')({
  component: RouteComponent,
  head: () => seo({ title: 'Sentry test' }),
  errorComponent: ({ error }) => {
    useEffect(() => {
      Sentry.captureException(error)
    }, [error])
    return (
      <AdminShell>
        <div className="px-6 py-6 max-w-3xl">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center">
            <ShieldAlert className="mx-auto size-6 text-destructive" />
            <h1 className="mt-3 text-[15px] font-semibold">
              Something went wrong
            </h1>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {error.message}
            </p>
          </div>
        </div>
      </AdminShell>
    )
  },
})

// Server function that will error (traced + captured).
const badServerFunc = createServerFn({ method: 'GET' }).handler(async () => {
  return await Sentry.startSpan(
    { name: 'Reading non-existent file', op: 'file.read' },
    async () => {
      try {
        await fs.readFile('./doesnt-exist', 'utf-8')
        return true
      } catch (error) {
        Sentry.captureException(error)
        throw error
      }
    },
  )
})

// Server function that will succeed but be traced.
const goodServerFunc = createServerFn({ method: 'GET' }).handler(async () => {
  return await Sentry.startSpan(
    { name: 'Successful server operation', op: 'demo.success' },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { success: true }
    },
  )
})

const FEATURES = [
  { icon: Bug, title: 'Error monitoring', desc: 'Client & server tracking' },
  { icon: Activity, title: 'Performance', desc: 'Tracing & spans' },
  { icon: Video, title: 'Session replay', desc: 'User session playback' },
  { icon: Bell, title: 'Alerts', desc: 'Instant notifications' },
]

type ResultState = { type: 'success' | 'error'; spanOp: string }

function RouteComponent() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, ResultState>>({})
  const [sentryConfigured, setSentryConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    setSentryConfigured(!!import.meta.env.VITE_SENTRY_DSN)
  }, [])

  const showWarning = sentryConfigured === false
  const disabled = sentryConfigured === false

  async function run(
    key: string,
    spanName: string,
    op: string,
    fn: () => Promise<void>,
    expectError = false,
  ) {
    setLoading((p) => ({ ...p, [key]: true }))
    try {
      await Sentry.startSpan({ name: spanName, op }, async () => {
        Sentry.setContext('demo', {
          feature: key,
          triggered_at: new Date().toISOString(),
        })
        await fn()
      })
      if (!expectError) {
        setResults((p) => ({ ...p, [key]: { type: 'success', spanOp: op } }))
      }
    } catch (error) {
      Sentry.captureException(error)
      setResults((p) => ({ ...p, [key]: { type: 'error', spanOp: op } }))
    } finally {
      setLoading((p) => ({ ...p, [key]: false }))
    }
  }

  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-3xl">
        <PageHeader
          icon={<ShieldAlert />}
          title="Sentry test"
          subtitle="Trigger errors and traces, then view them in your Sentry dashboard"
          primaryAction={
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-(--control-height) items-center rounded-lg border border-border px-3 text-(length:--control-font-size) font-medium hover:bg-muted transition-colors"
            >
              Open dashboard
            </a>
          }
        />

        {showWarning && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-[12px]">
              <p className="font-medium text-foreground">Sentry is not initialized</p>
              <p className="mt-0.5 text-muted-foreground">
                Set{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  VITE_SENTRY_DSN
                </code>{' '}
                to enable error tracking and performance monitoring.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* What Sentry covers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2 text-foreground/80">
                  <f.icon className="size-4" />
                  <span className="text-[13px] font-medium">{f.title}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Client-side */}
          <FormSection title="Client-side">
            <ActionRow
              icon={<MonitorPlay className="size-3.5" />}
              label="Trigger client error"
              hint="Throws on the client and captures it."
              loading={!!loading.clientError}
              result={results.clientError}
              action={
                <Button
                  variant="destructive"
                  disabled={disabled || loading.clientError}
                  onClick={() =>
                    run(
                      'clientError',
                      'Client Error Flow Demo',
                      'demo.client-error',
                      async () => {
                        throw new Error('Client-side error demonstration')
                      },
                      true,
                    )
                  }
                >
                  <Bug className="size-3.5" />
                  Trigger error
                </Button>
              }
            />
            <ActionRow
              icon={<Activity className="size-3.5" />}
              label="Test client trace"
              hint="Records a 1s client span."
              loading={!!loading.clientTrace}
              result={results.clientTrace}
              action={
                <Button
                  variant="outline"
                  disabled={disabled || loading.clientTrace}
                  onClick={() =>
                    run('clientTrace', 'Client Operation', 'demo.client-trace', () =>
                      new Promise((r) => setTimeout(r, 1000)),
                    )
                  }
                >
                  <Play className="size-3.5" />
                  Run trace
                </Button>
              }
            />
          </FormSection>

          {/* Server-side */}
          <FormSection title="Server-side">
            <ActionRow
              icon={<Server className="size-3.5" />}
              label="Trigger server error"
              hint="Reads a missing file on the server."
              loading={!!loading.serverError}
              result={results.serverError}
              action={
                <Button
                  variant="destructive"
                  disabled={disabled || loading.serverError}
                  onClick={() =>
                    run(
                      'serverError',
                      'Server Error Flow Demo',
                      'demo.server-error',
                      async () => {
                        await badServerFunc()
                      },
                      true,
                    )
                  }
                >
                  <Bug className="size-3.5" />
                  Trigger error
                </Button>
              }
            />
            <ActionRow
              icon={<Server className="size-3.5" />}
              label="Test server trace"
              hint="Records a traced server operation."
              loading={!!loading.serverTrace}
              result={results.serverTrace}
              action={
                <Button
                  variant="outline"
                  disabled={disabled || loading.serverTrace}
                  onClick={() =>
                    run('serverTrace', 'Server Operation', 'demo.server-trace', () =>
                      goodServerFunc().then(() => undefined),
                    )
                  }
                >
                  <Play className="size-3.5" />
                  Run trace
                </Button>
              }
            />
          </FormSection>

          <p className="text-[11px] text-muted-foreground">
            Uses{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              @sentry/tanstackstart-react
            </code>{' '}
            ·{' '}
            <a
              href="https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Documentation
            </a>
          </p>
        </div>
      </div>
    </AdminShell>
  )
}

// One action: label + hint on the left, button on the right, result below.
function ActionRow({
  icon,
  label,
  hint,
  action,
  loading,
  result,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  action: React.ReactNode
  loading: boolean
  result?: ResultState
}) {
  return (
    <div className="space-y-2 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground">{icon}</span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium">{label}</div>
            <div className="text-[11px] text-muted-foreground">{hint}</div>
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-foreground/60 animate-pulse" />
          Running…
        </div>
      ) : result ? (
        <div className="flex items-center gap-2">
          <StatusBadge
            label={result.type === 'error' ? 'Captured' : 'Traced'}
            tone={result.type === 'error' ? 'danger' : 'success'}
          />
          <CopyChip text={result.spanOp} />
        </div>
      ) : null}
    </div>
  )
}

// A copyable span.op chip.
function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
      )}
    >
      span.op: {text}
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { AdminShell, PageHeader } from '@/components/admin-shell'
import { useAppForm } from '@/demo/form/use-app-form'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/demo/form/address')({
  component: AddressForm,
  head: () => seo({ title: 'Address form' }),
})

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-[13px] font-medium mb-2">{title}</h2>
}

function AddressForm() {
  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      phone: '',
    },
    validators: {
      onBlur: ({ value }) => {
        const errors = {
          fields: {},
        } as {
          fields: Record<string, string>
        }
        if (value.fullName.trim().length === 0) {
          errors.fields.fullName = 'Full name is required'
        }
        return errors
      },
    },
    onSubmit: ({ value }) => {
      toast.success('Address saved', { description: value.fullName })
    },
  })

  return (
    <AdminShell>
      <div className="px-6 py-6 max-w-3xl">
        <PageHeader
          icon={<MapPin />}
          title="Address form"
          subtitle="TanStack Form with nested fields and per-field validation"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          {/* Contact */}
          <section>
            <SectionHeader title="Contact" />
            <div className="rounded-md border border-border bg-background p-4 space-y-3">
              <form.AppField name="fullName">
                {(field) => <field.TextField label="Full name" />}
              </form.AppField>

              <form.AppField
                name="email"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Email is required'
                    }
                    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                      return 'Invalid email address'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.TextField label="Email" placeholder="you@example.com" />
                )}
              </form.AppField>

              <form.AppField
                name="phone"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Phone number is required'
                    }
                    if (
                      !/^(\+\d{1,3})?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(
                        value,
                      )
                    ) {
                      return 'Invalid phone number format'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.TextField label="Phone" placeholder="123-456-7890" />
                )}
              </form.AppField>
            </div>
          </section>

          {/* Address */}
          <section>
            <SectionHeader title="Address" />
            <div className="rounded-md border border-border bg-background p-4 space-y-3">
              <form.AppField
                name="address.street"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Street address is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => <field.TextField label="Street address" />}
              </form.AppField>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <form.AppField
                  name="address.city"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'City is required'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="City" />}
                </form.AppField>
                <form.AppField
                  name="address.state"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'State is required'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="State" />}
                </form.AppField>
                <form.AppField
                  name="address.zipCode"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value || value.trim().length === 0) {
                        return 'Zip code is required'
                      }
                      if (!/^\d{5}(-\d{4})?$/.test(value)) {
                        return 'Invalid zip code format'
                      }
                      return undefined
                    },
                  }}
                >
                  {(field) => <field.TextField label="Zip code" />}
                </form.AppField>
              </div>

              <form.AppField
                name="address.country"
                validators={{
                  onBlur: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Country is required'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <field.Select
                    label="Country"
                    values={[
                      { label: 'United States', value: 'US' },
                      { label: 'Canada', value: 'CA' },
                      { label: 'United Kingdom', value: 'UK' },
                      { label: 'Australia', value: 'AU' },
                      { label: 'Germany', value: 'DE' },
                      { label: 'France', value: 'FR' },
                      { label: 'Japan', value: 'JP' },
                    ]}
                    placeholder="Select a country"
                  />
                )}
              </form.AppField>
            </div>
          </section>

          <div className="flex justify-end">
            <form.AppForm>
              <form.SubscribeButton label="Save address" />
            </form.AppForm>
          </div>
        </form>
      </div>
    </AdminShell>
  )
}

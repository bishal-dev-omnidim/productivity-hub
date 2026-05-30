export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { CategoryManager } from '@/components/categories/category-manager'
import { ProfileForm } from '@/components/categories/profile-form'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
  const session = await auth()

  const [categories, user] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session!.user.id },
      orderBy: { order: 'asc' },
    }),
    prisma.user.findUnique({ where: { id: session!.user.id } }),
  ])

  const serialized = categories.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and categories</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Profile</h2>
        <ProfileForm name={user?.name ?? ''} timezone={user?.timezone ?? 'UTC'} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Organize your time entries with color-coded categories.
        </p>
        <CategoryManager categories={serialized} />
      </section>
    </div>
  )
}

import { auth } from '@/auth'
import { CategorySidebar } from '@/components/CategorySidebar'
import { TimerWidget } from '@/components/TimerWidget'
import { QuickAddModal } from '@/components/QuickAddModal'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ReactQueryProvider } from '@/components/ReactQueryProvider'
import { prisma } from '@/lib/db'
import { DEMO_USER_EMAIL } from '@/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Ensure demo user exists (creates on first run if seed wasn't run)
  let userId = session?.user?.id
  if (!userId) {
    const user = await prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: {
        email: DEMO_USER_EMAIL,
        name: 'Demo User',
        categories: {
          create: [
            { name: 'Deep Work', color: '#6366f1', order: 0 },
            { name: 'Meetings', color: '#f59e0b', order: 1 },
            { name: 'Admin', color: '#10b981', order: 2 },
            { name: 'Personal', color: '#ec4899', order: 3 },
            { name: 'Learning', color: '#3b82f6', order: 4 },
          ],
        },
      },
    })
    userId = user.id
  }

  const categories = await prisma.category.findMany({
    where: { userId, isArchived: false },
    orderBy: { order: 'asc' },
  })

  return (
    <ReactQueryProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <CategorySidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
          <TimerWidget categories={categories} />
          <QuickAddModal categories={categories} />
        </div>
      </TooltipProvider>
    </ReactQueryProvider>
  )
}

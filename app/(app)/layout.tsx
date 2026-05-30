import { CategorySidebar } from '@/components/layout/category-sidebar'
import { TimerWidget } from '@/components/timer/timer-widget'
import { QuickAddModal } from '@/components/timeline/quick-add-modal'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ReactQueryProvider } from '@/providers/react-query-provider'
import { ensureDemoUser } from '@/lib/get-user'
import { categoriesService } from '@/services/categories-service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Ensures the demo user (and default categories) exist on first run.
  const userId = await ensureDemoUser()
  const categories = await categoriesService.list(userId)

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

import Link from 'next/link'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { LayoutDashboard, Calendar, Settings, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SignOutButton } from './SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Separator } from './ui/separator'

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId, isArchived: false },
    orderBy: { order: 'asc' },
  })
}

export async function CategorySidebar() {
  const session = await auth()
  if (!session?.user?.id) return null

  const categories = await getCategories(session.user.id)

  const nav = [
    { href: '/', label: 'Today', icon: LayoutDashboard },
    { href: '/week', label: 'This Week', icon: Calendar },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r bg-sidebar h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
          <Clock className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm">Productivity Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        <Separator className="my-2" />

        <p className="px-3 text-xs font-medium text-muted-foreground mb-1">Categories</p>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t flex items-center gap-2">
        <Avatar className="w-7 h-7">
          <AvatarImage src={session.user.image ?? undefined} />
          <AvatarFallback className="text-xs">
            {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground flex-1 truncate">
          {session.user.name ?? session.user.email}
        </span>
        <SignOutButton />
      </div>
    </aside>
  )
}

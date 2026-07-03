'use client'

import { Search, LogOut, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'

interface HeaderProps {
  user: {
    name: string
    email: string
    role: 'ADMIN' | 'EMPLOYEE'
  }
  onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()

  function handleLogout() {
    router.push('/auth/logout')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 lg:gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden -ml-1.5">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative flex-1 max-w-sm lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            id="global-search"
            type="search"
            placeholder="Buscar... (Alt+Q)"
            className="w-full pl-10 bg-muted/50 border-none focus-visible:bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2">
        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 lg:gap-3 cursor-pointer rounded-lg p-1.5 hover:bg-muted/70 transition-colors">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-xs text-muted-foreground/70 capitalize">{user.role.toLowerCase()}</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesi\u00f3n</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

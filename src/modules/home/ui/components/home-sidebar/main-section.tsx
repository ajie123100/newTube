'use client'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth, useClerk } from '@clerk/nextjs'
import { FlameIcon, HomeIcon, PlaySquareIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    title: 'Home',
    href: '/',
    icon: HomeIcon,
  },
  {
    title: 'Subscribed',
    href: '/feed/subscribed',
    icon: PlaySquareIcon,
    auth: true,
  },
  {
    title: 'Trending',
    href: '/feed/trending',
    icon: FlameIcon,
    auth: true,
  },
]

export const MainSection = () => {
  const clerk = useClerk()
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={pathname===item.href} // todo: Change to look at current pathName
                onClick={(e) => {
                  if (item.auth && !isSignedIn) {
                    e.preventDefault()
                    return clerk.openSignIn()
                  }
                }}
              >
                <Link href={item.href} className='flex items-center gap-4'>
                  <item.icon />
                  <span className='text-sm'>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

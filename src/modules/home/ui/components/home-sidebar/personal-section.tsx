'use client'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth, useClerk } from '@clerk/nextjs'
import { HistoryIcon, ListVideoIcon, ThumbsUpIcon } from 'lucide-react'
import Link from 'next/link'

const items = [
  {
    title: 'History',
    href: '/playlists/history',
    icon: HistoryIcon,
    auth: true,
  },
  {
    title: 'Liked videos',
    href: '/playlists/liked',
    icon: ThumbsUpIcon,
    auth: true,
  },
  {
    title: 'All playlists',
    href: '/playlists',
    icon: ListVideoIcon,
    auth: true,
  },
]

export const PersonalSection = () => {
  const clerk = useClerk()
  const { isSignedIn } = useAuth()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>You</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={false} // todo: Change to look at current pathName
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

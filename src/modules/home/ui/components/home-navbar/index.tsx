import { SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import { SearchInput } from './search-input'
import { AuthButton } from '@/modules/auth/ui/components/auth-button'

export const HomeNavbar = () => {
  return (
    <nav className='fixed top-0 left-0 right-0 h-16 bg-white flex items-center px-2 pr-5 z-50'>
      <div className='flex justify-center gap-4 w-full'>
        {/* Menu and Logo */}
        <div className='flex items-center flex-shrink-0'>
          <SidebarTrigger />
          <Link href={'/'}>
            <div className='p-4 flex items-center gap-1'>
              <Image alt='logo' src='/logo.svg' width={32} height={32} />
              <p className='font-semibold text-xl tracking-tighter'>NewTube</p>
            </div>
          </Link>
        </div>
        {/* SearchBar */}
        <div className='flex-1 flex justify-center items-center max-w-180 mx-auto'>
          <SearchInput />
        </div>

        <div className='flex-shrink-0 flex gap-4 items-center'>
          <AuthButton />
        </div>
      </div>
    </nav>
  )
}

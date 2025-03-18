'use client'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { ClapperboardIcon, UserCircleIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const AuthButton = () => {
  // todo: add sign in functionality
  return (
    <>
      <SignedIn>
        {/* <Button asChild variant='secondary'>
          <Link href='/studio'>
            <ClapperboardIcon className='size-4' />
            Studio
          </Link>
        </Button> */}
        <UserButton>
          <UserButton.MenuItems>
            {/* todo: add user profile menu button */}
            <UserButton.Link
              label='Studio'
              href='/studio'
              labelIcon={<ClapperboardIcon className='size-4' />}
            />
            <UserButton.Action label={'manageAccount'} />
          </UserButton.MenuItems>
        </UserButton>
      </SignedIn>
      <SignedOut>
        <SignInButton mode='modal'>
          <Button
            variant='outline'
            className='px-4 py-2 font-medium text-blue-600 hover:text-blue-500 border-blue-500/20
      rounded-full shadow-none hover:bg-blue-500/10'
          >
            <UserCircleIcon />
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  )
}

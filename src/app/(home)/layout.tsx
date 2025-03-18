import { HomeLayout } from '@/modules/home/ui/layouts/home-layout'

export const dynamic = 'force-dynamic'

interface layoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: layoutProps) => {
  return <HomeLayout>{children}</HomeLayout>
}

export default Layout

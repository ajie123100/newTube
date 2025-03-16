import { StudioLayout } from '@/modules/studio/ui/layouts/studio-layout'

interface layoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: layoutProps) => {
  return <StudioLayout>{children}</StudioLayout>
}

export default Layout

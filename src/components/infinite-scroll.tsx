import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import React, { useEffect } from 'react'
import { Button } from './ui/button'

interface InfiniteScrollProps {
  isManual?: boolean // 是否需要手动触发加载
  hasNextPage: boolean // 是否有下一页
  isFetchingNextPage: boolean // 是否正在加载下一页
  fetchNextPage: () => void //  加载下一页
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollProps) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5, // 当元素进入视口的比例达到 50% 时触发
    rootMargin: '100px', // 当元素进入视口时，触发事件的距离为 100px
  })
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage()
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, isManual, fetchNextPage])

  return (
    <div className='flex flex-col items-center p-4 gap-4'>
      <div ref={targetRef} className='h-1' />
      {hasNextPage ? (
        <Button
          variant={'secondary'}
          disabled={isFetchingNextPage && !hasNextPage}
          onClick={fetchNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      ) : (
        <p className='text-xs text-muted-foreground'>
          You have reached the end of the list
        </p>
      )}
    </div>
  )
}

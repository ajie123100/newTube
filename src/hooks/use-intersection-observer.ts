import { useEffect, useRef, useState } from "react";

/**
 * 交叉观察器钩子函数，用于检测DOM元素是否进入视口
 * @param options - 可选的IntersectionObserver配置选项
 * @returns 包含目标元素引用和交叉状态的对象
 */
export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  // 存储元素是否与视口交叉的状态
  const [isIntersecting, setIsIntersecting] = useState(false);
  // 创建对目标DOM元素的引用
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 创建交叉观察器实例，监听目标元素的可见性变化
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    // 如果目标元素存在，开始观察
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    // 清理函数：组件卸载时断开观察器连接
    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting };
};
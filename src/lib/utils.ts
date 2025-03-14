import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDuration = (duration: number) => {
  const seconds = Math.floor((duration % 60000) / 1000);
  const minutes = Math.floor(duration / 60000);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const snakeCaseToTitle = (str: string) => {
  // 将下划线替换为空格，然后将每个单词的首字母大写
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

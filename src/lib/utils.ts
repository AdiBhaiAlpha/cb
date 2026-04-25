import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Author: Chitron Bhattacharjee **/
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

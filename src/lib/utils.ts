import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSwissDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '–'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '–'
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}.${month}.${year}`
}

export function formatSwissDateShort(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '–'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '–'
  
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const monthLabel = months[date.getMonth()]
  const yearLabel = String(date.getFullYear()).substring(2)
  
  return `${monthLabel} '${yearLabel}`
}

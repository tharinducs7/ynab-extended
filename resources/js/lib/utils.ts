import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatPayeeForUrl = (payee: string): string => {
    return payee?.toLowerCase()?.replace(/\s+/g, '-'); // Converts spaces to dashes and lowercases the string
};

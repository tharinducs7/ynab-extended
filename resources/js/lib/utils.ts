import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatPayeeForUrl = (payee: string): string => {
    return payee?.toLowerCase()?.replace(/\s+/g, '-'); // Converts spaces to dashes and lowercases the string
};

export function formatBalance(
    balance: number,
    currency: string = 'LKR',
    convertToMillion: boolean = false
) {
   // const divisor = convertToMillion ? 1_000_000 : 1000
    const unit = convertToMillion ? 'M' : '' // Only show M for millions

    const formatted = new Intl.NumberFormat('en-LK', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(balance)

    return `${formatted}${unit ? unit + ' ' : ''} ${currency}`
}

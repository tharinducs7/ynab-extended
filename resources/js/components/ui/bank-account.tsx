import { useYNABContext } from '@/context/YNABContext'
import { formatPayeeForUrl } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import React from 'react'

interface BankAccountProps {
    account: {
        id: string
        name: string
        balance: number
        type: string
        note: string
    }
}

const BankAccount: React.FC<BankAccountProps> = ({ account }) => {
    const { currentBudget } = useYNABContext()

    const formattedBalance = new Intl.NumberFormat('en-LK', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(account.balance / 1000) + ` ${currentBudget?.currency || 'LKR'}`

    const avatarUrl = `https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(account.note)}.png`

    return (
        <div
            role="alert"
            className="relative w-full rounded-lg border px-4 py-3 text-sm flex items-center justify-between bg-background text-foreground"
        >
            {/* Left Section - Avatar & Name */}
            <div className="flex items-center gap-3">
                <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={account.name} />
                    <AvatarFallback>
                        {account.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="font-medium tracking-tight max-w-[180px] truncate">
                    {account.name}
                </div>
            </div>

            {/* Right Section - Balance */}
            <div className="text-sm font-medium text-foreground whitespace-nowrap">
                {formattedBalance}
            </div>
        </div>
    )
}

export default BankAccount

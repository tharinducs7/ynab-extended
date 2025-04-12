import React from 'react'
import { CheckCircle } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { cn, formatPayeeForUrl } from '@/lib/utils'
import TransactionDetailDialog from '../widgets/TransactionDetailDialog'

interface Transaction {
    id: string
    payee_name: string
    amount: number
    date: string
    category_name: string
    status?: 'Paid' | 'To Be Paid'
    payee_logo?: string
    memo: string
}

interface TransactionWithDisplay extends Transaction {
    amountDisplay?: React.ReactNode
}

interface TransactionCardProps {
    transaction: TransactionWithDisplay,
    minimalCard?: boolean
}

function getInitials(name: string) {
    const parts = name?.split(' ')
    return parts?.map((p) => p[0])?.join('')?.toUpperCase()
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, minimalCard = false }) => {
    const isPaid = transaction.status === 'Paid'
    const classNames = minimalCard ? 'relative my-1 p-2 w-full rounded-lg border text-sm flex items-center justify-between bg-background text-foreground' : 'relative w-full rounded-lg border my-2 px-4 py-3 text-sm flex items-center justify-between bg-background text-foreground';
    const avatarClassName = minimalCard ? 'size-6 rounded-lg' : 'size-6 rounded-lg';

    return (
        <div
            role="alert"
            className={classNames}
        >
            {/* Left Section - Avatar & Payee Info */}
            <div className="flex items-center gap-3">
                <Avatar className={avatarClassName}>
                    <AvatarImage src={`https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(transaction?.payee_name)}.png`} alt={transaction.payee_name} />
                    <AvatarFallback className="bg-muted text-primary font-bold">
                        {getInitials(transaction.payee_name)}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-medium tracking-tight truncate max-w-[180px]">
                        <span className="truncate">{transaction.payee_name}</span>
                        {isPaid &&
                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        }
                    </div>

                    {!minimalCard && (<div className="w-[400px] truncate text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} | {transaction.category_name} | {transaction.memo}
                    </div>)}
                    {minimalCard && <div className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()} | {transaction.category_name}</div>}
                    {minimalCard && <div className="text-xs text-muted-foreground">{transaction.memo}</div>}
                </div>
            </div>

            {/* Right Section - Amount & Status */}
            <div className="flex items-center justify-end space-x-2">
                <span
                    className={cn(
                        'text-sm font-semibold',
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                >
                    {transaction.amountDisplay ?? `${transaction.amount.toFixed(2)} LKR`}
                </span>
                <TransactionDetailDialog transaction={transaction} />
            </div>
        </div>
    )
}

export default TransactionCard

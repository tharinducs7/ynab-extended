import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { cn, formatPayeeForUrl } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

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
    const classNames = minimalCard ? 'relative my-1 p-1 w-full rounded-lg border text-sm flex items-center justify-between bg-background text-foreground' : 'relative w-full rounded-lg border my-2 px-2 py-1 text-sm flex items-center justify-between bg-background text-foreground';
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
                        <Dialog>
                            <DialogTrigger>
                                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2 justify-between">
                                        <div>
                                            <Avatar className="size-10 rounded-lg">
                                                <AvatarImage
                                                    src={`https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(transaction?.payee_name)}.png`}
                                                    alt={transaction.payee_name}
                                                />
                                                <AvatarFallback className="bg-muted text-primary font-bold">
                                                    {getInitials(transaction.payee_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <span>{transaction.payee_name}</span>
                                        <div className="flex flex-col items-end space-y-0.5">
                                            <span
                                                className={cn(
                                                    'text-sm font-semibold',
                                                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                )}
                                            >
                                                {transaction.amountDisplay ?? `LKR ${transaction.amount.toFixed(2)}`}
                                            </span>
                                        </div>
                                    </DialogTitle>

                                    <DialogDescription>
                                        {<div className="w-[400px] truncate text-xs text-muted-foreground">
                                            {new Date(transaction.date).toLocaleDateString()} | {transaction.category_name} | {transaction.memo}
                                        </div>}
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {!minimalCard && (<div className="w-[400px] truncate text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} | {transaction.category_name} | {transaction.memo}
                    </div>)}
                </div>
            </div>

            {/* Right Section - Amount & Status */}
            <div className="flex flex-col items-end space-y-0.5">
                <span
                    className={cn(
                        'text-sm font-semibold',
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                >
                    {transaction.amountDisplay ?? `LKR ${transaction.amount.toFixed(2)}`}
                </span>
            </div>
        </div>
    )
}

export default TransactionCard

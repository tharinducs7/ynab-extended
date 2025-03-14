/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { CheckCircle, AlertCircle, Calendar, Tag, CreditCard, FileText, Flag } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn, formatPayeeForUrl } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Use this dialog component where needed
interface Transaction {
    status: string;
    cleared: string;
    type: string;
    payee_name: string;
    id: string;
    amount: number;
    amountDisplay?: string;
    approved: boolean;
    date: string;
    category_name: string;
    account_name: string;
    memo?: string;
    flag_color?: string;
    parent_transaction_id?: string;
    transaction_id?: string;
    payee_id?: string;
    category_id?: string;
    deleted: boolean;
}

const TransactionDetailDialog = ({ transaction }: { transaction: any }) => {
    const isPaid = transaction.status === 'Paid';
    const isCleared = transaction.cleared === 'reconciled' || transaction.cleared === 'cleared';
    const isSubtransaction = transaction.type === 'subtransaction';

    return (
        <Dialog>
            <DialogTrigger>
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-4 justify-between pb-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-12 rounded-lg">
                                <AvatarImage
                                    src={`https://ik.imagekit.io/apbypokeqx/tr:di-default.png/${formatPayeeForUrl(transaction?.payee_name)}.png`}
                                    alt={transaction.payee_name}
                                />
                                <AvatarFallback className="bg-muted text-primary font-bold">
                                    {transaction.payee_name ? getInitials(transaction.payee_name) : 'NA'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold">{transaction.payee_name}</span>
                                <span className="text-sm text-muted-foreground">ID: {transaction.id?.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </DialogTitle>
                    <Separator />
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Date and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(transaction.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Category</p>
                                <p className="font-medium">{transaction.category_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account and Memo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Account</p>
                                <p className="font-medium">{transaction.account_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Memo</p>
                                <p className="font-medium">{transaction.memo || 'No memo'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Additional Details */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Additional Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {transaction.flag_color && (
                                <div className="flex items-center gap-2">
                                    <Flag className="h-3 w-3" style={{ color: transaction.flag_color }} />
                                    <span className="text-muted-foreground">Flagged</span>
                                </div>
                            )}
                            {transaction.parent_transaction_id && (
                                <div className="col-span-2 text-xs">
                                    <span className="text-muted-foreground">Parent Transaction: </span>
                                    <span className="font-mono text-xs">{transaction.parent_transaction_id}</span>
                                </div>
                            )}
                            {transaction.transaction_id && transaction.transaction_id !== transaction.id && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground text-xs">Transaction ID: </span>
                                    <span className="font-mono text-xs">{transaction.transaction_id}</span>
                                </div>
                            )}
                            {transaction.payee_id && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground text-xs">Payee ID: </span>
                                    <span className="font-mono text-xs">{transaction.payee_id}</span>
                                </div>
                            )}
                            {transaction.category_id && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground text-xs">Category ID: </span>
                                    <span className="font-mono text-xs">{transaction.category_id}</span>
                                </div>
                            )}
                            <span className="text-muted-foreground text-xs"> Last Updated: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-muted/20 -m-6 mt-0 p-4 pt-2">
                    <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                        <div className="flex items-center gap-1">
                                {isCleared && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Reconciled
                                    </Badge>
                                )}
                                {transaction.approved && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Approved
                                    </Badge>
                                )}
                                {isSubtransaction && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        Subtransaction
                                    </Badge>
                                )}
                            </div>
                        </span>

                        <span
                                className={cn(
                                    'text-xl font-bold',
                                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {transaction.amountDisplay ?? `${transaction.amount.toFixed(2)} LKR`}
                            </span>

                            {/* Last Updated: {new Date().toLocaleDateString()}</span> */}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Helper function to get initials from name
function getInitials(name: string) {
    const parts = name?.split(' ');
    return parts?.map((p) => p[0])?.join('')?.toUpperCase() || 'NA';
}

export default TransactionDetailDialog;

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { manualTransactionSchema, type ManualTransaction } from "@shared/schema";

interface User {
  id: number;
  name: string;
  email: string;
  balance: string;
  accountNumber: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function TransactionModal({ isOpen, onClose, user }: TransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");

  const form = useForm<Omit<ManualTransaction, 'userId'> & { userId: string }>({
    resolver: zodResolver(manualTransactionSchema.omit({ userId: true }).extend({ userId: manualTransactionSchema.shape.userId.transform(String) })),
    defaultValues: {
      userId: user?.id.toString() || "",
      type: "credit",
      amount: 0,
      description: "",
      reference: "",
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: Omit<ManualTransaction, 'userId'> & { userId: string }) => {
      const transactionData = {
        ...data,
        userId: parseInt(data.userId),
      };
      const response = await apiRequest("POST", "/api/admin/transactions", transactionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      toast({
        title: "Transaction completed",
        description: `Successfully ${transactionType === 'credit' ? 'credited' : 'debited'} ${user?.name}'s account.`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<ManualTransaction, 'userId'> & { userId: string }) => {
    transactionMutation.mutate({ ...data, type: transactionType });
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setTransactionType("credit");
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-prime-charcoal border-prime-slate/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Manual Transaction</DialogTitle>
          <DialogDescription className="text-gray-300">
            Add a manual transaction to {user.name}'s account.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-prime-navy/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Account Number:</span>
            <span className="font-mono text-white">{user.accountNumber}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-400">Current Balance:</span>
            <span className="font-semibold text-white">
              ${parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-400">Account Holder:</span>
            <span className="text-sm text-white">{user.name}</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("userId")} value={user.id.toString()} />

          <div>
            <Label className="text-white">Transaction Type</Label>
            <Select value={transactionType} onValueChange={(value: "credit" | "debit") => {
              setTransactionType(value);
              form.setValue("type", value);
            }}>
              <SelectTrigger className="bg-prime-navy border-prime-slate/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-prime-charcoal border-prime-slate/30">
                <SelectItem value="credit" className="text-white focus:bg-prime-slate/20">Credit (Add Money)</SelectItem>
                <SelectItem value="debit" className="text-white focus:bg-prime-slate/20">Debit (Remove Money)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount" className="text-white">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent"
              placeholder="Enter transaction amount"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-prime-error text-sm mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent resize-none"
              placeholder="Enter transaction description"
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-prime-error text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reference" className="text-white">Reference Number (Optional)</Label>
            <Input
              id="reference"
              className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent"
              placeholder="Auto-generated if left blank"
              {...form.register("reference")}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-prime-slate/30 text-gray-300 hover:bg-prime-slate/20 hover:text-white"
              onClick={handleClose}
              disabled={transactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 text-white font-semibold ${
                transactionType === 'credit' 
                  ? 'bg-prime-success hover:bg-green-600' 
                  : 'bg-prime-error hover:bg-red-600'
              }`}
              disabled={transactionMutation.isPending}
            >
              {transactionMutation.isPending 
                ? `Processing...` 
                : `${transactionType === 'credit' ? 'Credit' : 'Debit'} Account`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
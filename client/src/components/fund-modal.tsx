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
import { fundManagementSchema, type FundManagement } from "@shared/schema";
import { authManager } from "@/lib/auth";

interface User {
  id: number;
  name: string;
  email: string;
  balance: string;
}

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function FundModal({ isOpen, onClose, user }: FundModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<"add" | "subtract">("add");

  const form = useForm<Omit<FundManagement, 'userId'> & { userId: string }>({
    resolver: zodResolver(fundManagementSchema.omit({ userId: true }).extend({ userId: fundManagementSchema.shape.userId.transform(String) })),
    defaultValues: {
      userId: user?.id.toString() || "",
      amount: 0,
      action: "add",
      description: "",
    },
  });

  const fundMutation = useMutation({
    mutationFn: async (data: Omit<FundManagement, 'userId'> & { userId: string }) => {
      const fundData = {
        ...data,
        userId: parseInt(data.userId),
      };
      const response = await apiRequest("POST", `/api/admin/users/${fundData.userId}/fund`, fundData, authManager.getAuthHeader());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      toast({
        title: "Fund operation completed",
        description: `Successfully ${action === 'add' ? 'added funds to' : 'removed funds from'} ${user?.name}.`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fund operation failed",
        description: error.message || "Failed to update user funds. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<FundManagement, 'userId'> & { userId: string }) => {
    fundMutation.mutate({ ...data, action });
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setAction("add");
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-prime-charcoal border-prime-slate/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Manage User Funds</DialogTitle>
          <DialogDescription className="text-gray-300">
            Add or subtract funds from {user.name}'s account.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-prime-navy/50 rounded-lg">
          <div className="flex justify-between items-center">
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
            <Label className="text-white">Action</Label>
            <Select value={action} onValueChange={(value: "add" | "subtract") => {
              setAction(value);
              form.setValue("action", value);
            }}>
              <SelectTrigger className="bg-prime-navy border-prime-slate/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-prime-charcoal border-prime-slate/30">
                <SelectItem value="add" className="text-white focus:bg-prime-slate/20">Add Funds</SelectItem>
                <SelectItem value="subtract" className="text-white focus:bg-prime-slate/20">Subtract Funds</SelectItem>
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
              placeholder="Enter amount"
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
              placeholder="Enter description for this transaction"
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-prime-error text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-prime-slate/30 text-gray-300 hover:bg-prime-slate/20 hover:text-white"
              onClick={handleClose}
              disabled={fundMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 text-white font-semibold ${
                action === 'add' 
                  ? 'bg-prime-success hover:bg-green-600' 
                  : 'bg-prime-error hover:bg-red-600'
              }`}
              disabled={fundMutation.isPending}
            >
              {fundMutation.isPending 
                ? `${action === 'add' ? 'Adding' : 'Subtracting'}...` 
                : `${action === 'add' ? 'Add' : 'Subtract'} Funds`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

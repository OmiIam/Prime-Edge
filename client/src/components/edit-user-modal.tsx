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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { editUserSchema, type EditUser } from "@shared/schema";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  accountType: string;
  balance: string;
  accountNumber: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditUser>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: (user?.role as "user" | "admin") || "user",
      accountType: (user?.accountType as "checking" | "savings" | "business") || "checking",
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: EditUser) => {
      const response = await apiRequest("POST", `/api/admin/users/${user!.id}/edit`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
      toast({
        title: "User updated",
        description: `Successfully updated ${user?.name}'s profile.`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditUser) => {
    editUserMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-prime-charcoal border-prime-slate/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit User Profile</DialogTitle>
          <DialogDescription className="text-gray-300">
            Update {user.name}'s account information and settings.
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
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Full Name</Label>
            <Input
              id="name"
              className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent"
              placeholder="Enter full name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-prime-error text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <Input
              id="email"
              type="email"
              className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent"
              placeholder="Enter email address"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-prime-error text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white">User Role</Label>
            <Select 
              value={form.watch("role")} 
              onValueChange={(value: "user" | "admin") => form.setValue("role", value)}
            >
              <SelectTrigger className="bg-prime-navy border-prime-slate/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-prime-charcoal border-prime-slate/30">
                <SelectItem value="user" className="text-white focus:bg-prime-slate/20">Regular User</SelectItem>
                <SelectItem value="admin" className="text-white focus:bg-prime-slate/20">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Account Type</Label>
            <Select 
              value={form.watch("accountType")} 
              onValueChange={(value: "checking" | "savings" | "business") => form.setValue("accountType", value)}
            >
              <SelectTrigger className="bg-prime-navy border-prime-slate/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-prime-charcoal border-prime-slate/30">
                <SelectItem value="checking" className="text-white focus:bg-prime-slate/20">Checking Account</SelectItem>
                <SelectItem value="savings" className="text-white focus:bg-prime-slate/20">Savings Account</SelectItem>
                <SelectItem value="business" className="text-white focus:bg-prime-slate/20">Business Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-prime-slate/30 text-gray-300 hover:bg-prime-slate/20 hover:text-white"
              onClick={handleClose}
              disabled={editUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-prime-accent hover:bg-blue-600 text-white font-semibold"
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
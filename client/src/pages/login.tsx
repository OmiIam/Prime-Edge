import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import { loginSchema, type LoginUser } from "@shared/schema";
import Logo from "@/components/logo";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      authManager.login(data.token, data.user);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your account.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-prime-navy flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="gradient-card border-prime-slate/30 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </CardTitle>
            <p className="text-gray-300">Sign in to your Prime Edge Banking account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent"
                  placeholder="Enter your email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-prime-error text-sm mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="bg-prime-navy border-prime-slate/30 text-white placeholder:text-gray-400 focus:border-prime-accent pr-10"
                    placeholder="Enter your password"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-prime-error text-sm mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-prime-accent hover:bg-blue-600 text-white font-semibold py-3"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-400">Don't have an account? </span>
              <Button
                variant="link"
                className="text-prime-accent hover:text-blue-400 p-0 font-medium"
                onClick={() => setLocation("/register")}
              >
                Sign up
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-prime-slate/30">
              <div className="text-center text-sm text-gray-400">
                <p className="mb-2">Demo Credentials:</p>
                <p>Admin: admin@primeedge.bank / admin123</p>
                <p>User: john.doe@email.com / user123</p>
                <p>User: sarah.wilson@email.com / user123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFields } from "@/validators/auth";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, User, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const loginUser = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Very Weak", color: "bg-red-500" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
    },
  });

  const passwordVal = watch("password");

  useEffect(() => {
    if (!passwordVal) {
      setPasswordStrength({ score: 0, text: "Very Weak", color: "bg-red-500" });
      return;
    }

    let score = 0;
    if (passwordVal.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordVal)) score += 1;
    if (/[0-9]/.test(passwordVal)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score += 1;

    let text = "Very Weak";
    let color = "bg-red-500";

    if (score === 1) {
      text = "Weak";
      color = "bg-orange-500";
    } else if (score === 2) {
      text = "Fair";
      color = "bg-yellow-500";
    } else if (score === 3) {
      text = "Good";
      color = "bg-blue-500";
    } else if (score === 4) {
      text = "Strong";
      color = "bg-emerald-500";
    }

    setPasswordStrength({ score, text, color });
  }, [passwordVal]);

  const onSubmit = async (data: RegisterFields) => {
    setIsSubmitting(true);
    try {
      const response = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role
      });

      loginUser(response.user, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      toast.success("Account created!", {
        description: `Welcome to DigiSign, ${response.user.name}`,
      });

      router.push("/documents");
    } catch (err: any) {
      console.error(err);
      if (err?.status === 409) {
        toast.error("Registration failed", {
          description: "An account with this email already exists.",
        });
      } else {
        toast.error(err?.message || "An error occurred during registration. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500"></div>

      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create Account
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Get started with our secure digital signature solution
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
              <Input
                id="name"
                placeholder="John Doe"
                disabled={isSubmitting}
                className="pl-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400 mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isSubmitting}
                className="pl-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="pl-10 pr-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1 font-medium">{errors.password.message}</p>
            )}

            {/* Strength Indicator */}
            {passwordVal && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-slate-500">Strength:</span>
                  <span className={cn(
                    "font-semibold",
                    passwordStrength.score >= 3 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={cn(
                        "h-full flex-1 transition-all duration-300",
                        step <= passwordStrength.score ? passwordStrength.color : "bg-slate-800"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="pl-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
            {/* Role select Field  */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Role
              </Label>
              <select
                id="role"
                disabled={isSubmitting}
                className="w-full p-2 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
                {...register("role")}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-800/60 bg-slate-950/40 py-4 rounded-b-xl">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

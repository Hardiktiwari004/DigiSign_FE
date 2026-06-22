"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFields } from "@/validators/auth";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, KeySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenParam = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenParam,
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Keep form value in sync if query param updates
  useEffect(() => {
    if (tokenParam) {
      setValue("token", tokenParam);
    }
  }, [tokenParam, setValue]);

  const onSubmit = async (data: ResetPasswordFields) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        token: data.token,
        newPassword: data.newPassword,
      });

      toast.success("Password reset complete", {
        description: "Your password was updated successfully. Please sign in.",
      });

      router.push("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Invalid or expired password reset token.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Token field (only visible/editable if not in URL) */}
      <div className="space-y-1.5">
        <Label htmlFor="token" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
          Reset Token
        </Label>
        <div className="relative">
          <KeySquare className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
          <Input
            id="token"
            placeholder="uuid-token-string"
            disabled={isSubmitting || !!tokenParam}
            className="pl-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
            {...register("token")}
          />
        </div>
        {errors.token && (
          <p className="text-xs text-red-400 mt-1 font-medium">{errors.token.message}</p>
        )}
      </div>

      {/* New Password field */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-[18px] w-[18px] text-slate-500" />
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="pl-10 pr-10 bg-slate-950 border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl placeholder:text-slate-600"
            {...register("newPassword")}
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
        {errors.newPassword && (
          <p className="text-xs text-red-400 mt-1 font-medium">{errors.newPassword.message}</p>
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-blue-600/20"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Resetting Password...</span>
          </>
        ) : (
          <span>Confirm Password Reset</span>
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500"></div>

      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create New Password
        </CardTitle>
        <CardDescription className="text-slate-400 text-sm">
          Set your new password to regain access to your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Suspense
          fallback={
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          }
        >
          <ResetPasswordFormContent />
        </Suspense>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-800/60 bg-slate-950/40 py-4 rounded-b-xl">
        <Link
          href="/login"
          className="text-slate-400 hover:text-slate-300 font-medium inline-flex items-center text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

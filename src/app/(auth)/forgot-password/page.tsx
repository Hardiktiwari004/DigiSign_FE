"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFields } from "@/validators/auth";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFields) => {
    setIsSubmitting(true);
    try {
      const response = await authService.forgotPassword(data);
      setSuccess(true);
      
      // Sandbox mode: if backend exposes token, store it to show direct link
      if (response?.data?.resetToken) {
        setResetToken(response.data.resetToken);
        toast.info("Sandbox reset token retrieved!");
      } else {
        toast.success("Reset email simulated", {
          description: "If an account exists, reset instructions will arrive.",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500"></div>

      {!success ? (
        <>
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center">
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Enter your email address and we'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-blue-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </Button>
            </form>
          </CardContent>
        </>
      ) : (
        <CardContent className="pt-10 pb-6 text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Instructions Dispatched</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              If the email exists, password reset guidelines will reach your inbox shortly.
            </p>
          </div>

          {/* Sandbox Helper Link */}
          {resetToken && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                <KeyRound className="w-4 h-4" />
                <span>Sandbox Mode Link</span>
              </div>
              <p className="text-xs text-slate-300">
                The sandbox backend exposed a reset token. Click below to reset directly:
              </p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-semibold"
              >
                Reset Password Directly
              </Link>
            </div>
          )}
        </CardContent>
      )}

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

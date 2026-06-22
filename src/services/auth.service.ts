import { api } from "@/lib/client";
import { ApiSuccess } from "@/types/api";
import {
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
} from "@/types/auth";

export const authService = {
  async register(data: RegisterCredentials) {
    const res = await api.post<ApiSuccess<AuthResponse>>("/api/auth/register", data);
    return res.data.data;
  },

  async login(data: LoginCredentials) {
    const res = await api.post<ApiSuccess<AuthResponse>>("/api/auth/login", data);
    return res.data.data;
  },

  async logout(refreshToken: string) {
    const res = await api.post<ApiSuccess<void>>("/api/auth/logout", { refreshToken });
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiSuccess<any>>("/api/auth/me");
    return res.data.data;
  },

  async forgotPassword(data: ForgotPasswordData) {
    const res = await api.post<ApiSuccess<{ resetToken?: string }>>("/api/auth/forgot-password", data);
    return res.data;
  },

  async resetPassword(data: ResetPasswordData) {
    const res = await api.post<ApiSuccess<void>>("/api/auth/reset-password", data);
    return res.data;
  },
};
export default authService;

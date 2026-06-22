import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setUser, setIsLoading } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setIsLoading,
  };
}
export default useAuth;

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, authApi, tokenStorage } from "./api";
import { LoginFormData, RegisterFormData } from "./schemas";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<User>;
  register: (data: RegisterFormData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  const fetchCurrentUser = React.useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (data: LoginFormData): Promise<User> => {
    const res = await authApi.login({
      identifier: data.identifier,
      password: data.password,
    });
    tokenStorage.setTokens(res.token, res.refreshToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: RegisterFormData): Promise<User> => {
    const { confirmPassword: _confirmPassword, ...payload } = data;
    const res = await authApi.register(payload);
    tokenStorage.setTokens(res.token, res.refreshToken);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      router.push("/login");
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

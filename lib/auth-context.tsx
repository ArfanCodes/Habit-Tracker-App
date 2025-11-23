import { createContext, useContext, useEffect, useState } from "react";
import { AppwriteException, ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoadingUser: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<string | null | undefined>;
  signIn: (
    email: string,
    password: string
  ) => Promise<string | null | undefined>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const clearExistingSession = async () => {
    try {
      await account.deleteSession("current");
    } catch (error) {
      if (
        error instanceof AppwriteException &&
        (error.code === 404 || error.code === 401)
      ) {
        return; // no active session to clear
      }

      console.warn("Failed to clear existing Appwrite session", error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await account.create(ID.unique(), email, password);
      await signIn(email, password);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }

      return "An error occured during signup";
    }
  };
  const signIn = async (email: string, password: string) => {
    try {
      await clearExistingSession();
      await account.createEmailPasswordSession(email, password);
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      return null;
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 409) {
        try {
          const loggedInUser = await account.get();
          setUser(loggedInUser);
          return null;
        } catch (reuseError) {
          console.error("Failed to reuse existing Appwrite session", reuseError);
        }
      }

      setUser(null);
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occured during sign in";
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoadingUser, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return context;
}

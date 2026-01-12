import { useLogin as usePrivyLogin } from "@privy-io/react-auth";

import {
  getLoginId,
  LoginResponse,
} from "../../components/ConnectWalletButton/utils";
import { type AddUserParams, useAddUser } from "./useAddUser";

const useLogin = ({
  onSuccess,
  onError,
}: {
  onSuccess: (address: string) => void;
  onError: (error: unknown) => void;
}) => {
  const { mutateAsync: addUser } = useAddUser();

  const { login } = usePrivyLogin({
    onComplete: async (loginResponse) => {
      const { wasAlreadyAuthenticated, isNewUser, loginMethod } = loginResponse;

      const handleLoginComplete = (loginResponse: LoginResponse) => {
        const { user, loginMethod } = loginResponse;

        if (!loginMethod)
          throw new Error("AddUserError: login method not found");
        const loginId = getLoginId(loginResponse);
        const params: AddUserParams = {
          privy_id: user.id,
          address: user?.smartWallet?.address || "",
          total_value: 0,
          login_type: loginMethod,
          login_id: loginId,
        };

        return params;
      };

      // Skip if already authenticated AND not a new user, or if no login method
      if ((wasAlreadyAuthenticated && !isNewUser) || !loginMethod) return;

      const params = handleLoginComplete(loginResponse);
      // Try to add user to database immediately
      try {
        await addUser(params);
        
        if (isNewUser) {
          console.log("New user successfully added:", params.address);
        }
        
        onSuccess(params.address);
      } catch (error) {
        console.error("Failed to add user to database:", error);
        
        // For new users, store in localStorage as fallback
        if (isNewUser) {
          localStorage.setItem("isNewUser", "true");
          localStorage.setItem("addUserParams", JSON.stringify(params));
          console.log("Stored new user in localStorage as fallback");
        }
        
        // Still call onSuccess to not block the user
        onSuccess(params.address);
      }
    },
    onError: (error) => {
      onError(error);
    },
  });

  return {
    login,
  };
};

export default useLogin;

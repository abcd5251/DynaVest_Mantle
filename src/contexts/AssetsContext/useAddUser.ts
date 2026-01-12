import { useMutation } from "@tanstack/react-query";
import { LoginMethod } from "../../components/ConnectWalletButton/utils";

export type AddUserParams = {
  privy_id: string;
  address: string;
  login_type: LoginMethod;
  login_id: string;
  total_value: number;
};

export const useAddUser = () => {
  return useMutation({
    mutationFn: async (params: AddUserParams) => {
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_CHATBOT_URL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!createResponse.ok) {
        const createData = await createResponse.json();
        
        // If it's a duplicate key error, just return success (user already exists)
        if (createData.detail && createData.detail.includes('duplicate key value violates unique constraint')) {
          console.log("User already exists, continuing...");
          return params.address;
        }
        
        throw new Error(createData.detail || 'Failed to create user');
      }

      return params.address;
    },
  });
};
import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
};

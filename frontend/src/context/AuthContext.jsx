import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "sigep_auth_token";
const USER_KEY = "sigep_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sincronizar headers de axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Token ${token}`;
      // Validar sesión contra el servidor
      api
        .get("/auth/perfil/")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data));
        })
        .catch(() => {
          // Token inválido o expirado
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  async function login(username, password) {
    const res = await api.post("/auth/login/", { username, password });
    const { token: nuevoToken, usuario } = res.data;
    localStorage.setItem(TOKEN_KEY, nuevoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    api.defaults.headers.common["Authorization"] = `Token ${nuevoToken}`;
    setToken(nuevoToken);
    setUser(usuario);
    return usuario;
  }

  async function registro(datos) {
    const res = await api.post("/auth/registro/", datos);
    const { token: nuevoToken, usuario } = res.data;
    localStorage.setItem(TOKEN_KEY, nuevoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    api.defaults.headers.common["Authorization"] = `Token ${nuevoToken}`;
    setToken(nuevoToken);
    setUser(usuario);
    return usuario;
  }

  function logout() {
    if (token) {
      api.post("/auth/logout/").catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common["Authorization"];
    setToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("https://stella-backend-qg81.onrender.com/api/users/me", {
          credentials: "include",
        });

        if(!res.ok) {
          setUser(null);
        } 
        else {
          const data = await res.json();
          setUser(data);
        }
      } 
      catch(err) {
        console.error("Error fetching user:", err);
        setUser(null);
      } 
      finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
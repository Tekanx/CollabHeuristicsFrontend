import { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    //@Tekanx TODO, expects API endpoint
                    const response = null;
                    setUser = (response.data);
                }
            } catch (error) {
                console.error('Error en cargar al usuario', error);
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (correo, password) => {
        try {
            //@Tekanx TODO, expects API endpoint
            const response = null;
            const {token, user} = response.data;
            localStorage.setItem('token', token);
            setUser(user);

            if (user.roles.includes('Coordinador')) {
                router.push('');
            } else {
                router.push('');
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser = null;
        router.push('login');
    }

    const hasRole = (role) => {
        return user?.roles?.includes(role) || false;
    };

    return(
        <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
            { children }
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
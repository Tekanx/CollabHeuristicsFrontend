import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUserLoggedIn()
    }, [])

    const checkUserLoggedIn = async () => {
        try{
            const token = localStorage.getItem('token')
            if(!token){
                setLoading(false)
                return
            }

            const response = await fetch('/auth/verify' , {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            }
            else{
                localStorage.removeItem('token')
            }
        } catch (err){
            console.error('Authentication error: ', err)
        } finally {
            setLoading(false)
        }
    }
}
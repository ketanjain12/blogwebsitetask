import{createContext,useContext,useEffect,useState}from'react';
import React from 'react';
import api from'./api';
const C=createContext(null);
export function AuthProvider({children})
{const[user,setUser]=useState(null),
[loading,setLoading]=useState(true);
useEffect(()=>{if(!localStorage.getItem('bs_token')){setLoading(false);return}api.get('/auth/me').then(r=>setUser(r.data.user)).catch(()=>localStorage.removeItem('bs_token')).finally(()=>setLoading(false))},[]);
const login=async(email,password)=>{const{data}=await api.post('/auth/login',{email,password});localStorage.setItem('bs_token',data.token);setUser(data.user);return data.user};
const register=async(name,email,password)=>{const{data}=await api.post('/auth/register',{name,email,password});localStorage.setItem('bs_token',data.token);setUser(data.user);return data.user};
const logout=()=>{localStorage.removeItem('bs_token');setUser(null)};
return <C.Provider value={{user,loading,login,register,logout}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);

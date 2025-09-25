import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    eventSource: null,

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/register", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSSE();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
            
            get().connectSSE();
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/api/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSSE();
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSSE: () => {
        const { authUser } = get();
        if (!authUser || get().eventSource) return;

        const eventSource = new EventSource( `${ BASE_URL }/api/sse/connect`, {
            withCredentials: true
        } )

        eventSource.onopen = () => {
            console.log("SSE connection established");
        };

        eventSource.addEventListener("onlineUsers", (event) => {
            const userIds = JSON.parse(event.data);
            set({ onlineUsers: userIds });
        });

        eventSource.addEventListener("newMessage", (event) => {
            const message = JSON.parse(event.data);
            window.dispatchEvent(new CustomEvent("newMessage", { detail: message }));
        });

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log("SSE connection closed");
            }
        };

        set({ eventSource });
    },

    disconnectSSE: () => {
        const eventSource = get().eventSource;
        if (eventSource) {
            eventSource.close();
            set({ eventSource: null });
        }
    },
} ) )

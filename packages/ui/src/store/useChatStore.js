import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    messageHandler: null,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const { authUser } = useAuthStore.getState();
            const excludedUserId = authUser.id;
            
            const res = await axiosInstance.get("/user", {
                params: {
                    excludedUserId
                }
            });
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const handleNewMessage = (event) => {
            const newMessage = event.detail;
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            set({
                messages: [...get().messages, newMessage],
            });
        };

        window.addEventListener("newMessage", handleNewMessage);
        
        // Store the handler for cleanup
        get().messageHandler = handleNewMessage;
    },

    unsubscribeFromMessages: () => {
        const messageHandler = get().messageHandler;
        if (messageHandler) {
            window.removeEventListener("newMessage", messageHandler);
            set({ messageHandler: null });
        }
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

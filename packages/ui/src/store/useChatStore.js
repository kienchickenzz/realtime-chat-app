import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    conversations: [],
    pagination: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isConversationsLoading: false,
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

    getConversations: async () => {
        set({ isConversationsLoading: true });
        try {
            const res = await axiosInstance.get("/conversation");
            set({ conversations: res.data.conversations || [] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load conversations");
        } finally {
            set({ isConversationsLoading: false });
        }
    },

    createDirectConversation: async (targetUserId) => {
        try {
            const res = await axiosInstance.post("/conversation/direct", { 
                targetUserId
            });
            
            const newConversation = res.data.conversation;
            const { conversations } = get();
            
            // Check if conversation already exists in local state
            const existingIndex = conversations.findIndex(conv => conv.id === newConversation.id);
            
            if (existingIndex !== -1) {
                // Update existing conversation with full data
                const updatedConversations = [...conversations];
                updatedConversations[existingIndex] = newConversation;
                set({ conversations: updatedConversations, selectedUser: newConversation });
            } else {
                // Add new conversation to the list
                set({ 
                    conversations: [newConversation, ...conversations],
                    selectedUser: newConversation
                });
            }
            
            // Load messages for this conversation
            await get().getConversationMessages(newConversation.id);
            
            return newConversation;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create conversation");
            throw error;
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

    getConversationMessages: async (conversationId, page = 1, limit = 50) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/conversation/${conversationId}/messages`, {
                params: { page, limit }
            });
            
            set({ 
                messages: res.data.messages || [],
                pagination: res.data.pagination || null
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load messages");
            set({ messages: [] });
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        
        if (!selectedUser?.id) {
            toast.error("No conversation selected");
            return;
        }

        try {
            // Prepare message payload for new endpoint
            const payload = {
                conversationId: selectedUser.id,
                content: messageData.text,
                messageType: messageData.image ? 'image' : 'text'
            };

            // If there's an image, we'll need to handle file upload differently
            // For now, let's handle text messages
            if (messageData.image) {
                // TODO: Implement image upload logic
                toast.error("Image messages not yet implemented");
                return;
            }

            const res = await axiosInstance.post('/message', payload);
            
            // Add the new message to local state
            set({ messages: [...messages, res.data.message] });
            
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
            throw error;
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const handleNewMessage = (event) => {
            const newMessage = event.detail;
            // For conversation-based messages, check if message belongs to current conversation
            const isMessageFromCurrentConversation = selectedUser.id && 
                (newMessage.conversationId === selectedUser.id || 
                 newMessage.senderId === selectedUser._id);
            
            if (!isMessageFromCurrentConversation) return;

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

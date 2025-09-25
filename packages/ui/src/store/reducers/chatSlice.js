import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    messages: [],
    users: [],
    selectedUser: null,
    conversations: [],
    pagination: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isConversationsLoading: false,
    messageHandler: null,
}

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Messages
        setMessages: (state, action) => {
            state.messages = action.payload
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload)
        },
        setIsMessagesLoading: (state, action) => {
            state.isMessagesLoading = action.payload
        },
        
        // Users
        setUsers: (state, action) => {
            state.users = action.payload
        },
        setIsUsersLoading: (state, action) => {
            state.isUsersLoading = action.payload
        },
        
        // Conversations
        setConversations: (state, action) => {
            state.conversations = action.payload
        },
        addConversation: (state, action) => {
            const newConversation = action.payload
            const existingIndex = state.conversations.findIndex(conv => conv.id === newConversation.id)
            
            if (existingIndex !== -1) {
                // Update existing conversation
                state.conversations[existingIndex] = newConversation
            } else {
                // Add new conversation to the beginning
                state.conversations.unshift(newConversation)
            }
        },
        updateConversation: (state, action) => {
            const updatedConversation = action.payload
            const index = state.conversations.findIndex(conv => conv.id === updatedConversation.id)
            if (index !== -1) {
                state.conversations[index] = updatedConversation
            }
        },
        setIsConversationsLoading: (state, action) => {
            state.isConversationsLoading = action.payload
        },
        
        // Selected User/Conversation
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload
        },
        
        // Pagination
        setPagination: (state, action) => {
            state.pagination = action.payload
        },
        
        // Message Handler (for SSE subscription)
        setMessageHandler: (state, action) => {
            state.messageHandler = action.payload
        },
        
        // Clear messages when switching conversations
        clearMessages: (state) => {
            state.messages = []
        },
        
        // Reset chat state
        resetChatState: (state) => {
            state.messages = []
            state.selectedUser = null
            state.conversations = []
            state.pagination = null
            if (state.messageHandler) {
                window.removeEventListener("newMessage", state.messageHandler)
                state.messageHandler = null
            }
        }
    }
})

export const {
    setMessages,
    addMessage,
    setIsMessagesLoading,
    setUsers,
    setIsUsersLoading,
    setConversations,
    addConversation,
    updateConversation,
    setIsConversationsLoading,
    setSelectedUser,
    setPagination,
    setMessageHandler,
    clearMessages,
    resetChatState
} = chatSlice.actions

export default chatSlice.reducer
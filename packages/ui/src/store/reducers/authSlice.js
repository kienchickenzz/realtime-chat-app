import { createSlice } from '@reduxjs/toolkit'
import AuthUtils from '@/utils/authUtils'

const initialState = {
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
    isAuthenticated: 'true' === localStorage.getItem('isAuthenticated'),
    isGlobal: 'true' === localStorage.getItem('isGlobal'),
    token: null,
    // From Zustand store - sync state only
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    eventSource: null,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            AuthUtils.updateStateAndLocalStorage(state, action.payload)
        },
        logoutSuccess: (state) => {
            state.user = null
            state.token = null
            state.permissions = null
            state.features = null
            state.isAuthenticated = false
            state.isGlobal = false
            AuthUtils.removeCurrentUser()
        },
        userProfileUpdated: (state, action) => {
            const user = AuthUtils.extractUser(action.payload)
            state.user.name = user.name
            state.user.email = user.email
            AuthUtils.updateCurrentUser(state.user)
        },
        // From Zustand store - sync actions only
        setAuthUser: (state, action) => {
            state.authUser = action.payload
        },
        setIsSigningUp: (state, action) => {
            state.isSigningUp = action.payload
        },
        setIsLoggingIn: (state, action) => {
            state.isLoggingIn = action.payload
        },
        setIsUpdatingProfile: (state, action) => {
            state.isUpdatingProfile = action.payload
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload
        },
        setEventSource: (state, action) => {
            state.eventSource = action.payload
        },
        clearAuth: (state) => {
            state.authUser = null
            state.onlineUsers = []
            if (state.eventSource) {
                state.eventSource.close()
                state.eventSource = null
            }
        }
    }
})

export const { 
    loginSuccess, 
    logoutSuccess, 
    workspaceSwitchSuccess, 
    upgradePlanSuccess, 
    userProfileUpdated, 
    workspaceNameUpdated,
    setAuthUser,
    setIsSigningUp,
    setIsLoggingIn,
    setIsUpdatingProfile,
    setOnlineUsers,
    setEventSource,
    clearAuth
} = authSlice.actions
export default authSlice.reducer

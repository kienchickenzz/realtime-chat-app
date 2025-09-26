import client from '@/api/client'

const registerAccount = (body) => client.post(`/auth/register`, body)
const forgotPassword = (body) => client.post('/auth/forgot-password', body)
const resetPassword = (body) => client.post('/auth/reset-password', body)
const logout = () => client.post('/auth/logout')

const getBasicAuth = () => client.get('/account/basic-auth')
const checkBasicAuth = (body) => client.post('/account/basic-auth', body)

export default {
    registerAccount,
    forgotPassword,
    resetPassword,
    logout,
    getBasicAuth,
    checkBasicAuth
}

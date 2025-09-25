import client from '@/api/client'

const inviteAccount = (body) => client.post(`/account/invite`, body)
const registerAccount = (body) => client.post(`/account/register`, body)
const forgotPassword = (body) => client.post('/account/forgot-password', body)
const resetPassword = (body) => client.post('/account/reset-password', body)
const logout = () => client.post('/account/logout')
const getBasicAuth = () => client.get('/account/basic-auth')
const checkBasicAuth = (body) => client.post('/account/basic-auth', body)

export default {
    inviteAccount,
    registerAccount,
    forgotPassword,
    resetPassword,
    logout,
    getBasicAuth,
    checkBasicAuth
}

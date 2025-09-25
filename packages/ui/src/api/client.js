import axios from 'axios'
import { baseURL, ErrorMessage } from '@/store/constant'
import AuthUtils from '@/utils/authUtils'

const apiClient = axios.create({
    baseURL: `${baseURL}/api`,
    headers: {
        'Content-type': 'application/json',
        'x-request-from': 'internal'
    },
    withCredentials: true
})

// IMPORTANT: Đây là nơi duy nhất định nghĩa interceptor để refresh token trong toàn bộ codebase phía client!?
apiClient.interceptors.response.use(
    function (response) {
        return response
    },
    async (error) => {
        if (error.response.status === 401) {
            // check if refresh is needed
            if (error.response.data.message === ErrorMessage.TOKEN_EXPIRED && error.response.data.retry === true) {
                const originalRequest = error.config
                // call api to get new token
                const response = await axios.post(`${baseURL}/api/auth/refreshToken`, {}, { withCredentials: true })
                if (response.data.id) {
                    // retry the original request
                    return apiClient.request(originalRequest)
                }
            }
            localStorage.removeItem('username')
            localStorage.removeItem('password')
            AuthUtils.removeCurrentUser()
        }

        return Promise.reject(error)
    }
)

export default apiClient

import { combineReducers } from 'redux'

import authReducer from './reducers/authSlice'
import customizationReducer from './reducers/customizationReducer'
import notifierReducer from './reducers/notifierReducer'
import chatReducer from './reducers/chatSlice'
import themeReducer from './reducers/themeSlice'

const reducer = combineReducers( {
    auth: authReducer,
    customization: customizationReducer,
    notifier: notifierReducer,
    chat: chatReducer,
    theme: themeReducer,
} )

export default reducer

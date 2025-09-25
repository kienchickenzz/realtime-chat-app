import { createStore } from 'redux'
import reducer from './reducer'

// ==============================|| REDUX - MAIN STORE ||============================== //

const store = createStore( reducer )
const persister = 'Free'

// IMPORTANT: Why persister here?
export { store, persister }

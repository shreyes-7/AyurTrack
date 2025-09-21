// Holds global UI state (dark mode) and an offline queue (localStorage). Exposes helper functions.
import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadArray, saveArray } from '../services/localStore'


const AppContext = createContext()


export function AppProvider({ children }) {
const [dark, setDark] = useState(() => JSON.parse(localStorage.getItem('ayurtrace:dark') || 'true'))
const [queue, setQueue] = useState(() => loadArray('ayurtrace:queue'))


useEffect(() => {
localStorage.setItem('ayurtrace:dark', JSON.stringify(dark))
document.documentElement.classList.toggle('dark', dark)
}, [dark])


useEffect(() => saveArray('ayurtrace:queue', queue), [queue])


function pushQueue(item) { setQueue(q => [item, ...q]) }
function popQueue() { setQueue(q => q.slice(0, -1)) }
function clearQueue() { setQueue([]) }


return (
<AppContext.Provider value={{ dark, setDark, queue, pushQueue, popQueue, clearQueue }}>
{children}
</AppContext.Provider>
)
}


export function useApp() { return useContext(AppContext) }
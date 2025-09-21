// App bootstrap: imports global CSS and mounts the React app
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'


createRoot(document.getElementById('root')).render(
<React.StrictMode>
<AppProvider>
<BrowserRouter>
<App />
</BrowserRouter>
</AppProvider>
</React.StrictMode>
)
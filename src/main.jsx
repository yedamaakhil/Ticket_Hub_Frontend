import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react'

const PUBLIC_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLIC_KEY) {
  throw new Error('Missing Clerk publishable key. Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.');
}

createRoot(document.getElementById('root')).render(
    <ClerkProvider publishableKey={PUBLIC_KEY}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ClerkProvider>,
)


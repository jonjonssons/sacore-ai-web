import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

// Early: if this window is a Gmail OAuth popup redirected back with ?code=, send it to the opener and close before the app mounts
try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'gmail_oauth_code', code }, window.location.origin);
        window.close();
    }
} catch { }

createRoot(document.getElementById("root")!).render(
    <AuthProvider>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </AuthProvider>
);

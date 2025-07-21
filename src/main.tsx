import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

createRoot(document.getElementById("root")!).render(
    <AuthProvider>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </AuthProvider>
);

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import { useEffect } from 'react';

const App = () => {
  // useEffect를 여기에 추가
  useEffect(() => {
    if (
      window.location.hostname === 'stechpro.ai' &&
      !window.location.hostname.startsWith('www')
    ) {
      window.location.href =
        'https://www.stechpro.ai' +
        window.location.pathname +
        window.location.search;
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

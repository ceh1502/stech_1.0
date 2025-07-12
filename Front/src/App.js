import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import AppRouter from './routes/AppRouter';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

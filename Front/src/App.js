import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import { useEffect } from 'react';

const contactRoutes = require('./routes/contact');
app.use('/api', contactRoutes);

const App = () => {
  // useEffect를 여기에 추가

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

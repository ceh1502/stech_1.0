import { useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../../api/authAPI';
import { useEffect, useState } from 'react';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token, email);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };

    if (token && email) {
      verify();
    } else {
      setStatus('error');
    }
  }, [token, email]);

  return (
    <div className="verify-email-page">
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && <p>Email verification successful ✅</p>}
      {status === 'error' && <p>Verification failed or link expired ❌</p>}
    </div>
  );
};

export default VerifyEmailPage;

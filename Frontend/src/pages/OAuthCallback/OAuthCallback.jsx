import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    processOAuthCallback();
  }, []);

  const processOAuthCallback = async () => {
    try {
      const result = await handleOAuthCallback();

      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setStatus('error');
        setError(result.error || 'Authentication failed');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setStatus('error');
      setError('An unexpected error occurred');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="oauth-callback-page">
      <div className="oauth-callback-container">
        <div className="oauth-callback-content">
          {status === 'processing' && (
            <>
              <img src="/images/loader.gif" alt="Loading" className="oauth-loader-gif" />
              <h2>Completing authentication...</h2>
              <p>Please wait while we sign you in</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="oauth-success-icon">✓</div>
              <h2>Authentication successful!</h2>
              <p>Redirecting you to the app...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="oauth-error-icon">✕</div>
              <h2>Authentication failed</h2>
              <p>{error}</p>
              <p className="oauth-redirect-text">Redirecting to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;

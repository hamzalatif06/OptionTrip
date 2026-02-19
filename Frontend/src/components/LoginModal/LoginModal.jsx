import React, { useState } from 'react';
import './LoginModal.css';

const LoginModal = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '', remember: false });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    repassword: '', 
    acceptTerms: false 
  });

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', loginForm);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    console.log('Register:', registerForm);
  };

  return (
    <div className="modal fade log-reg" id="exampleModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-body">
            <div className="post-tabs">
              <ul className="nav nav-tabs nav-pills nav-fill" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                    onClick={() => setActiveTab('login')}
                    type="button"
                  >
                    Login
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                    type="button"
                  >
                    Register
                  </button>
                </li>
              </ul>
              
              <div className="tab-content blog-full">
                {activeTab === 'login' && (
                  <div className="tab-pane fade active show">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="blog-image rounded">
                          <a href="#" style={{backgroundImage: `url(/images/trending/trending5.jpg)`}}></a>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <h4 className="text-center border-b pb-2">Login</h4>
                        <div className="log-reg-button d-flex align-items-center justify-content-between">
                          <button type="button" className="btn btn-fb">
                            <i className="fab fa-facebook"></i> Login with Facebook
                          </button>
                          <button type="button" className="btn btn-google">
                            <i className="fab fa-google"></i> Login with Google
                          </button>
                        </div>
                        <hr className="log-reg-hr position-relative my-4 overflow-visible" />
                        <form onSubmit={handleLoginSubmit}>
                          <div className="form-group mb-2">
                            <input 
                              type="text" 
                              name="username" 
                              className="form-control" 
                              placeholder="User Name or Email Address"
                              value={loginForm.username}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2">
                            <input 
                              type="password" 
                              name="password" 
                              className="form-control" 
                              placeholder="Password"
                              value={loginForm.password}
                              onChange={handleLoginChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2">
                            <input 
                              type="checkbox" 
                              name="remember"
                              checked={loginForm.remember}
                              onChange={handleLoginChange}
                              className="custom-control-input" 
                            />
                            <label className="custom-control-label mb-0">Remember me</label>
                            <a className="float-end" href="#">Lost your password?</a>
                          </div>
                          <div className="comment-btn mb-2 pb-2 text-center border-b">
                            <input type="submit" className="nir-btn w-100" value="Login" />
                          </div>
                          <p className="text-center">Don't have an account? <a href="#" className="theme" onClick={() => setActiveTab('register')}>Register</a></p>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'register' && (
                  <div className="tab-pane fade active show">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="blog-image rounded">
                          <a href="#" style={{backgroundImage: `url(/images/trending/trending5.jpg)`}}></a>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <h4 className="text-center border-b pb-2">Register</h4>
                        <div className="log-reg-button d-flex align-items-center justify-content-between">
                          <button type="button" className="btn btn-fb">
                            <i className="fab fa-facebook"></i> Login with Facebook
                          </button>
                          <button type="button" className="btn btn-google">
                            <i className="fab fa-google"></i> Login with Google
                          </button>
                        </div>
                        <hr className="log-reg-hr position-relative my-4 overflow-visible" />
                        <form onSubmit={handleRegisterSubmit}>
                          <div className="form-group mb-2">
                            <input 
                              type="text" 
                              name="username" 
                              className="form-control" 
                              placeholder="User Name"
                              value={registerForm.username}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2">
                            <input 
                              type="email" 
                              name="email" 
                              className="form-control" 
                              placeholder="Email Address"
                              value={registerForm.email}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2">
                            <input 
                              type="password" 
                              name="password" 
                              className="form-control" 
                              placeholder="Password"
                              value={registerForm.password}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2">
                            <input 
                              type="password" 
                              name="repassword" 
                              className="form-control" 
                              placeholder="Re-enter Password"
                              value={registerForm.repassword}
                              onChange={handleRegisterChange}
                              required
                            />
                          </div>
                          <div className="form-group mb-2 d-flex">
                            <input 
                              type="checkbox" 
                              name="acceptTerms"
                              checked={registerForm.acceptTerms}
                              onChange={handleRegisterChange}
                              className="custom-control-input" 
                              required
                            />
                            <label className="custom-control-label mb-0 ms-1 lh-1">I have read and accept the Terms and Privacy Policy?</label>
                          </div>
                          <div className="comment-btn mb-2 pb-2 text-center border-b">
                            <input type="submit" className="nir-btn w-100" value="Register" />
                          </div>
                          <p className="text-center">Already have an account? <a href="#" className="theme" onClick={() => setActiveTab('login')}>Login</a></p>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;


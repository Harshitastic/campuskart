/* ==========================================================================
   CampusKart Auth View (Login & Register Form)
   ========================================================================== */

import { API } from '../api.js';
import { syncUserAuth } from '../app.js';
import { showToast } from '../utils.js';

const AuthView = {
  mode: 'login', // 'login' | 'register'
  redirectPath: '',

  /**
   * Render HTML structure
   */
  async render(request) {
    this.mode = request.queryParams.mode || 'login';
    this.redirectPath = request.queryParams.redirect || '';

    const isLogin = this.mode === 'login';

    return `
      <div class="container" style="max-width: 460px; margin-top: 50px;">
        <div class="checkout-block" style="box-shadow: var(--shadow-lg);">
          
          <!-- Tab toggle buttons -->
          <div style="display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 30px;">
            <button id="auth-tab-login" class="btn btn-text" style="flex: 1; padding: 12px; font-size: 16px; font-weight: 700; border-radius: 0; color: ${isLogin ? 'var(--accent-color)' : 'var(--text-tertiary)'}; border-bottom: 2px solid ${isLogin ? 'var(--accent-color)' : 'transparent'}; margin-bottom: -2px;">
              Login
            </button>
            <button id="auth-tab-register" class="btn btn-text" style="flex: 1; padding: 12px; font-size: 16px; font-weight: 700; border-radius: 0; color: ${!isLogin ? 'var(--accent-color)' : 'var(--text-tertiary)'}; border-bottom: 2px solid ${!isLogin ? 'var(--accent-color)' : 'transparent'}; margin-bottom: -2px;">
              Register
            </button>
          </div>

          <h2 style="font-size: 24px; text-align: center; margin-bottom: 20px;">
            ${isLogin ? 'Welcome Back!' : 'Join CampusKart'}
          </h2>

          <form id="auth-form" class="review-form-container">
            
            <!-- Registration-only field: Name -->
            <div class="form-group ${isLogin ? 'hidden' : ''}">
              <label>Full Name</label>
              <input type="text" id="auth-name" class="form-control" placeholder="Rahul Sharma" ${!isLogin ? 'required' : ''}>
            </div>

            <!-- Email (Common) -->
            <div class="form-group">
              <label>College Email Address</label>
              <input type="email" id="auth-email" class="form-control" placeholder="student@college.edu" required>
            </div>

            <!-- Password (Common) -->
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="auth-password" class="form-control" placeholder="••••••••" required>
            </div>

            <!-- Registration-only field: Confirm Password -->
            <div class="form-group ${isLogin ? 'hidden' : ''}">
              <label>Confirm Password</label>
              <input type="password" id="auth-confirm-password" class="form-control" placeholder="••••••••" ${!isLogin ? 'required' : ''}>
            </div>

            <button type="submit" id="auth-submit-btn" class="btn btn-primary btn-block">
              ${isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style="text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-secondary);">
            ${isLogin ? `New to CampusKart? <a href="#/auth?mode=register${this.redirectPath ? '&redirect=' + this.redirectPath : ''}" id="toggle-to-register">Register here</a>` : 
                       `Already have an account? <a href="#/auth?mode=login${this.redirectPath ? '&redirect=' + this.redirectPath : ''}" id="toggle-to-login">Login here</a>`}
          </p>

        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers
   */
  async afterRender() {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const form = document.getElementById('auth-form');

    const updateViewMode = (newMode) => {
      const queryStr = `?mode=${newMode}${this.redirectPath ? '&redirect=' + this.redirectPath : ''}`;
      window.history.pushState(null, '', `#/auth${queryStr}`);
      // Re-trigger router rendering for clean swap
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    };

    tabLogin.addEventListener('click', () => updateViewMode('login'));
    tabRegister.addEventListener('click', () => updateViewMode('register'));

    // Handle form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const submitBtn = document.getElementById('auth-submit-btn');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing request...';

      try {
        if (this.mode === 'login') {
          // Login Flow
          const res = await API.post('/auth/login', { email, password });
          if (res.success) {
            showToast(`Welcome back, ${res.user.name}!`, 'success');
            // Save local mock token for API header fallbacks if cookie restrictions occur
            localStorage.setItem('token', res.token);
            await syncUserAuth();
            
            // Redirect
            window.location.hash = this.redirectPath ? `#/${this.redirectPath}` : '#/';
          }
        } else {
          // Register Flow
          const name = document.getElementById('auth-name').value.trim();
          const confirmPassword = document.getElementById('auth-confirm-password').value;

          if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }

          const res = await API.post('/auth/register', { name, email, password, confirmPassword });
          if (res.success) {
            showToast('Registration successful! Welcome aboard.', 'success');
            localStorage.setItem('token', res.token);
            await syncUserAuth();
            
            // Redirect
            window.location.hash = this.redirectPath ? `#/${this.redirectPath}` : '#/';
          }
        }
      } catch (err) {
        showToast(err.message || 'Authentication request failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = this.mode === 'login' ? 'Sign In' : 'Create Account';
      }
    });
  }
};

export default AuthView;

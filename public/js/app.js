/* ==========================================================================
   CampusKart SPA Routing & Global State Store
   ========================================================================== */

import { API } from './api.js';
import { showToast, formatCurrency } from './utils.js';

// --------------------------------------------------------------------------
// 1. Global Application State
// --------------------------------------------------------------------------
export const state = {
  user: null,
  cart: [],
  wishlist: [],
  appliedCoupon: null,
  theme: 'light'
};

// --------------------------------------------------------------------------
// 2. Local Storage Cart Management
// --------------------------------------------------------------------------
export const cart = {
  load() {
    try {
      state.cart = JSON.parse(localStorage.getItem('cart')) || [];
      this.updateUI();
    } catch (e) {
      state.cart = [];
    }
  },

  save() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    this.updateUI();
  },

  add(product, quantity = 1) {
    const existingItem = state.cart.find(item => item.product === product._id);
    const itemQty = Number(quantity);

    if (existingItem) {
      if (existingItem.quantity + itemQty > product.stock) {
        showToast(`Cannot add more. Only ${product.stock} items left in stock.`, 'warning');
        return false;
      }
      existingItem.quantity += itemQty;
    } else {
      if (itemQty > product.stock) {
        showToast(`Cannot add. Only ${product.stock} items left in stock.`, 'warning');
        return false;
      }
      state.cart.push({
        product: product._id,
        name: product.name,
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: itemQty,
        image: product.images[0],
        stock: product.stock
      });
    }

    this.save();
    showToast(`Added "${product.name}" to cart!`, 'success');
    return true;
  },

  updateQuantity(productId, delta) {
    const item = state.cart.find(item => item.product === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      this.remove(productId);
    } else {
      if (newQty > item.stock) {
        showToast(`Only ${item.stock} items in stock.`, 'warning');
        return;
      }
      item.quantity = newQty;
      this.save();
    }
  },

  remove(productId) {
    state.cart = state.cart.filter(item => item.product !== productId);
    this.save();
    showToast('Item removed from cart.', 'info');
  },

  clear() {
    state.cart = [];
    state.appliedCoupon = null;
    this.save();
  },

  getTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    
    if (state.appliedCoupon) {
      if (state.appliedCoupon.discountType === 'percentage') {
        discount = Math.round(subtotal * (state.appliedCoupon.discountValue / 100));
      } else {
        discount = state.appliedCoupon.discountValue;
      }
      discount = Math.min(discount, subtotal);
    }

    const shippingCharges = (subtotal - discount) >= 499 || subtotal === 0 ? 0 : 40;
    const total = subtotal - discount + shippingCharges;

    return { subtotal, discount, shippingCharges, total };
  },

  updateUI() {
    const badge = document.getElementById('cart-badge-count');
    const itemsCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (badge) {
      badge.textContent = itemsCount;
      if (itemsCount > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    this.renderDrawer();
  },

  renderDrawer() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (state.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-cart-x"></i></div>
          <h4 class="empty-state-title">Your Cart is Empty</h4>
          <p class="empty-state-text">Add academic kits, stationery, or campus books to get started.</p>
        </div>
      `;
      document.getElementById('cart-checkout-btn').disabled = true;
    } else {
      let html = '';
      state.cart.forEach(item => {
        html += `
          <div class="cart-item-row" data-id="${item.product}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
              <div class="cart-item-title">${item.name}</div>
              <div class="cart-item-price">${formatCurrency(item.price)}</div>
              <div class="cart-item-qty-control">
                <button class="qty-btn dec-qty"><i class="bi bi-dash"></i></button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn inc-qty"><i class="bi bi-plus"></i></button>
              </div>
            </div>
            <button class="cart-item-remove-btn" title="Remove"><i class="bi bi-trash"></i></button>
          </div>
        `;
      });
      container.innerHTML = html;
      document.getElementById('cart-checkout-btn').disabled = false;
      
      // Attach listeners to cart controls inside the drawer
      container.querySelectorAll('.dec-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const row = e.target.closest('.cart-item-row');
          this.updateQuantity(row.dataset.id, -1);
        });
      });

      container.querySelectorAll('.inc-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const row = e.target.closest('.cart-item-row');
          this.updateQuantity(row.dataset.id, 1);
        });
      });

      container.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const row = e.target.closest('.cart-item-row');
          this.remove(row.dataset.id);
        });
      });
    }

    // Update Drawer Footer Summaries
    const { subtotal, discount, shippingCharges, total } = this.getTotals();
    document.getElementById('cart-summary-subtotal').textContent = formatCurrency(subtotal);
    
    const discountRow = document.getElementById('cart-summary-discount-row');
    if (state.appliedCoupon) {
      discountRow.classList.remove('hidden');
      document.getElementById('applied-coupon-code').textContent = state.appliedCoupon.code;
      document.getElementById('cart-summary-discount').textContent = `-${formatCurrency(discount)}`;
      document.getElementById('cart-coupon-input').value = state.appliedCoupon.code;
    } else {
      discountRow.classList.add('hidden');
      document.getElementById('cart-coupon-input').value = '';
    }

    document.getElementById('cart-summary-shipping').textContent = shippingCharges === 0 ? 'FREE' : formatCurrency(shippingCharges);
    document.getElementById('cart-summary-total').textContent = formatCurrency(total);
  }
};

// --------------------------------------------------------------------------
// 3. User Authentication State Synchronization
// --------------------------------------------------------------------------
export const syncUserAuth = async () => {
  try {
    const data = await API.get('/auth/me');
    if (data.success) {
      state.user = data.user;
      state.wishlist = data.user.wishlist || [];
    }
  } catch (error) {
    state.user = null;
    state.wishlist = [];
  }
  updateHeaderMenu();
};

const updateHeaderMenu = () => {
  const menu = document.getElementById('user-dropdown-menu');
  if (!menu) return;

  if (state.user) {
    menu.innerHTML = `
      <div class="dropdown-header">
        <div class="dropdown-name">${state.user.name}</div>
        <div class="dropdown-email">${state.user.email}</div>
      </div>
      <a href="#/profile" class="dropdown-item"><i class="bi bi-person"></i> My Profile</a>
      <a href="#/profile?tab=orders" class="dropdown-item"><i class="bi bi-bag"></i> My Orders</a>
      <a href="#/my-listings" class="dropdown-item"><i class="bi bi-journal-text"></i> My Listings</a>
      ${state.user.role === 'admin' ? `
        <div class="dropdown-divider"></div>
        <a href="#/admin" class="dropdown-item"><i class="bi bi-speedometer2"></i> Admin Dashboard</a>
      ` : ''}
      <div class="dropdown-divider"></div>
      <div id="logout-menu-btn" class="dropdown-item danger-link"><i class="bi bi-box-arrow-right"></i> Logout</div>
    `;

    document.getElementById('logout-menu-btn').addEventListener('click', async () => {
      try {
        await API.post('/auth/logout');
        state.user = null;
        state.wishlist = [];
        showToast('Logged out successfully', 'success');
        window.location.hash = '#/';
        await syncUserAuth();
      } catch (err) {
        showToast('Logout failed', 'error');
      }
    });
  } else {
    menu.innerHTML = `
      <a href="#/auth?mode=login" class="dropdown-item"><i class="bi bi-box-arrow-in-right"></i> Login</a>
      <a href="#/auth?mode=register" class="dropdown-item"><i class="bi bi-person-plus"></i> Register</a>
    `;
  }
};

// --------------------------------------------------------------------------
// 4. SPA Client Router Engine
// --------------------------------------------------------------------------
const routes = {
  '/': () => import('./views/HomeView.js'),
  '/shop': () => import('./views/ShopView.js'),
  '/product/:id': () => import('./views/ProductDetailsView.js'),
  '/listing/:id': () => import('./views/ListingDetailsView.js'),
  '/buy-sell': () => import('./views/BuySellView.js'),
  '/my-listings': () => import('./views/MyListingsView.js'),
  '/checkout': () => import('./views/CheckoutView.js'),
  '/order-success': () => import('./views/OrderSuccessView.js'),
  '/profile': () => import('./views/ProfileView.js'),
  '/auth': () => import('./views/AuthView.js'),
  '/admin': () => import('./views/AdminView.js'),
  '/about': () => {
    return {
      default: {
        render: () => `
          <div class="container" style="max-width: 800px; margin-top: 40px;">
            <h1 style="font-size: 36px; margin-bottom: 24px;">About CampusKart</h1>
            <p style="font-size: 16px; margin-bottom: 16px;">CampusKart is a premium full-stack digital solution for student-managed e-commerce and textbook exchanges built exclusively for colleges across India.</p>
            <p style="font-size: 16px; margin-bottom: 16px;">Our primary mission is to simplify back-to-school essentials purchases, such as scientific calculators, drawing drafters, registers, engineering kits, and college hoodies. Rather than searching across standard markets, we bring custom-approved bundles straight to hostel doorsteps.</p>
            <p style="font-size: 16px; margin-bottom: 16px;">Our dedicated <strong>Buy & Sell</strong> section enables students to list their used hostel furniture, cycles, or books for sale. We serve as a search directory. Interested students connect through direct, pre-filled emails to bargain, arrange campus pick-ups, and avoid middleman commission charges.</p>
          </div>
        `,
        afterRender: () => {}
      }
    };
  },
  '/contact': () => {
    return {
      default: {
        render: () => `
          <div class="container" style="max-width: 600px; margin-top: 40px;">
            <h1 style="font-size: 36px; margin-bottom: 16px;">Contact Us</h1>
            <p style="color: var(--text-secondary); margin-bottom: 30px;">Have questions about shipping or listing approvals? Write to us.</p>
            <form id="contact-form" class="checkout-block">
              <div class="form-group">
                <label>Your Name</label>
                <input type="text" class="form-control" placeholder="Rahul Sharma" required>
              </div>
              <div class="form-group">
                <label>College Email Address</label>
                <input type="email" class="form-control" placeholder="rahul@iitd.ac.in" required>
              </div>
              <div class="form-group">
                <label>Message Content</label>
                <textarea class="form-control" rows="5" placeholder="Query description..." required></textarea>
              </div>
              <button class="btn btn-primary btn-block" type="submit">Submit Feedback</button>
            </form>
          </div>
        `,
        afterRender: () => {
          document.getElementById('contact-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Feedback submitted! Our campus representatives will reach out shortly.', 'success');
            e.target.reset();
          });
        }
      }
    };
  }
};

/**
 * Route URL parsing
 */
const parseRequestURL = () => {
  const hash = window.location.hash.slice(1) || '/';
  const [url, queryStr] = hash.split('?');
  const r = url.split('/');
  
  const request = {
    resource: r[1] || '',
    id: r[2] || '',
    verb: r[3] || '',
    queryParams: {}
  };

  if (queryStr) {
    const params = new URLSearchParams(queryStr);
    for (const [key, value] of params.entries()) {
      request.queryParams[key] = value;
    }
  }

  return request;
};

/**
 * SPA client-side routing controller
 */
const router = async () => {
  const container = document.getElementById('app');
  if (!container) return;

  // Show page shimmer during lazy imports
  container.innerHTML = `
    <div class="full-screen-loader">
      <div class="loader-spinner"></div>
      <p class="loader-message">Connecting to campus store...</p>
    </div>
  `;

  const request = parseRequestURL();
  const parsedURL = (request.resource ? '/' + request.resource : '/') + 
                    (request.id ? '/:id' : '') + 
                    (request.verb ? '/' + request.verb : '');

  const loader = routes[parsedURL];

  // Update navigation link highlights
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#/${request.resource}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  if (!loader) {
    // Render beautiful 404
    container.innerHTML = `
      <div class="container empty-state" style="margin-top: 80px;">
        <div class="empty-state-icon"><i class="bi bi-emoji-frown"></i></div>
        <h1 class="empty-state-title" style="font-size: 32px;">404 Page Not Found</h1>
        <p class="empty-state-text">The page you are looking for has been moved or does not exist.</p>
        <a href="#/" class="btn btn-primary">Return to Homepage</a>
      </div>
    `;
    return;
  }

  try {
    const module = await loader();
    const view = module.default;
    
    // Inject rendered view template
    container.innerHTML = await view.render(request);
    
    // Attach event and input bindings
    if (view.afterRender) {
      await view.afterRender(request);
    }
  } catch (error) {
    console.error('Routing Error:', error);
    container.innerHTML = `
      <div class="container empty-state" style="margin-top: 80px;">
        <div class="empty-state-icon"><i class="bi bi-cloud-slash"></i></div>
        <h1 class="empty-state-title">Connection Interrupted</h1>
        <p class="empty-state-text">${error.message || 'Failed to communicate with CampusKart server. Ensure MongoDB is active.'}</p>
        <button onclick="window.location.reload()" class="btn btn-secondary">Retry Connection</button>
      </div>
    `;
  }
};

// --------------------------------------------------------------------------
// 5. Global Layout Controls & Event Listeners
// --------------------------------------------------------------------------
const setupLayoutListeners = () => {
  // Theme Toggle (Light / Dark)
  const themeBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('theme') || 'light';
  state.theme = storedTheme;
  
  if (storedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeBtn.querySelector('i').className = 'bi bi-sun';
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    state.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    themeBtn.querySelector('i').className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
    showToast(`Switched to ${state.theme} mode`, 'info');
  });

  // Slide Cart Drawer triggers
  const cartTrigger = document.getElementById('cart-trigger-btn');
  const cartOverlay = document.getElementById('cart-drawer-overlay');
  const cartClose = document.getElementById('cart-close-btn');
  const cartContinue = document.getElementById('cart-continue-btn');

  const toggleCart = () => {
    cartOverlay.classList.toggle('active');
    cart.renderDrawer();
  };

  cartTrigger.addEventListener('click', toggleCart);
  cartClose.addEventListener('click', toggleCart);
  cartContinue.addEventListener('click', toggleCart);
  
  // Close drawer on clicking outside the drawer pane
  cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) {
      cartOverlay.classList.remove('active');
    }
  });

  // User Dropdown toggle
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown-menu');

  userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
  });

  // Global search suggestions trigger
  const searchForm = document.getElementById('global-search-form');
  const searchInput = document.getElementById('global-search-input');
  const searchDropdown = document.getElementById('search-suggestions');

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchDropdown.classList.add('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const { products } = await API.get(`/products?search=${query}&limit=5`);
        if (products && products.length > 0) {
          let dropdownHtml = '';
          products.forEach(p => {
            const priceVal = p.discountPrice > 0 ? p.discountPrice : p.price;
            dropdownHtml += `
              <div class="suggestion-item" data-id="${p._id}">
                <img src="${p.images[0]}" alt="${p.name}" class="suggestion-img">
                <div class="suggestion-info">
                  <span class="suggestion-title">${p.name}</span>
                  <span class="suggestion-price">${formatCurrency(priceVal)}</span>
                </div>
              </div>
            `;
          });
          searchDropdown.innerHTML = dropdownHtml;
          searchDropdown.classList.remove('hidden');

          searchDropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
              window.location.hash = `#/product/${item.dataset.id}`;
              searchDropdown.classList.add('hidden');
              searchInput.value = '';
            });
          });
        } else {
          searchDropdown.classList.add('hidden');
        }
      } catch (err) {
        searchDropdown.classList.add('hidden');
      }
    }, 300);
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.hash = `#/shop?search=${encodeURIComponent(query)}`;
      searchInput.value = '';
      searchDropdown.classList.add('hidden');
    }
  });

  // Apply coupons trigger in cart drawer
  document.getElementById('apply-coupon-btn').addEventListener('click', async () => {
    const code = document.getElementById('cart-coupon-input').value.trim();
    const feedback = document.getElementById('coupon-feedback');
    const { subtotal } = cart.getTotals();

    if (!code) {
      feedback.textContent = 'Please enter a coupon code';
      feedback.className = 'coupon-feedback error';
      return;
    }

    try {
      const data = await API.get(`/coupons/validate/${code}?amount=${subtotal}`);
      if (data.success) {
        state.appliedCoupon = data.coupon;
        feedback.textContent = 'Coupon applied successfully!';
        feedback.className = 'coupon-feedback success';
        cart.save();
      }
    } catch (err) {
      state.appliedCoupon = null;
      feedback.textContent = err.message || 'Invalid coupon code';
      feedback.className = 'coupon-feedback error';
      cart.save();
    }
  });

  // Proceed to checkout button
  document.getElementById('cart-checkout-btn').addEventListener('click', () => {
    cartOverlay.classList.remove('active');
    if (!state.user) {
      showToast('Login required to complete checkout', 'warning');
      window.location.hash = '#/auth?mode=login&redirect=checkout';
    } else {
      window.location.hash = '#/checkout';
    }
  });
};

// --------------------------------------------------------------------------
// 6. Application Bootstrapper
// --------------------------------------------------------------------------
const init = async () => {
  cart.load();
  await syncUserAuth();
  setupLayoutListeners();
  
  // Listen for navigation hash shifts
  window.addEventListener('hashchange', router);
  window.addEventListener('load', router);
};

init();

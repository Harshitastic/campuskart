/* ==========================================================================
   CampusKart Profile, Saved Addresses & Order History View
   ========================================================================== */

import { API } from '../api.js';
import { state, syncUserAuth } from '../app.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

const ProfileView = {
  activeTab: 'profile', // 'profile' | 'addresses' | 'orders'
  orders: [],

  /**
   * Render HTML structure
   */
  async render(request) {
    if (!state.user) {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-lock"></i></div>
          <h2 class="empty-state-title">Login Required</h2>
          <p class="empty-state-text">Please log in to access your student profile panel.</p>
          <a href="#/auth?mode=login&redirect=profile" class="btn btn-primary">Login Now</a>
        </div>
      `;
    }

    // Capture tab query parameter
    this.activeTab = request.queryParams.tab || 'profile';

    return `
      <div class="container">
        <!-- Header -->
        <div style="margin-bottom: 30px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">
            <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp; Student Dashboard
          </span>
          <h1 style="font-size: 32px; margin-top: 4px;">My Campus Account</h1>
        </div>

        <div class="profile-layout">
          <!-- Left: Tab Navigation Buttons -->
          <aside class="profile-tabs">
            <button class="profile-tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
              <i class="bi bi-person-gear"></i> Account Settings
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'addresses' ? 'active' : ''}" data-tab="addresses">
              <i class="bi bi-geo-alt"></i> Saved Addresses
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
              <i class="bi bi-receipt"></i> Order History
            </button>
          </aside>

          <!-- Right: Content Display Card -->
          <section>
            <!-- Tab A: Profile Settings Form -->
            <div id="tab-profile-content" class="profile-card ${this.activeTab !== 'profile' ? 'hidden' : ''}">
              <h3 class="profile-card-title">Edit Profile</h3>
              <form id="profile-update-form" style="margin-bottom: 40px;">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" id="profile-form-name" class="form-control" value="${state.user.name}" required>
                </div>
                <div class="form-group">
                  <label>College Email Address</label>
                  <input type="email" id="profile-form-email" class="form-control" value="${state.user.email}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-sm">Save Profile Details</button>
              </form>

              <h3 class="profile-card-title">Change Password</h3>
              <form id="password-update-form">
                <div class="form-group">
                  <label>Current Password</label>
                  <input type="password" id="password-form-current" class="form-control" placeholder="••••••••" required>
                </div>
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" id="password-form-new" class="form-control" placeholder="Minimum 6 characters" required>
                </div>
                <button type="submit" class="btn btn-secondary btn-sm">Update Password</button>
              </form>
            </div>

            <!-- Tab B: Saved Addresses list -->
            <div id="tab-addresses-content" class="profile-card ${this.activeTab !== 'addresses' ? 'hidden' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0;">Manage Addresses</h3>
                <button id="add-profile-address-btn" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Add Address</button>
              </div>

              <div id="profile-addresses-grid" class="address-picker-grid">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Tab C: Order History tracker -->
            <div id="tab-orders-content" class="profile-card ${this.activeTab !== 'orders' ? 'hidden' : ''}">
              <h3 class="profile-card-title">Order History &amp; Status</h3>
              <div id="profile-orders-list" class="orders-history-list">
                <div class="skeleton" style="height: 120px; border-radius: 12px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="height: 120px; border-radius: 12px;"></div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Add/Edit Address Modal dialog (Reused from Checkout) -->
      <div id="profile-addr-modal" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="profile-addr-title">Add New Address</h3>
            <button id="profile-addr-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="profile-addr-form" class="review-form-container">
              <input type="hidden" id="profile-addr-id" value="">
              
              <div class="form-group">
                <label>Receiver Name</label>
                <input type="text" id="p-addr-name" class="form-control" placeholder="Rahul Sharma" required>
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="tel" id="p-addr-phone" class="form-control" placeholder="9988776655" required>
              </div>
              <div class="form-group">
                <label>Address Details (Hostel, Room, Block)</label>
                <input type="text" id="p-addr-address" class="form-control" placeholder="Room 104, Hostel C, IIT Delhi" required>
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" id="p-addr-city" class="form-control" placeholder="New Delhi" required>
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" id="p-addr-state" class="form-control" placeholder="Delhi" required>
              </div>
              <div class="form-group">
                <label>PIN Code</label>
                <input type="text" id="p-addr-pincode" class="form-control" placeholder="110016" required>
              </div>
              <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
                <input type="checkbox" id="p-addr-default" style="width: 16px; height: 16px;">
                <label for="p-addr-default" style="margin-bottom: 0; cursor: pointer;">Set as default address</label>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Save Address</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bind components
   */
  async afterRender() {
    if (!state.user) return;

    this.bindTabControls();
    this.bindProfileForms();
    this.renderAddressesGrid();
    this.fetchOrderHistory();

    // Bind Add Address Modal
    const modal = document.getElementById('profile-addr-modal');
    const closeBtn = document.getElementById('profile-addr-close');
    const addBtn = document.getElementById('add-profile-address-btn');
    const form = document.getElementById('profile-addr-form');

    addBtn.addEventListener('click', () => {
      document.getElementById('profile-addr-id').value = '';
      document.getElementById('profile-addr-title').textContent = 'Add New Address';
      form.reset();
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = document.getElementById('profile-addr-id').value;
        const name = document.getElementById('p-addr-name').value.trim();
        const phone = document.getElementById('p-addr-phone').value.trim();
        const address = document.getElementById('p-addr-address').value.trim();
        const city = document.getElementById('p-addr-city').value.trim();
        const stateVal = document.getElementById('p-addr-state').value.trim();
        const pinCode = document.getElementById('p-addr-pincode').value.trim();
        const isDefault = document.getElementById('p-addr-default').checked;

        const payload = { name, phone, address, city, state: stateVal, pinCode, isDefault };

        let res;
        if (id) {
          // Edit Mode
          res = await API.put(`/auth/addresses/${id}`, payload);
        } else {
          // Add Mode
          res = await API.post('/auth/addresses', payload);
        }

        if (res.success) {
          showToast('Address saved successfully!', 'success');
          modal.classList.add('hidden');
          await syncUserAuth();
          this.renderAddressesGrid();
        }
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
      }
    });
  },

  /**
   * Switch between tab views
   */
  bindTabControls() {
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        this.activeTab = tab;

        document.getElementById('tab-profile-content').classList.add('hidden');
        document.getElementById('tab-addresses-content').classList.add('hidden');
        document.getElementById('tab-orders-content').classList.add('hidden');

        document.getElementById(`tab-${tab}-content`).classList.remove('hidden');
        window.history.pushState(null, '', `#/profile?tab=${tab}`);
      });
    });
  },

  /**
   * Bind Edit settings forms
   */
  bindProfileForms() {
    // 1. Profile Update Form
    const profileForm = document.getElementById('profile-update-form');
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('profile-form-name').value.trim();
        const email = document.getElementById('profile-form-email').value.trim();

        const data = await API.put('/auth/profile', { name, email });
        if (data.success) {
          showToast('Profile settings saved!', 'success');
          await syncUserAuth();
        }
      } catch (err) {
        showToast(err.message || 'Profile save failed', 'error');
      }
    });

    // 2. Password Update Form
    const passwordForm = document.getElementById('password-update-form');
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const currentPassword = document.getElementById('password-form-current').value;
        const newPassword = document.getElementById('password-form-new').value;

        const data = await API.put('/auth/password', { currentPassword, newPassword });
        if (data.success) {
          showToast('Password updated successfully!', 'success');
          passwordForm.reset();
        }
      } catch (err) {
        showToast(err.message || 'Password update failed', 'error');
      }
    });
  },

  /**
   * Render addresses grids
   */
  renderAddressesGrid() {
    const container = document.getElementById('profile-addresses-grid');
    if (!container) return;

    if (!state.user.addresses || state.user.addresses.length === 0) {
      container.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 20px; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <p style="color: var(--text-secondary); font-size: 13px;">No shipping addresses saved on your profile.</p>
        </div>
      `;
      return;
    }

    let html = '';
    state.user.addresses.forEach(addr => {
      html += `
        <div class="address-picker-card" style="cursor: default;" data-id="${addr._id}">
          <div class="address-picker-name">${addr.name}</div>
          <div class="address-picker-text">${addr.address}, ${addr.city}, ${addr.state} - ${addr.pinCode}</div>
          <div class="address-picker-phone"><i class="bi bi-telephone"></i> ${addr.phone}</div>
          ${addr.isDefault ? '<span style="font-size: 9px; font-weight: 700; background-color: var(--accent-color); color: white; padding: 2px 6px; border-radius: 4px; position: absolute; top: 12px; right: 12px;">DEFAULT</span>' : ''}
          
          <div style="margin-top: 14px; display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 8px;">
            <button class="btn btn-outline btn-sm edit-addr-btn" style="padding: 4px 8px; font-size: 11px;">Edit</button>
            <button class="btn btn-text btn-sm delete-addr-btn" style="padding: 4px 8px; font-size: 11px; color: var(--danger-color);">Delete</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach CRUD listeners
    container.querySelectorAll('.address-picker-card').forEach(card => {
      const id = card.dataset.id;
      const addrObj = state.user.addresses.find(a => a._id === id);

      // Edit address
      card.querySelector('.edit-addr-btn').addEventListener('click', () => {
        document.getElementById('profile-addr-id').value = id;
        document.getElementById('profile-addr-title').textContent = 'Edit Address Details';

        document.getElementById('p-addr-name').value = addrObj.name;
        document.getElementById('p-addr-phone').value = addrObj.phone;
        document.getElementById('p-addr-address').value = addrObj.address;
        document.getElementById('p-addr-city').value = addrObj.city;
        document.getElementById('p-addr-state').value = addrObj.state;
        document.getElementById('p-addr-pincode').value = addrObj.pinCode;
        document.getElementById('p-addr-default').checked = addrObj.isDefault;

        document.getElementById('profile-addr-modal').classList.remove('hidden');
      });

      // Delete address
      card.querySelector('.delete-addr-btn').addEventListener('click', async () => {
        if (confirm('Delete this shipping address?')) {
          try {
            const res = await API.delete(`/auth/addresses/${id}`);
            if (res.success) {
              showToast('Address deleted successfully', 'info');
              await syncUserAuth();
              this.renderAddressesGrid();
            }
          } catch (err) {
            showToast(err.message || 'Failed to delete address', 'error');
          }
        }
      });
    });
  },

  /**
   * Fetch user purchases and render timeline tracking
   */
  async fetchOrderHistory() {
    const container = document.getElementById('profile-orders-list');
    if (!container) return;

    try {
      const data = await API.get('/orders/my-orders');
      if (!data.success) throw new Error('Could not load order history');

      this.orders = data.orders;

      if (this.orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="padding: 24px; border: 1px dashed var(--border-color); border-radius: 12px;">
            <div class="empty-state-icon"><i class="bi bi-bag-x"></i></div>
            <h4 class="empty-state-title">No Orders Found</h4>
            <p class="empty-state-text">You haven't purchased any items yet.</p>
            <a href="#/shop" class="btn btn-secondary btn-sm" style="margin-top: 10px;">Go Shop</a>
          </div>
        `;
        return;
      }

      let html = '';
      this.orders.forEach(order => {
        const isCancelled = order.orderStatus === 'Cancelled';
        
        // Define step index logic
        const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
        const currentIdx = statuses.indexOf(order.orderStatus);

        const renderTimelineStep = (stepName, idx, icon) => {
          let stepClass = '';
          if (isCancelled) {
            stepClass = '';
          } else if (currentIdx === idx) {
            stepClass = 'active';
          } else if (currentIdx > idx) {
            stepClass = 'completed';
          }
          
          return `
            <div class="timeline-step ${stepClass}">
              <div class="timeline-icon"><i class="bi ${icon}"></i></div>
              <span class="timeline-label">${stepName}</span>
            </div>
          `;
        };

        let itemsHtml = '';
        order.items.forEach(item => {
          itemsHtml += `
            <div class="checkout-item-mini" style="margin-bottom: 8px;">
              <img src="${item.image}" alt="${item.name}" style="width: 36px; height: 36px; border-radius: 4px;">
              <div class="checkout-item-mini-info">
                <div style="font-size: 13px; font-weight: 600;">${item.name}</div>
                <div style="font-size: 11px; color: var(--text-tertiary);">Qty: ${item.quantity} | ${formatCurrency(item.price)}</div>
              </div>
            </div>
          `;
        });

        html += `
          <div class="order-history-card">
            <div class="order-history-header">
              <div class="order-meta-col">
                <span class="order-meta-label">Order Date</span>
                <span class="order-meta-val">${formatDate(order.createdAt)}</span>
              </div>
              <div class="order-meta-col">
                <span class="order-meta-label">Total Amount</span>
                <span class="order-meta-val">${formatCurrency(order.grandTotal)}</span>
              </div>
              <div class="order-meta-col">
                <span class="order-meta-label">Payment Method</span>
                <span class="order-meta-val">${order.paymentMethod} (${order.paymentStatus})</span>
              </div>
              <div class="order-meta-col">
                <span class="order-meta-label">Invoice Code</span>
                <span class="order-meta-val" style="font-family: monospace; color: var(--accent-color);">${order.invoiceNumber}</span>
              </div>
            </div>
            
            <div class="order-history-body">
              <!-- Timeline status steps -->
              ${isCancelled ? `
                <div class="empty-state" style="padding: 12px; gap: 8px;">
                  <div style="font-size: 32px; color: var(--danger-color);"><i class="bi bi-x-circle"></i></div>
                  <h4 style="color: var(--danger-color); font-weight: 700; margin: 0;">Order Cancelled</h4>
                  <p style="font-size: 12px; color: var(--text-tertiary); max-width: 300px; margin: 0;">This purchase was rejected or cancelled by administrator.</p>
                </div>
              ` : `
                <div class="order-tracking-timeline">
                  ${renderTimelineStep('Confirmed', 1, 'bi-check-lg')}
                  ${renderTimelineStep('Packed', 2, 'bi-box-seam')}
                  ${renderTimelineStep('Shipped', 3, 'bi-truck')}
                  ${renderTimelineStep('Delivered', 5, 'bi-house-heart')}
                </div>
              `}

              <!-- Purchased items dropdown list -->
              <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
                <h5 style="font-weight: 700; font-size: 13px; margin-bottom: 10px; color: var(--text-secondary);">Ordered Items</h5>
                ${itemsHtml}
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">Failed to fetch order history list.</p>
        </div>
      `;
    }
  }
};

export default ProfileView;

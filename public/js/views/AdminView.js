/* ==========================================================================
   CampusKart Admin Control Center View
   ========================================================================== */

import { API } from '../api.js';
import { state } from '../app.js';
import { formatCurrency, formatDate, showToast, getTableSkeletonHTML } from '../utils.js';

const AdminView = {
  activeTab: 'dashboard', // 'dashboard'|'products'|'categories'|'listings'|'orders'|'coupons'|'users'
  analytics: null,
  products: [],
  categories: [],
  orders: [],
  listings: [],
  coupons: [],
  users: [],
  editingId: null,

  /**
   * Render HTML structure
   */
  async render(request) {
    if (!state.user || state.user.role !== 'admin') {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-shield-slash" style="color: var(--danger-color);"></i></div>
          <h2 class="empty-state-title">Access Denied</h2>
          <p class="empty-state-text">You must be logged in as an administrator to access this control center.</p>
          <a href="#/" class="btn btn-primary">Return to Homepage</a>
        </div>
      `;
    }

    this.activeTab = request.queryParams.tab || 'dashboard';

    return `
      <div class="container" style="max-width: 1300px;">
        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">Admin Panel &nbsp;/&nbsp; Management</span>
          <h1 style="font-size: 32px; margin-top: 4px;">CampusKart Control Center</h1>
        </div>

        <div class="profile-layout" style="grid-template-columns: 240px 1fr;">
          <!-- Left Sidebar Menu -->
          <aside class="profile-tabs">
            <button class="profile-tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
              <i class="bi bi-speedometer2"></i> Analytics Dashboard
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'products' ? 'active' : ''}" data-tab="products">
              <i class="bi bi-box-seam"></i> Manage Products
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'categories' ? 'active' : ''}" data-tab="categories">
              <i class="bi bi-tags"></i> Manage Categories
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
              <i class="bi bi-receipt-cutoff"></i> Manage Orders
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'listings' ? 'active' : ''}" data-tab="listings">
              <i class="bi bi-journal-text"></i> Student Listings
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'coupons' ? 'active' : ''}" data-tab="coupons">
              <i class="bi bi-percent"></i> Manage Coupons
            </button>
            <button class="profile-tab-btn ${this.activeTab === 'users' ? 'active' : ''}" data-tab="users">
              <i class="bi bi-people"></i> Manage Users
            </button>
          </aside>

          <!-- Right Content Panel -->
          <section>
            <!-- Loading Indicator -->
            <div id="admin-panel-loading" class="hidden">
              <div class="full-screen-loader" style="height: 40vh;">
                <div class="loader-spinner"></div>
                <p>Syncing panel data...</p>
              </div>
            </div>

            <!-- Content Zones -->
            <div id="admin-panel-content">
              <!-- Rendered dynamically depending on tab -->
            </div>
          </section>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div id="prod-modal" class="modal-overlay hidden">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header">
            <h3 id="prod-modal-title">Add E-Commerce Product</h3>
            <button id="prod-modal-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="prod-form" class="review-form-container">
              <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="p-form-name" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Brand</label>
                <input type="text" id="p-form-brand" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Category</label>
                <select id="p-form-cat" class="form-control" required>
                  <!-- Categories loaded dynamically -->
                </select>
              </div>
              <div class="form-group">
                <label>Price (Rs.)</label>
                <input type="number" id="p-form-price" class="form-control" min="0" required>
              </div>
              <div class="form-group">
                <label>Discount Price (Rs. - Optional)</label>
                <input type="number" id="p-form-discount" class="form-control" min="0" value="0">
              </div>
              <div class="form-group">
                <label>Available Inventory Stock</label>
                <input type="number" id="p-form-stock" class="form-control" min="0" required>
              </div>
              <div class="form-group">
                <label>Images (Select local files to upload)</label>
                <input type="file" id="p-form-files" class="form-control" multiple accept="image/*">
                <div id="prod-upload-spinner" class="hidden" style="margin-top: 8px; font-weight: 600; color: var(--accent-color);">
                  <i class="bi bi-arrow-repeat spin"></i> Uploading to server...
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="p-form-desc" class="form-control" rows="4" required></textarea>
              </div>

              <!-- Specifications List -->
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <label style="margin-bottom: 0;">Specifications</label>
                  <button type="button" id="add-spec-btn" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;">Add Spec</button>
                </div>
                <div id="p-form-specs-container" style="display: flex; flex-direction: column; gap: 8px;">
                  <!-- Dynamic rows of key-value -->
                </div>
              </div>

              <button type="submit" id="prod-submit-btn" class="btn btn-primary btn-block">Publish Product</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Add Category Modal -->
      <div id="cat-modal" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="cat-modal-title">Create Category</h3>
            <button id="cat-modal-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="cat-form" class="review-form-container">
              <div class="form-group">
                <label>Category Name</label>
                <input type="text" id="c-form-name" class="form-control" placeholder="e.g. Lab Coats" required>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="c-form-desc" class="form-control" rows="3" placeholder="Category detail summary..."></textarea>
              </div>
              <div class="form-group">
                <label>Category Image File</label>
                <input type="file" id="c-form-file" class="form-control" accept="image/*">
                <div id="cat-upload-spinner" class="hidden" style="margin-top: 8px; font-weight: 600; color: var(--accent-color);">
                  <i class="bi bi-arrow-repeat spin"></i> Uploading...
                </div>
              </div>
              <button type="submit" id="cat-submit-btn" class="btn btn-primary btn-block">Create Category</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Add/Edit Coupon Modal -->
      <div id="coupon-modal" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="coupon-modal-title">Add Coupon Code</h3>
            <button id="coupon-modal-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="coupon-form" class="review-form-container">
              <div class="form-group">
                <label>Coupon Code (Uppercase)</label>
                <input type="text" id="co-form-code" class="form-control" placeholder="e.g. SEMESTER50" required>
              </div>
              <div class="form-group">
                <label>Discount Type</label>
                <select id="co-form-type" class="form-control" required>
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="flat">Flat Cash Discount (Rs.)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Discount Value</label>
                <input type="number" id="co-form-value" class="form-control" min="0" required>
              </div>
              <div class="form-group">
                <label>Minimum Order Value (Rs.)</label>
                <input type="number" id="co-form-min" class="form-control" min="0" value="0">
              </div>
              <div class="form-group">
                <label>Expiry Date</label>
                <input type="date" id="co-form-expiry" class="form-control" required>
              </div>
              <button type="submit" id="coupon-submit-btn" class="btn btn-primary btn-block">Publish Coupon</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers
   */
  async afterRender() {
    if (!state.user || state.user.role !== 'admin') return;

    this.bindTabNavigation();
    this.loadTabContent();
    this.setupModals();
  },

  /**
   * Bind sidebar tabs
   */
  bindTabNavigation() {
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.activeTab = btn.dataset.tab;
        window.history.pushState(null, '', `#/admin?tab=${this.activeTab}`);
        this.loadTabContent();
      });
    });
  },

  /**
   * Setup form modal closers and specs managers
   */
  setupModals() {
    // Product Specs dynamic rows
    const specsContainer = document.getElementById('p-form-specs-container');
    const addSpecBtn = document.getElementById('add-spec-btn');

    const renderSpecRow = (name = '', val = '') => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.className = 'spec-row';
      
      row.innerHTML = `
        <input type="text" class="form-control spec-key" placeholder="Key (e.g. Pages)" value="${name}" required style="flex: 1; padding: 8px;">
        <input type="text" class="form-control spec-val" placeholder="Value (e.g. 500)" value="${val}" required style="flex: 1; padding: 8px;">
        <button type="button" class="btn btn-text delete-spec-row" style="color: var(--danger-color); padding: 0 8px;"><i class="bi bi-trash"></i></button>
      `;

      row.querySelector('.delete-spec-row').addEventListener('click', () => row.remove());
      specsContainer.appendChild(row);
    };

    addSpecBtn.addEventListener('click', () => renderSpecRow());
    this.renderSpecRow = renderSpecRow; // Export internally
  },

  /**
   * Load active tab API contents and render
   */
  async loadTabContent() {
    const container = document.getElementById('admin-panel-content');
    const loading = document.getElementById('admin-panel-loading');
    if (!container) return;

    container.innerHTML = '';
    loading.classList.remove('hidden');

    try {
      if (this.activeTab === 'dashboard') {
        await this.renderDashboardTab(container);
      } else if (this.activeTab === 'products') {
        await this.renderProductsTab(container);
      } else if (this.activeTab === 'categories') {
        await this.renderCategoriesTab(container);
      } else if (this.activeTab === 'orders') {
        await this.renderOrdersTab(container);
      } else if (this.activeTab === 'listings') {
        await this.renderListingsTab(container);
      } else if (this.activeTab === 'coupons') {
        await this.renderCouponsTab(container);
      } else if (this.activeTab === 'users') {
        await this.renderUsersTab(container);
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <h4 class="empty-state-title">Sync Error</h4>
          <p class="empty-state-text">${err.message || 'Failed to populate admin data.'}</p>
        </div>
      `;
    } finally {
      loading.classList.add('hidden');
    }
  },

  // --------------------------------------------------------------------------
  // Tab view renderers
  // --------------------------------------------------------------------------

  /**
   * Renders Admin Dashboard Analytics View
   */
  async renderDashboardTab(container) {
    const data = await API.get('/admin/dashboard');
    if (!data.success) throw new Error('Could not fetch analytics');
    
    this.analytics = data.analytics;
    const a = this.analytics;

    let lowStockHtml = '';
    if (a.lowStockProducts.length === 0) {
      lowStockHtml = '<tr><td colspan="3" style="text-align: center; color: var(--text-tertiary);">No low stock items detected. Good!</td></tr>';
    } else {
      a.lowStockProducts.forEach(p => {
        lowStockHtml += `
          <tr>
            <td style="font-weight: 600;">${p.name}</td>
            <td>${p.category?.name || 'Essentials'}</td>
            <td style="color: var(--danger-color); font-weight: 700;">${p.stock} units</td>
          </tr>
        `;
      });
    }

    let recentOrdersHtml = '';
    if (a.recentOrders.length === 0) {
      recentOrdersHtml = '<tr><td colspan="4" style="text-align: center; color: var(--text-tertiary);">No orders placed yet.</td></tr>';
    } else {
      a.recentOrders.forEach(o => {
        recentOrdersHtml += `
          <tr>
            <td style="font-family: monospace; font-weight: 600; color: var(--accent-color);">${o.invoiceNumber}</td>
            <td>${o.user?.name || 'Student'}</td>
            <td>${formatCurrency(o.grandTotal)}</td>
            <td>
              <span class="details-stock-badge ${o.orderStatus === 'Delivered' ? 'stock-instock' : o.orderStatus === 'Cancelled' ? 'stock-outstock' : 'stock-lowstock'}">
                ${o.orderStatus}
              </span>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <!-- Stats widgets -->
      <div class="admin-dashboard-stats">
        <div class="stat-widget">
          <div class="stat-icon stat-icon-revenue"><i class="bi bi-wallet2"></i></div>
          <div class="stat-details">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">${formatCurrency(a.totalRevenue)}</span>
          </div>
        </div>
        <div class="stat-widget">
          <div class="stat-icon stat-icon-orders"><i class="bi bi-cart-check"></i></div>
          <div class="stat-details">
            <span class="stat-label">Fulfillments</span>
            <span class="stat-value">${a.totalOrders} Orders</span>
          </div>
        </div>
        <div class="stat-widget">
          <div class="stat-icon stat-icon-products"><i class="bi bi-box-seam"></i></div>
          <div class="stat-details">
            <span class="stat-label">Shop Products</span>
            <span class="stat-value">${a.totalProducts} items</span>
          </div>
        </div>
        <div class="stat-widget">
          <div class="stat-icon stat-icon-users"><i class="bi bi-people"></i></div>
          <div class="stat-details">
            <span class="stat-label">Verified Students</span>
            <span class="stat-value">${a.totalUsers} registered</span>
          </div>
        </div>
      </div>

      <!-- Charts block (Telemetry grids) -->
      <div class="admin-charts-grid">
        <div class="chart-box">
          <h4 class="chart-box-title">Category Sales Share (Value)</h4>
          <canvas id="category-sales-chart" style="width: 100%; max-height: 250px;"></canvas>
        </div>
        <div class="chart-box">
          <h4 class="chart-box-title">Best Sellers Products (Volume)</h4>
          <canvas id="bestseller-chart" style="width: 100%; max-height: 250px;"></canvas>
        </div>
      </div>

      <!-- Low Stock and Recent Orders -->
      <div class="admin-charts-grid" style="margin-top: 24px;">
        <div class="chart-box" style="padding: 16px;">
          <h4 class="chart-box-title" style="margin-bottom: 12px; color: var(--danger-color);"><i class="bi bi-exclamation-triangle"></i> Inventory Alert (Stock < 10)</h4>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div class="chart-box" style="padding: 16px;">
          <h4 class="chart-box-title" style="margin-bottom: 12px;"><i class="bi bi-clock-history"></i> Recent Transactions</h4>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Student</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${recentOrdersHtml}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Render interactive graphs using Chart.js CDN (Check if canvas references exist)
    setTimeout(() => {
      const catCanvas = document.getElementById('category-sales-chart');
      const bsCanvas = document.getElementById('bestseller-chart');

      if (catCanvas && a.categorySales.length > 0) {
        new Chart(catCanvas, {
          type: 'doughnut',
          data: {
            labels: a.categorySales.map(c => c._id),
            datasets: [{
              data: a.categorySales.map(c => c.salesValue),
              backgroundColor: ['#4f46e5', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
              borderWidth: 1
            }]
          },
          options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
      }

      if (bsCanvas && a.bestSellers.length > 0) {
        new Chart(bsCanvas, {
          type: 'bar',
          data: {
            labels: a.bestSellers.map(b => b.name.slice(0, 15) + '...'),
            datasets: [{
              label: 'Units Sold',
              data: a.bestSellers.map(b => b.totalQty),
              backgroundColor: '#4f46e5',
              borderRadius: 6
            }]
          },
          options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
      }
    }, 100);
  },

  /**
   * Renders Products CRUD Management
   */
  async renderProductsTab(container) {
    const data = await API.get('/products?limit=50');
    if (!data.success) throw new Error('Could not fetch products');

    this.products = data.products;

    let rowsHtml = '';
    this.products.forEach(p => {
      rowsHtml += `
        <tr data-id="${p._id}">
          <td><img src="${p.images[0]}" alt="${p.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
          <td style="font-weight: 600;">${p.name}</td>
          <td>${p.brand}</td>
          <td>${p.category?.name || 'N/A'}</td>
          <td>${formatCurrency(p.price)}</td>
          <td>${p.stock}</td>
          <td>
            <div class="admin-action-btn-group">
              <button class="btn btn-outline btn-sm edit-prod-btn" style="padding: 4px 8px; font-size: 11px;"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-text btn-sm delete-prod-btn" style="padding: 4px 8px; font-size: 11px; color: var(--danger-color);"><i class="bi bi-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <h3 style="font-size: 18px; font-weight: 700;">Catalog Inventory</h3>
        <button id="add-prod-modal-btn" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Add New Product</button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">No products in catalog.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    // Bind triggers
    const modal = document.getElementById('prod-modal');
    document.getElementById('add-prod-modal-btn').addEventListener('click', async () => {
      this.editingId = null;
      document.getElementById('prod-modal-title').textContent = 'Add Catalog Product';
      document.getElementById('prod-submit-btn').textContent = 'Publish Product';
      document.getElementById('prod-form').reset();
      document.getElementById('p-form-specs-container').innerHTML = '';
      
      // Load Categories list
      await this.populateCategoryDropdown();
      modal.classList.remove('hidden');
    });

    document.getElementById('prod-modal-close').addEventListener('click', () => modal.classList.add('hidden'));

    // Bind edit/delete triggers on rows
    container.querySelectorAll('tbody tr').forEach(row => {
      const id = row.dataset.id;
      const prod = this.products.find(p => p._id === id);

      row.querySelector('.edit-prod-btn').addEventListener('click', async () => {
        this.editingId = id;
        document.getElementById('prod-modal-title').textContent = 'Edit Catalog Product';
        document.getElementById('prod-submit-btn').textContent = 'Save Changes';
        document.getElementById('prod-form').reset();
        document.getElementById('p-form-specs-container').innerHTML = '';

        await this.populateCategoryDropdown(prod.category?._id);

        document.getElementById('p-form-name').value = prod.name;
        document.getElementById('p-form-brand').value = prod.brand;
        document.getElementById('p-form-price').value = prod.price;
        document.getElementById('p-form-discount').value = prod.discountPrice;
        document.getElementById('p-form-stock').value = prod.stock;
        document.getElementById('p-form-desc').value = prod.description;

        // Render specs rows
        if (prod.specifications) {
          prod.specifications.forEach(spec => this.renderSpecRow(spec.name, spec.value));
        }

        modal.classList.remove('hidden');
      });

      row.querySelector('.delete-prod-btn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete "${prod.name}" from e-commerce catalog?`)) {
          try {
            await API.delete(`/products/${id}`);
            showToast('Product deleted successfully', 'info');
            this.loadTabContent();
          } catch (err) {
            showToast(err.message || 'Deletion failed', 'error');
          }
        }
      });
    });

    // Bind Product Upsert form submission
    const form = document.getElementById('prod-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('prod-submit-btn');
      submitBtn.disabled = true;

      try {
        const name = document.getElementById('p-form-name').value.trim();
        const brand = document.getElementById('p-form-brand').value.trim();
        const category = document.getElementById('p-form-cat').value;
        const price = Number(document.getElementById('p-form-price').value);
        const discountPrice = Number(document.getElementById('p-form-discount').value);
        const stock = Number(document.getElementById('p-form-stock').value);
        const description = document.getElementById('p-form-desc').value.trim();
        const filesInput = document.getElementById('p-form-files');
        const spinner = document.getElementById('prod-upload-spinner');

        // Compile specifications
        const specifications = [];
        document.querySelectorAll('.spec-row').forEach(row => {
          const key = row.querySelector('.spec-key').value.trim();
          const val = row.querySelector('.spec-val').value.trim();
          if (key && val) specifications.push({ name: key, value: val });
        });

        let imageUrls = [];
        if (filesInput.files && filesInput.files.length > 0) {
          spinner.classList.remove('hidden');
          const uploadRes = await API.uploadMultiple(filesInput.files);
          imageUrls = uploadRes.urls;
          spinner.classList.add('hidden');
        }

        const payload = { name, brand, category, price, discountPrice, stock, description, specifications };
        if (imageUrls.length > 0) {
          payload.images = imageUrls;
        } else if (!this.editingId) {
          payload.images = ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop'];
        }

        let res;
        if (this.editingId) {
          res = await API.put(`/products/${this.editingId}`, payload);
        } else {
          res = await API.post('/products', payload);
        }

        if (res.success) {
          showToast('Product saved successfully!', 'success');
          modal.classList.add('hidden');
          this.loadTabContent();
        }
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
        document.getElementById('prod-upload-spinner').classList.add('hidden');
      } finally {
        submitBtn.disabled = false;
      }
    };
  },

  async populateCategoryDropdown(selectedId = '') {
    const data = await API.get('/categories');
    const select = document.getElementById('p-form-cat');
    if (!select || !data.success) return;

    let html = '';
    data.categories.forEach(c => {
      html += `<option value="${c._id}" ${selectedId === c._id ? 'selected' : ''}>${c.name}</option>`;
    });
    select.innerHTML = html;
  },

  /**
   * Renders Categories management view
   */
  async renderCategoriesTab(container) {
    const data = await API.get('/categories');
    if (!data.success) throw new Error('Could not load categories');

    this.categories = data.categories;

    let rowsHtml = '';
    this.categories.forEach(c => {
      rowsHtml += `
        <tr data-id="${c._id}">
          <td><img src="${c.image}" alt="${c.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"></td>
          <td style="font-weight: 600;">${c.name}</td>
          <td>${c.slug}</td>
          <td>${c.description || 'N/A'}</td>
          <td>
            <button class="btn btn-text btn-sm delete-cat-btn" style="color: var(--danger-color); padding: 4px 8px;"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <h3 style="font-size: 18px; font-weight: 700;">Categories Directory</h3>
        <button id="add-cat-modal-btn" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Create Category</button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align: center;">No categories available.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const modal = document.getElementById('cat-modal');
    document.getElementById('add-cat-modal-btn').addEventListener('click', () => {
      document.getElementById('cat-form').reset();
      modal.classList.remove('hidden');
    });

    document.getElementById('cat-modal-close').addEventListener('click', () => modal.classList.add('hidden'));

    // Bind deletes
    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        if (confirm('Delete this category? Associated products may be affected.')) {
          try {
            await API.delete(`/categories/${id}`);
            showToast('Category deleted', 'info');
            this.loadTabContent();
          } catch (err) {
            showToast(err.message || 'Deletion failed', 'error');
          }
        }
      });
    });

    // Form submit
    const form = document.getElementById('cat-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('cat-submit-btn');
      submitBtn.disabled = true;

      try {
        const name = document.getElementById('c-form-name').value.trim();
        const description = document.getElementById('c-form-desc').value.trim();
        const fileInput = document.getElementById('c-form-file');
        const spinner = document.getElementById('cat-upload-spinner');

        let imageUrl = 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop';
        if (fileInput.files && fileInput.files.length > 0) {
          spinner.classList.remove('hidden');
          const uploadRes = await API.uploadSingle(fileInput.files[0]);
          imageUrl = uploadRes.url;
          spinner.classList.add('hidden');
        }

        const res = await API.post('/categories', { name, description, image: imageUrl });
        if (res.success) {
          showToast('Category created!', 'success');
          modal.classList.add('hidden');
          this.loadTabContent();
        }
      } catch (err) {
        showToast(err.message || 'Category creation failed', 'error');
        document.getElementById('cat-upload-spinner').classList.add('hidden');
      } finally {
        submitBtn.disabled = false;
      }
    };
  },

  /**
   * Renders Admin Orders dispatch updating panel
   */
  async renderOrdersTab(container) {
    const data = await API.get('/orders');
    if (!data.success) throw new Error('Could not load orders');

    this.orders = data.orders;

    let rowsHtml = '';
    this.orders.forEach(o => {
      rowsHtml += `
        <tr data-id="${o._id}">
          <td style="font-family: monospace; font-weight: 600; color: var(--accent-color);">${o.invoiceNumber}</td>
          <td>${o.user?.name || 'Student'}</td>
          <td>${formatDate(o.createdAt)}</td>
          <td>${formatCurrency(o.grandTotal)}</td>
          <td>${o.paymentMethod} (${o.paymentStatus})</td>
          <td>
            <select class="form-control order-status-select" style="padding: 6px 12px; font-size: 12px; font-weight: 600; width: 140px;">
              <option value="Pending" ${o.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Packed" ${o.orderStatus === 'Packed' ? 'selected' : ''}>Packed</option>
              <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Out for Delivery" ${o.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
              <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 18px;">Student Purchases Dispatch Tracker</h3>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student</th>
              <th>Date</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align: center;">No orders logged yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    // Bind dropdown change triggers
    container.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        const newStatus = e.target.value;
        try {
          const res = await API.put(`/orders/${id}/status`, { orderStatus: newStatus });
          if (res.success) {
            showToast(`Order status updated to "${newStatus}"`, 'success');
            this.loadTabContent();
          }
        } catch (err) {
          showToast(err.message || 'Status update failed', 'error');
        }
      });
    });
  },

  /**
   * Renders Student listings control dashboard (Remove spam)
   */
  async renderListingsTab(container) {
    const data = await API.get('/listings/admin/all');
    if (!data.success) throw new Error('Could not load listings');

    this.listings = data.listings;

    let rowsHtml = '';
    this.listings.forEach(l => {
      const isFlagged = l.reports && l.reports.length > 0;
      rowsHtml += `
        <tr data-id="${l._id}">
          <td><img src="${l.images[0]}" alt="${l.title}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
          <td style="font-weight: 600;">${l.title}</td>
          <td>${l.seller?.name || 'Student'}</td>
          <td>${l.college}</td>
          <td>${formatCurrency(l.expectedPrice)}</td>
          <td>
            ${isFlagged ? `<span style="font-size: 11px; font-weight: 700; color: var(--danger-color); background-color: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 4px;"><i class="bi bi-flag"></i> ${l.reports.length} Flag(s)</span>` : 
                          `<span style="color: var(--text-tertiary);">Clean</span>`}
          </td>
          <td>
            <button class="btn btn-outline btn-sm delete-listing-btn" style="color: var(--danger-color); padding: 4px 8px;"><i class="bi bi-shield-x"></i> Remove Spam</button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 18px;">Student Exchange Classifieds Panel</h3>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Listing</th>
              <th>Seller</th>
              <th>Campus</th>
              <th>Price</th>
              <th>Flags Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">No student listings posted.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    // Bind remove spam trigger
    container.querySelectorAll('.delete-listing-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        const listing = this.listings.find(x => x._id === id);
        if (confirm(`Remove listing "${listing.title}" as spam/inappropriate?`)) {
          try {
            await API.delete(`/listings/${id}`);
            showToast('Listing removed successfully', 'info');
            this.loadTabContent();
          } catch (err) {
            showToast(err.message || 'Purge failed', 'error');
          }
        }
      });
    });
  },

  /**
   * Renders Coupons CRUD Management view
   */
  async renderCouponsTab(container) {
    const data = await API.get('/coupons');
    if (!data.success) throw new Error('Could not load coupons');

    this.coupons = data.coupons;

    let rowsHtml = '';
    this.coupons.forEach(c => {
      rowsHtml += `
        <tr data-id="${c._id}">
          <td style="font-weight: 700; color: var(--accent-color); font-family: monospace;">${c.code}</td>
          <td>${c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</td>
          <td>Min order: ${formatCurrency(c.minOrderValue)}</td>
          <td>${formatDate(c.expiryDate)}</td>
          <td>
            <span class="details-stock-badge ${c.active && new Date(c.expiryDate) > new Date() ? 'stock-instock' : 'stock-outstock'}">
              ${c.active && new Date(c.expiryDate) > new Date() ? 'Active' : 'Expired/Inactive'}
            </span>
          </td>
          <td>
            <button class="btn btn-text btn-sm delete-coupon-btn" style="color: var(--danger-color); padding: 4px 8px;"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <h3 style="font-size: 18px; font-weight: 700;">Promotional Coupons compiler</h3>
        <button id="add-coupon-modal-btn" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg"></i> Create Coupon</button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Value</th>
              <th>Conditions</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align: center;">No coupons compiler active.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    const modal = document.getElementById('coupon-modal');
    document.getElementById('add-coupon-modal-btn').addEventListener('click', () => {
      document.getElementById('coupon-form').reset();
      modal.classList.remove('hidden');
    });

    document.getElementById('coupon-modal-close').addEventListener('click', () => modal.classList.add('hidden'));

    // Bind deletes
    container.querySelectorAll('.delete-coupon-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        if (confirm('Delete this coupon code permanently?')) {
          try {
            await API.delete(`/coupons/${id}`);
            showToast('Coupon code deleted', 'info');
            this.loadTabContent();
          } catch (err) {
            showToast(err.message || 'Deletion failed', 'error');
          }
        }
      });
    });

    // Form submit
    const form = document.getElementById('coupon-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('coupon-submit-btn');
      submitBtn.disabled = true;

      try {
        const code = document.getElementById('co-form-code').value.trim();
        const discountType = document.getElementById('co-form-type').value;
        const discountValue = Number(document.getElementById('co-form-value').value);
        const minOrderValue = Number(document.getElementById('co-form-min').value);
        const expiryDate = document.getElementById('co-form-expiry').value;

        const res = await API.post('/coupons', { code, discountType, discountValue, minOrderValue, expiryDate });
        if (res.success) {
          showToast('Coupon code created!', 'success');
          modal.classList.add('hidden');
          this.loadTabContent();
        }
      } catch (err) {
        showToast(err.message || 'Coupon creation failed', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    };
  },

  /**
   * Renders User accounts list (Block / Unblock)
   */
  async renderUsersTab(container) {
    const data = await API.get('/auth/users');
    if (!data.success) throw new Error('Could not load users list');

    this.users = data.users;

    let rowsHtml = '';
    this.users.forEach(u => {
      rowsHtml += `
        <tr data-id="${u._id}">
          <td style="font-weight: 600;">${u.name}</td>
          <td>${u.email}</td>
          <td>${u.role.toUpperCase()}</td>
          <td>${formatDate(u.createdAt)}</td>
          <td>
            <span class="details-stock-badge ${u.isBlocked ? 'stock-outstock' : 'stock-instock'}">
              ${u.isBlocked ? 'Suspended' : 'Active'}
            </span>
          </td>
          <td>
            ${u.role !== 'admin' ? `
              <button class="btn btn-outline btn-sm block-user-btn" style="padding: 4px 8px; font-size: 11px;">
                ${u.isBlocked ? '<i class="bi bi-unlock"></i> Unblock' : '<i class="bi bi-shield-slash"></i> Block Account'}
              </button>
            ` : '<span style="color: var(--text-tertiary); font-size: 12px;">Admin Protected</span>'}
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 18px;">Student Registry Accounts</h3>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    // Bind block toggles
    container.querySelectorAll('.block-user-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('tr').dataset.id;
        const user = this.users.find(x => x._id === id);
        const actionText = user.isBlocked ? 'unblock' : 'suspend';
        if (confirm(`Are you sure you want to ${actionText} the student account for "${user.name}"?`)) {
          try {
            const res = await API.put(`/auth/users/${id}/block`);
            if (res.success) {
              showToast(res.message, 'success');
              this.loadTabContent();
            }
          } catch (err) {
            showToast(err.message || 'Block action failed', 'error');
          }
        }
      });
    });
  }
};

export default AdminView;

/* ==========================================================================
   CampusKart Buy & Sell Directory View
   ========================================================================== */

import { API } from '../api.js';
import { formatCurrency, formatDate } from '../utils.js';

const BuySellView = {
  activeFilters: {
    search: '',
    category: '',
    college: '',
    condition: '',
    minPrice: '',
    maxPrice: ''
  },

  /**
   * Render HTML skeleton structure
   */
  async render(request) {
    // Read parameters from URL query context
    this.activeFilters.search = request.queryParams.search || '';
    this.activeFilters.category = request.queryParams.category || '';
    this.activeFilters.college = request.queryParams.college || '';
    this.activeFilters.condition = request.queryParams.condition || '';
    this.activeFilters.minPrice = request.queryParams.minPrice || '';
    this.activeFilters.maxPrice = request.queryParams.maxPrice || '';

    return `
      <div class="container" style="padding-top: 24px;">
        <!-- Breadcrumb / Header Title -->
        <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 13px; color: var(--text-tertiary);">
              <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp; Buy &amp; Sell Listings
            </span>
            <h1 style="font-size: 32px; margin-top: 4px;">Student Exchange Board</h1>
          </div>
          <a href="#/my-listings" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Create New Listing
          </a>
        </div>

        <div class="buysell-layout">
          <!-- Filter Sidebar -->
          <aside class="filters-sidebar">
            <!-- Keyword search -->
            <div>
              <h4 class="filter-widget-title">Keyword Search</h4>
              <div class="form-group" style="margin-bottom: 0;">
                <input type="text" id="listings-search" class="form-control" placeholder="Search textbooks, chairs..." value="${this.activeFilters.search}">
              </div>
            </div>

            <!-- College Name Filter -->
            <div>
              <h4 class="filter-widget-title">Filter by College</h4>
              <div class="form-group" style="margin-bottom: 0;">
                <input type="text" id="listings-college" class="form-control" placeholder="e.g. IIT Delhi" value="${this.activeFilters.college}">
              </div>
            </div>

            <!-- Condition selection -->
            <div>
              <h4 class="filter-widget-title">Item Condition</h4>
              <select id="listings-condition" class="form-control">
                <option value="" ${!this.activeFilters.condition ? 'selected' : ''}>Any Condition</option>
                <option value="New" ${this.activeFilters.condition === 'New' ? 'selected' : ''}>New</option>
                <option value="Like New" ${this.activeFilters.condition === 'Like New' ? 'selected' : ''}>Like New</option>
                <option value="Good" ${this.activeFilters.condition === 'Good' ? 'selected' : ''}>Good</option>
                <option value="Fair" ${this.activeFilters.condition === 'Fair' ? 'selected' : ''}>Fair</option>
              </select>
            </div>

            <!-- Categories Checklist -->
            <div>
              <h4 class="filter-widget-title">Category</h4>
              <div id="listings-categories-group" class="filter-list">
                <!-- Checkbox list of standard used goods -->
              </div>
            </div>

            <!-- Price Expected -->
            <div>
              <h4 class="filter-widget-title">Price Filter</h4>
              <div class="price-range-inputs">
                <input type="number" id="listings-min-price" class="form-control" placeholder="Min" value="${this.activeFilters.minPrice}">
                <span style="color: var(--text-tertiary);">to</span>
                <input type="number" id="listings-max-price" class="form-control" placeholder="Max" value="${this.activeFilters.maxPrice}">
              </div>
              <button id="apply-listings-price-btn" class="btn btn-secondary btn-sm btn-block" style="margin-top: 12px;">Apply Price</button>
            </div>

            <!-- Reset -->
            <button id="reset-listings-btn" class="btn btn-outline btn-block"><i class="bi bi-trash"></i> Reset Filters</button>
          </aside>

          <!-- Listings Results Grid -->
          <section>
            <div class="shop-content-header">
              <span id="listings-count-info" class="shop-results-count">Loading listings...</span>
              <div class="filter-item">
                <input type="checkbox" id="show-sold-listings-chk">
                <label for="show-sold-listings-chk" style="font-size: 13px; font-weight: 600; cursor: pointer;">Show Sold Items</label>
              </div>
            </div>

            <div id="listings-grid-container" class="products-grid">
              <!-- Dynamically Populated listing cards -->
            </div>
          </section>
        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers
   */
  async afterRender() {
    this.renderCategoriesList();
    this.fetchListings();

    // Bind search debounce
    const searchInput = document.getElementById('listings-search');
    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.activeFilters.search = e.target.value.trim();
        this.updateURL();
        this.fetchListings();
      }, 400);
    });

    // Bind college debounce
    const collegeInput = document.getElementById('listings-college');
    let collegeDebounce;
    collegeInput.addEventListener('input', (e) => {
      clearTimeout(collegeDebounce);
      collegeDebounce = setTimeout(() => {
        this.activeFilters.college = e.target.value.trim();
        this.updateURL();
        this.fetchListings();
      }, 400);
    });

    // Bind condition dropdown
    const conditionSelect = document.getElementById('listings-condition');
    conditionSelect.addEventListener('change', (e) => {
      this.activeFilters.condition = e.target.value;
      this.updateURL();
      this.fetchListings();
    });

    // Bind price bounds
    const applyPriceBtn = document.getElementById('apply-listings-price-btn');
    applyPriceBtn.addEventListener('click', () => {
      this.activeFilters.minPrice = document.getElementById('listings-min-price').value.trim();
      this.activeFilters.maxPrice = document.getElementById('listings-max-price').value.trim();
      this.updateURL();
      this.fetchListings();
    });

    // Show sold items checkbox
    const soldChk = document.getElementById('show-sold-listings-chk');
    soldChk.addEventListener('change', () => {
      this.fetchListings();
    });

    // Reset filters button
    document.getElementById('reset-listings-btn').addEventListener('click', () => {
      this.activeFilters = {
        search: '',
        category: '',
        college: '',
        condition: '',
        minPrice: '',
        maxPrice: ''
      };
      
      document.getElementById('listings-search').value = '';
      document.getElementById('listings-college').value = '';
      document.getElementById('listings-condition').value = '';
      document.getElementById('listings-min-price').value = '';
      document.getElementById('listings-max-price').value = '';
      soldChk.checked = false;

      document.querySelectorAll('.cat-radio').forEach(r => r.checked = false);
      const allR = document.getElementById('cat-list-all');
      if (allR) allR.checked = true;

      this.updateURL();
      this.fetchListings();
    });
  },

  /**
   * Render checkboxes list for used listings categories
   */
  renderCategoriesList() {
    const group = document.getElementById('listings-categories-group');
    if (!group) return;

    const list = [
      'Used Books', 'Calculators', 'Engineering Kits', 'Laptop Accessories',
      'Study Tables', 'Chairs', 'Cycles', 'Monitors', 'Keyboards',
      'Hostel Furniture', 'College Merchandise', 'Backpacks'
    ];

    let html = `
      <label class="filter-item">
        <input type="radio" name="listings-cat" id="cat-list-all" value="" ${!this.activeFilters.category ? 'checked' : ''} class="cat-radio">
        <span>All Items</span>
      </label>
    `;

    list.forEach(item => {
      const isChecked = this.activeFilters.category === item;
      html += `
        <label class="filter-item">
          <input type="radio" name="listings-cat" value="${item}" ${isChecked ? 'checked' : ''} class="cat-radio">
          <span>${item}</span>
        </label>
      `;
    });

    group.innerHTML = html;

    group.querySelectorAll('.cat-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.activeFilters.category = e.target.value;
        this.updateURL();
        this.fetchListings();
      });
    });
  },

  /**
   * Sync active filters to browser url context
   */
  updateURL() {
    const params = new URLSearchParams();
    if (this.activeFilters.search) params.set('search', this.activeFilters.search);
    if (this.activeFilters.category) params.set('category', this.activeFilters.category);
    if (this.activeFilters.college) params.set('college', this.activeFilters.college);
    if (this.activeFilters.condition) params.set('condition', this.activeFilters.condition);
    if (this.activeFilters.minPrice) params.set('minPrice', this.activeFilters.minPrice);
    if (this.activeFilters.maxPrice) params.set('maxPrice', this.activeFilters.maxPrice);

    const queryStr = params.toString();
    window.history.pushState(null, '', `#/buy-sell${queryStr ? '?' + queryStr : ''}`);
  },

  /**
   * Fetch active Listings and render grid
   */
  async fetchListings() {
    const grid = document.getElementById('listings-grid-container');
    const info = document.getElementById('listings-count-info');
    if (!grid) return;

    grid.innerHTML = `
      <div class="skeleton-card"><div class="skeleton-card-img skeleton"></div></div>
      <div class="skeleton-card"><div class="skeleton-card-img skeleton"></div></div>
      <div class="skeleton-card"><div class="skeleton-card-img skeleton"></div></div>
    `;

    try {
      const { search, category, college, condition, minPrice, maxPrice } = this.activeFilters;
      const includeSold = document.getElementById('show-sold-listings-chk').checked;

      let url = `/listings?includeSold=${includeSold}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (college) url += `&college=${encodeURIComponent(college)}`;
      if (condition) url += `&condition=${condition}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;

      const data = await API.get(url);
      if (!data.success) throw new Error('Failed to load listings');

      info.textContent = `Showing ${data.listings.length} campus listing(s)`;

      if (data.listings.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: span 3;">
            <div class="empty-state-icon"><i class="bi bi-tag-fill"></i></div>
            <h4 class="empty-state-title">No Peer Listings Found</h4>
            <p class="empty-state-text">No active campus used-goods match your filter bounds.</p>
          </div>
        `;
        return;
      }

      let html = '';
      data.listings.forEach(listing => {
        const isSold = listing.status === 'Sold';
        
        let conditionClass = 'badge-condition-good';
        if (listing.condition === 'New') conditionClass = 'badge-condition-new';
        else if (listing.condition === 'Like New') conditionClass = 'badge-condition-likenew';
        else if (listing.condition === 'Fair') conditionClass = 'badge-condition-fair';

        html += `
          <div class="listing-card" data-id="${listing._id}">
            <div class="listing-card-img-box">
              <img src="${listing.images[0]}" alt="${listing.title}" class="listing-card-img">
              <span class="listing-badge ${conditionClass}">${listing.condition}</span>
              ${isSold ? '<div class="badge-sold">Sold</div>' : ''}
            </div>
            <div class="listing-card-content">
              <span class="listing-card-college"><i class="bi bi-building"></i> ${listing.college}</span>
              <h3 class="listing-card-title">${listing.title}</h3>
              <span class="listing-card-price">${formatCurrency(listing.expectedPrice)}</span>
            </div>
          </div>
        `;
      });
      grid.innerHTML = html;

      // Click card redirect to listing details page
      grid.querySelectorAll('.listing-card').forEach(card => {
        card.addEventListener('click', () => {
          window.location.hash = `#/listing/${card.dataset.id}`;
        });
      });

    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: span 3;">
          <div class="empty-state-icon"><i class="bi bi-cloud-slash"></i></div>
          <h4 class="empty-state-title">Failed to load listings</h4>
          <p class="empty-state-text">Check your backend server connection.</p>
        </div>
      `;
    }
  }
};

export default BuySellView;

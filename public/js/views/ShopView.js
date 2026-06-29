/* ==========================================================================
   CampusKart E-Commerce Shop View
   ========================================================================== */

import { API } from '../api.js';
import { cart } from '../app.js';
import { formatCurrency, getProductSkeletonHTML } from '../utils.js';

const ShopView = {
  activeFilters: {
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'latest',
    page: 1
  },

  /**
   * Render initial structure
   */
  async render(request) {
    // Synchronize query parameters on direct links
    this.activeFilters.category = request.queryParams.category || '';
    this.activeFilters.search = request.queryParams.search || '';
    this.activeFilters.page = Number(request.queryParams.page) || 1;
    this.activeFilters.sortBy = request.queryParams.sortBy || 'latest';
    this.activeFilters.minPrice = request.queryParams.minPrice || '';
    this.activeFilters.maxPrice = request.queryParams.maxPrice || '';

    return `
      <div class="container">
        <!-- Breadcrumb / Header Title -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">
            <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp; Shop Essentials
          </span>
          <h1 style="font-size: 32px; margin-top: 4px;">Academic Essentials</h1>
        </div>

        <div class="shop-layout">
          <!-- Filter Sidebar -->
          <aside class="filters-sidebar">
            <!-- Search Inside Shop -->
            <div>
              <h4 class="filter-widget-title">Keyword Search</h4>
              <div class="form-group" style="margin-bottom: 0;">
                <input type="text" id="shop-search-input" class="form-control" placeholder="Search..." value="${this.activeFilters.search}">
              </div>
            </div>

            <!-- Categories Checklist -->
            <div>
              <h4 class="filter-widget-title">Categories</h4>
              <div id="shop-categories-list" class="filter-list">
                <div class="skeleton" style="height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="height: 16px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="height: 16px;"></div>
              </div>
            </div>

            <!-- Price Range -->
            <div>
              <h4 class="filter-widget-title">Price Filter</h4>
              <div class="price-range-inputs">
                <input type="number" id="shop-price-min" class="form-control" placeholder="Min" value="${this.activeFilters.minPrice}">
                <span style="color: var(--text-tertiary);">to</span>
                <input type="number" id="shop-price-max" class="form-control" placeholder="Max" value="${this.activeFilters.maxPrice}">
              </div>
              <button id="apply-price-filter-btn" class="btn btn-secondary btn-sm btn-block" style="margin-top: 12px;">Apply Price</button>
            </div>

            <!-- Reset Filters -->
            <button id="reset-filters-btn" class="btn btn-outline btn-block"><i class="bi bi-trash"></i> Reset Filters</button>
          </aside>

          <!-- Products Content Area -->
          <section>
            <!-- Content Header -->
            <div class="shop-content-header">
              <span id="shop-results-info" class="shop-results-count">Showing 0 products</span>
              
              <div class="shop-sorting-control">
                <span>Sort by</span>
                <select id="shop-sort-select">
                  <option value="latest" ${this.activeFilters.sortBy === 'latest' ? 'selected' : ''}>Latest Arrivals</option>
                  <option value="priceAsc" ${this.activeFilters.sortBy === 'priceAsc' ? 'selected' : ''}>Price: Low to High</option>
                  <option value="priceDesc" ${this.activeFilters.sortBy === 'priceDesc' ? 'selected' : ''}>Price: High to Low</option>
                  <option value="rating" ${this.activeFilters.sortBy === 'rating' ? 'selected' : ''}>Highest Rated</option>
                </select>
              </div>
            </div>

            <!-- Products Grid Panel -->
            <div id="shop-products-container" class="products-grid">
              ${getProductSkeletonHTML(6)}
            </div>

            <!-- Pagination Controls -->
            <div id="shop-pagination-container" class="pagination-container">
              <!-- Rendered Dynamically -->
            </div>
          </section>
        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers and load API products
   */
  async afterRender() {
    this.loadCategories();
    this.fetchProducts();

    // Bind Search Input typing
    const searchInput = document.getElementById('shop-search-input');
    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.activeFilters.search = e.target.value.trim();
        this.activeFilters.page = 1;
        this.updateURL();
        this.fetchProducts();
      }, 400);
    });

    // Bind Sort Options select change
    const sortSelect = document.getElementById('shop-sort-select');
    sortSelect.addEventListener('change', (e) => {
      this.activeFilters.sortBy = e.target.value;
      this.activeFilters.page = 1;
      this.updateURL();
      this.fetchProducts();
    });

    // Bind Apply Price range filter
    const applyPriceBtn = document.getElementById('apply-price-filter-btn');
    applyPriceBtn.addEventListener('click', () => {
      this.activeFilters.minPrice = document.getElementById('shop-price-min').value.trim();
      this.activeFilters.maxPrice = document.getElementById('shop-price-max').value.trim();
      this.activeFilters.page = 1;
      this.updateURL();
      this.fetchProducts();
    });

    // Bind Reset Filters button
    const resetBtn = document.getElementById('reset-filters-btn');
    resetBtn.addEventListener('click', () => {
      this.activeFilters = {
        category: '',
        search: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'latest',
        page: 1
      };
      
      // Update form values
      document.getElementById('shop-search-input').value = '';
      document.getElementById('shop-price-min').value = '';
      document.getElementById('shop-price-max').value = '';
      document.getElementById('shop-sort-select').value = 'latest';
      
      // Clear radio selectors
      document.querySelectorAll('.category-radio').forEach(radio => radio.checked = false);
      const allRadio = document.getElementById('cat-all');
      if (allRadio) allRadio.checked = true;

      this.updateURL();
      this.fetchProducts();
    });
  },

  /**
   * Load Categories from Server and populate list
   */
  async loadCategories() {
    try {
      const data = await API.get('/categories');
      const container = document.getElementById('shop-categories-list');
      if (!container || !data.success) return;

      let html = `
        <label class="filter-item">
          <input type="radio" name="shop-category" id="cat-all" value="" ${!this.activeFilters.category ? 'checked' : ''} class="category-radio">
          <span>All Categories</span>
        </label>
      `;

      data.categories.forEach(c => {
        const isChecked = this.activeFilters.category === c.slug;
        html += `
          <label class="filter-item">
            <input type="radio" name="shop-category" value="${c.slug}" ${isChecked ? 'checked' : ''} class="category-radio">
            <span>${c.name}</span>
          </label>
        `;
      });

      container.innerHTML = html;

      // Attach change listeners to category radio buttons
      container.querySelectorAll('.category-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.activeFilters.category = e.target.value;
          this.activeFilters.page = 1;
          this.updateURL();
          this.fetchProducts();
        });
      });
    } catch (error) {
      console.error('Failed to load shop categories:', error);
    }
  },

  /**
   * Update window location hash with current filter state
   */
  updateURL() {
    const params = new URLSearchParams();
    if (this.activeFilters.category) params.set('category', this.activeFilters.category);
    if (this.activeFilters.search) params.set('search', this.activeFilters.search);
    if (this.activeFilters.minPrice) params.set('minPrice', this.activeFilters.minPrice);
    if (this.activeFilters.maxPrice) params.set('maxPrice', this.activeFilters.maxPrice);
    if (this.activeFilters.sortBy) params.set('sortBy', this.activeFilters.sortBy);
    if (this.activeFilters.page > 1) params.set('page', this.activeFilters.page);

    const queryStr = params.toString();
    window.history.pushState(null, '', `#/shop${queryStr ? '?' + queryStr : ''}`);
  },

  /**
   * Fetch products dynamically based on filters and render
   */
  async fetchProducts() {
    const productsContainer = document.getElementById('shop-products-container');
    if (!productsContainer) return;

    productsContainer.innerHTML = getProductSkeletonHTML(6);

    try {
      const { category, search, minPrice, maxPrice, sortBy, page } = this.activeFilters;
      let urlPath = `/products?page=${page}&limit=6&sortBy=${sortBy}`;
      
      if (category) urlPath += `&category=${category}`;
      if (search) urlPath += `&search=${encodeURIComponent(search)}`;
      if (minPrice) urlPath += `&minPrice=${minPrice}`;
      if (maxPrice) urlPath += `&maxPrice=${maxPrice}`;

      const data = await API.get(urlPath);
      if (!data.success) throw new Error('API request failed');

      // Update Result count info
      document.getElementById('shop-results-info').textContent = 
        `Showing ${data.products.length} of ${data.pagination.totalProducts} products`;

      if (data.products.length === 0) {
        productsContainer.innerHTML = `
          <div class="empty-state" style="grid-column: span 3;">
            <div class="empty-state-icon"><i class="bi bi-search"></i></div>
            <h4 class="empty-state-title">No Products Found</h4>
            <p class="empty-state-text">We couldn't find any products matching your active filters. Try refining your keyword or resetting price bounds.</p>
          </div>
        `;
        document.getElementById('shop-pagination-container').innerHTML = '';
        return;
      }

      // Render product grid
      let prodHtml = '';
      data.products.forEach(p => {
        const hasDiscount = p.discountPrice > 0;
        const displayPrice = hasDiscount ? p.discountPrice : p.price;
        
        prodHtml += `
          <div class="product-card">
            <div class="product-card-img-box" data-id="${p._id}">
              <img src="${p.images[0]}" alt="${p.name}" class="product-card-img">
            </div>
            <div class="product-card-content">
              <span class="product-card-category">${p.category?.name || 'Academic'}</span>
              <h3 class="product-card-title" data-id="${p._id}">${p.name}</h3>
              <div class="product-card-rating">
                <i class="bi bi-star-fill"></i> <span>${p.rating}</span>
                <span class="rating-count">(${p.reviewsCount})</span>
              </div>
              <div class="product-card-footer">
                <div class="product-card-price-box">
                  ${hasDiscount ? `<span class="product-price-reg">${formatCurrency(p.price)}</span>` : ''}
                  <span class="product-price">${formatCurrency(displayPrice)}</span>
                </div>
                <button class="add-to-cart-btn" data-id="${p._id}" title="Quick Add">
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });
      productsContainer.innerHTML = prodHtml;

      // Bind Details redirection click
      productsContainer.querySelectorAll('.product-card-img-box, .product-card-title').forEach(el => {
        el.addEventListener('click', () => {
          window.location.hash = `#/product/${el.dataset.id}`;
        });
      });

      // Bind Add to Cart
      productsContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = data.products.find(p => p._id === btn.dataset.id);
          if (target) {
            cart.add(target, 1);
          }
        });
      });

      // Render Pagination row
      this.renderPagination(data.pagination);

    } catch (error) {
      console.error('Fetch products shop view failed:', error);
      productsContainer.innerHTML = `
        <div class="empty-state" style="grid-column: span 3;">
          <div class="empty-state-icon"><i class="bi bi-cloud-slash"></i></div>
          <h4 class="empty-state-title">Failed to Load Catalog</h4>
          <p class="empty-state-text">Check your internet connection or try again.</p>
        </div>
      `;
    }
  },

  /**
   * Render Page numbers row
   */
  renderPagination(pageInfo) {
    const container = document.getElementById('shop-pagination-container');
    if (!container) return;

    const { page, totalPages } = pageInfo;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn prev-page ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn page-num ${page === i ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn next-page ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''}>
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    container.innerHTML = html;

    // Add Pagination click events
    container.querySelectorAll('.page-num').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilters.page = Number(btn.dataset.page);
        this.updateURL();
        this.fetchProducts();
      });
    });

    container.querySelector('.prev-page')?.addEventListener('click', () => {
      if (this.activeFilters.page > 1) {
        this.activeFilters.page--;
        this.updateURL();
        this.fetchProducts();
      }
    });

    container.querySelector('.next-page')?.addEventListener('click', () => {
      if (this.activeFilters.page < totalPages) {
        this.activeFilters.page++;
        this.updateURL();
        this.fetchProducts();
      }
    });
  }
};

export default ShopView;

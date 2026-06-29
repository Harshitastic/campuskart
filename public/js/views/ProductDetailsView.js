/* ==========================================================================
   CampusKart Product Details View
   ========================================================================== */

import { API } from '../api.js';
import { state, cart } from '../app.js';
import { formatCurrency, formatDate, showToast, getProductSkeletonHTML } from '../utils.js';

const ProductDetailsView = {
  product: null,
  reviews: [],
  relatedProducts: [],

  /**
   * Render HTML template
   */
  async render(request) {
    if (!request.id) {
      return `<div class="container empty-state"><h2 class="empty-state-title">No Product Selected</h2></div>`;
    }

    return `
      <div class="container">
        <!-- Breadcrumb -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">
            <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp;
            <a href="#/shop" style="color: var(--text-tertiary);">Shop</a> &nbsp;/&nbsp;
            <span id="breadcrumb-category" class="skeleton" style="display: inline-block; width: 60px; height: 14px;"></span> &nbsp;/&nbsp;
            <span id="breadcrumb-title" class="skeleton" style="display: inline-block; width: 120px; height: 14px;"></span>
          </span>
        </div>

        <div id="details-loading-placeholder">
          <div class="full-screen-loader">
            <div class="loader-spinner"></div>
            <p class="loader-message">Loading product details...</p>
          </div>
        </div>

        <!-- Main Product Card Info Grid -->
        <div id="details-content-grid" class="details-layout hidden">
          <!-- Left: Gallery Column -->
          <div class="details-gallery">
            <div id="main-img-container" class="main-img-container">
              <img id="details-main-img" class="details-main-img" src="" alt="Product Main Image">
            </div>
            
            <div id="details-thumbs-list" class="thumbs-list">
              <!-- Rendered Dynamically -->
            </div>
          </div>

          <!-- Right: Info Panel Column -->
          <div class="details-info">
            <div>
              <span id="details-brand" class="details-brand"></span>
              <h1 id="details-title" class="details-title"></h1>
            </div>

            <!-- Ratings Summary -->
            <div class="details-rating-row">
              <div id="details-stars-summary" class="stars"></div>
              <span id="details-rating-val" style="font-weight: 700;"></span>
              <a href="#reviews" class="reviews-link">(<span id="details-reviews-count">0</span> student reviews)</a>
            </div>

            <!-- Pricing Breakdown -->
            <div class="details-prices">
              <span id="details-price" class="details-price"></span>
              <span id="details-price-reg" class="details-price-reg"></span>
              <span id="details-stock-badge" class="details-stock-badge"></span>
            </div>

            <p id="details-description" class="details-description"></p>

            <!-- Quantity Selector & Cart Add Controls -->
            <div id="details-purchase-row" class="details-purchase-box">
              <div class="qty-selector">
                <button id="details-qty-dec"><i class="bi bi-dash"></i></button>
                <input type="text" id="details-qty-val" value="1" readonly>
                <button id="details-qty-inc"><i class="bi bi-plus"></i></button>
              </div>
              <button id="details-add-cart-btn" class="btn btn-primary" style="flex-grow: 1;">
                <i class="bi bi-cart-plus"></i> Add to Shopping Cart
              </button>
            </div>

            <!-- Specifications Table -->
            <div>
              <h4 style="font-size: 16px; font-weight: 700; margin-top: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                Product Specifications
              </h4>
              <table id="details-spec-table" class="details-spec-table">
                <!-- Rendered Dynamically -->
              </table>
            </div>
          </div>
        </div>

        <!-- Related products Grid section -->
        <div id="details-related-section" class="reviews-section hidden" style="border-bottom: 1px solid var(--border-color); padding-bottom: 40px;">
          <h2 style="font-size: 22px; margin-bottom: 20px;">Related Essentials</h2>
          <div id="details-related-grid" class="products-grid">
            ${getProductSkeletonHTML(4)}
          </div>
        </div>

        <!-- Student Reviews List & Submission section -->
        <div id="details-reviews-section" class="reviews-section hidden">
          <div class="reviews-section-title">
            <h2 id="reviews">Student Reviews &amp; Feedback</h2>
            <button id="write-review-btn" class="btn btn-outline btn-sm">Write a Review</button>
          </div>

          <div id="reviews-list-container">
            <!-- Reviews Populated dynamically -->
          </div>
        </div>
      </div>

      <!-- Add Review Modal -->
      <div id="review-modal-overlay" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Submit Product Review</h3>
            <button id="review-modal-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="submit-review-form" class="review-form-container">
              <div class="form-group">
                <label>Select Rating (1 to 5 Stars)</label>
                <div id="modal-stars-group" class="stars-input-group">
                  <i class="bi bi-star" data-rating="1"></i>
                  <i class="bi bi-star" data-rating="2"></i>
                  <i class="bi bi-star" data-rating="3"></i>
                  <i class="bi bi-star" data-rating="4"></i>
                  <i class="bi bi-star" data-rating="5"></i>
                </div>
                <input type="hidden" id="review-rating-value" value="0">
              </div>
              <div class="form-group">
                <label>Review Description</label>
                <textarea id="review-comment-value" class="form-control" rows="4" placeholder="How did this product perform? Share your hostel setup experience..." required></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Publish Review</button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bind components
   */
  async afterRender(request) {
    const id = request.id;
    if (!id) return;

    try {
      // 1. Fetch Product details from server
      const prodData = await API.get(`/products/${id}`);
      if (!prodData.success) throw new Error('Failed to load product details');
      
      this.product = prodData.product;

      // Populate layout properties
      const catBreadcrumb = document.getElementById('breadcrumb-category');
      catBreadcrumb.textContent = this.product.category?.name || 'Shop';
      catBreadcrumb.className = '';
      catBreadcrumb.removeAttribute('style');

      const titleBreadcrumb = document.getElementById('breadcrumb-title');
      titleBreadcrumb.textContent = this.product.name;
      titleBreadcrumb.className = '';
      titleBreadcrumb.removeAttribute('style');

      document.getElementById('details-brand').textContent = this.product.brand;
      document.getElementById('details-title').textContent = this.product.name;
      document.getElementById('details-rating-val').textContent = this.product.rating > 0 ? this.product.rating : 'N/A';
      document.getElementById('details-reviews-count').textContent = this.product.reviewsCount;
      document.getElementById('details-description').textContent = this.product.description;

      // Renders rating stars summary
      let starsHtml = '';
      const fullStars = Math.floor(this.product.rating);
      for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
          starsHtml += '<i class="bi bi-star-fill"></i>';
        } else if (i - 0.5 <= this.product.rating) {
          starsHtml += '<i class="bi bi-star-half"></i>';
        } else {
          starsHtml += '<i class="bi bi-star"></i>';
        }
      }
      document.getElementById('details-stars-summary').innerHTML = starsHtml;

      // Render pricing
      const hasDiscount = this.product.discountPrice > 0;
      const finalPrice = hasDiscount ? this.product.discountPrice : this.product.price;
      document.getElementById('details-price').textContent = formatCurrency(finalPrice);
      
      const priceRegEl = document.getElementById('details-price-reg');
      if (hasDiscount) {
        priceRegEl.textContent = formatCurrency(this.product.price);
        priceRegEl.classList.remove('hidden');
      } else {
        priceRegEl.classList.add('hidden');
      }

      // Stock management styling
      const stockBadge = document.getElementById('details-stock-badge');
      const addCartBtn = document.getElementById('details-add-cart-btn');

      if (this.product.stock <= 0) {
        stockBadge.textContent = 'Out of Stock';
        stockBadge.className = 'details-stock-badge stock-outstock';
        addCartBtn.disabled = true;
        addCartBtn.innerHTML = '<i class="bi bi-x-circle"></i> Temporary Unavailable';
      } else if (this.product.stock < 10) {
        stockBadge.textContent = `Low Stock: Only ${this.product.stock} left`;
        stockBadge.className = 'details-stock-badge stock-lowstock';
      } else {
        stockBadge.textContent = 'In Stock';
        stockBadge.className = 'details-stock-badge stock-instock';
      }

      // Render Image viewer
      const mainImg = document.getElementById('details-main-img');
      mainImg.src = this.product.images[0];
      mainImg.alt = this.product.name;

      const thumbsList = document.getElementById('details-thumbs-list');
      let thumbsHtml = '';
      this.product.images.forEach((img, idx) => {
        thumbsHtml += `
          <div class="thumb-img-wrapper ${idx === 0 ? 'active' : ''}" data-src="${img}">
            <img src="${img}" alt="Thumbnail ${idx}">
          </div>
        `;
      });
      thumbsList.innerHTML = thumbsHtml;

      // Handle Thumbnail image selections
      thumbsList.querySelectorAll('.thumb-img-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', () => {
          thumbsList.querySelectorAll('.thumb-img-wrapper').forEach(w => w.classList.remove('active'));
          wrapper.classList.add('active');
          mainImg.src = wrapper.dataset.src;
        });
      });

      // Magnify zoom effect on main image box hover
      const mainImgContainer = document.getElementById('main-img-container');
      mainImgContainer.addEventListener('mousemove', (e) => {
        const rect = mainImgContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mainImg.style.transformOrigin = `${x}px ${y}px`;
        mainImg.style.transform = 'scale(1.6)';
      });
      mainImgContainer.addEventListener('mouseleave', () => {
        mainImg.style.transform = 'scale(1)';
        mainImg.style.transformOrigin = 'center';
      });

      // Renders specs table
      const specTable = document.getElementById('details-spec-table');
      if (this.product.specifications && this.product.specifications.length > 0) {
        let specHtml = '';
        this.product.specifications.forEach(spec => {
          specHtml += `
            <tr>
              <td>${spec.name}</td>
              <td>${spec.value}</td>
            </tr>
          `;
        });
        specTable.innerHTML = specHtml;
      } else {
        specTable.innerHTML = `<tr><td colspan="2">No specifications listed.</td></tr>`;
      }

      // Quantity adjustments controls
      const qtyValEl = document.getElementById('details-qty-val');
      document.getElementById('details-qty-dec').addEventListener('click', () => {
        let q = Number(qtyValEl.value);
        if (q > 1) qtyValEl.value = q - 1;
      });
      document.getElementById('details-qty-inc').addEventListener('click', () => {
        let q = Number(qtyValEl.value);
        if (q < this.product.stock) qtyValEl.value = q + 1;
        else showToast(`Only ${this.product.stock} items left in stock`, 'warning');
      });

      // Add to Cart event binding
      addCartBtn.addEventListener('click', () => {
        const quantity = Number(qtyValEl.value);
        cart.add(this.product, quantity);
      });

      // Swap layout classes
      document.getElementById('details-loading-placeholder').classList.add('hidden');
      document.getElementById('details-content-grid').classList.remove('hidden');

      // Fetch Reviews list
      this.fetchReviews(id);

      // Fetch Related Essentials list
      this.fetchRelatedProducts(id);

      // Setup Reviews modal listeners
      this.setupReviewsForm(id);

    } catch (err) {
      console.error(err);
      document.getElementById('app').innerHTML = `
        <div class="container empty-state">
          <div class="empty-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <h2 class="empty-state-title">Failed to Load Product</h2>
          <p class="empty-state-text">${err.message || 'Details could not be fetched.'}</p>
        </div>
      `;
    }
  },

  /**
   * Fetch and render product reviews
   */
  async fetchReviews(productId) {
    try {
      const data = await API.get(`/reviews/product/${productId}`);
      const listContainer = document.getElementById('reviews-list-container');
      const countEl = document.getElementById('details-reviews-count');
      const writeReviewBtn = document.getElementById('write-review-btn');
      
      if (!listContainer || !data.success) return;

      this.reviews = data.reviews;
      countEl.textContent = this.reviews.length;
      document.getElementById('details-reviews-section').classList.remove('hidden');

      // Setup write review visibility (Check if logged in)
      if (!state.user) {
        writeReviewBtn.innerHTML = 'Login to Review';
      }

      if (this.reviews.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state" style="padding: 24px;">
            <p class="empty-state-text">No student reviews published for this product yet.</p>
          </div>
        `;
        return;
      }

      let html = '';
      this.reviews.forEach(r => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
          stars += `<i class="bi bi-star${i <= r.rating ? '-fill' : ''}" style="color: var(--warning-color); font-size: 11px;"></i>`;
        }

        html += `
          <div class="review-item-row">
            <div class="review-item-header">
              <div class="review-item-user">
                <span>${r.user?.name || 'Anonymous Student'}</span>
                ${r.verifiedPurchase ? '<span class="verified-purchase-badge"><i class="bi bi-shield-check"></i> Verified Buyer</span>' : ''}
              </div>
              <div class="review-item-date">${formatDate(r.createdAt)}</div>
            </div>
            <div style="margin-bottom: 8px;">${stars}</div>
            <p class="review-item-comment">${r.comment}</p>
          </div>
        `;
      });
      listContainer.innerHTML = html;
    } catch (error) {
      console.error('Fetch product reviews failed:', error);
    }
  },

  /**
   * Fetch and render related products
   */
  async fetchRelatedProducts(productId) {
    try {
      const data = await API.get(`/products/${productId}/related`);
      const grid = document.getElementById('details-related-grid');
      const section = document.getElementById('details-related-section');
      
      if (!grid || !data.success) return;

      if (data.products.length === 0) {
        section.classList.add('hidden');
        return;
      }

      section.classList.remove('hidden');

      let html = '';
      data.products.forEach(p => {
        const hasDiscount = p.discountPrice > 0;
        const displayPrice = hasDiscount ? p.discountPrice : p.price;

        html += `
          <div class="product-card">
            <div class="product-card-img-box" data-id="${p._id}">
              <img src="${p.images[0]}" alt="${p.name}" class="product-card-img">
            </div>
            <div class="product-card-content">
              <span class="product-card-category">${p.category?.name || 'Essentials'}</span>
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
      grid.innerHTML = html;

      // Related products clicks
      grid.querySelectorAll('.product-card-img-box, .product-card-title').forEach(el => {
        el.addEventListener('click', () => {
          window.location.hash = `#/product/${el.dataset.id}`;
        });
      });

      grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = data.products.find(p => p._id === btn.dataset.id);
          if (target) {
            cart.add(target, 1);
          }
        });
      });
    } catch (error) {
      console.error('Fetch related items details view failed:', error);
    }
  },

  /**
   * Reviews form rating selection click triggers
   */
  setupReviewsForm(productId) {
    const writeBtn = document.getElementById('write-review-btn');
    const modal = document.getElementById('review-modal-overlay');
    const closeBtn = document.getElementById('review-modal-close');
    const form = document.getElementById('submit-review-form');

    writeBtn.addEventListener('click', () => {
      if (!state.user) {
        showToast('Please login to leave a review', 'warning');
        window.location.hash = '#/auth?mode=login';
        return;
      }
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Handle Star Selection visual trigger
    const starsGroup = document.getElementById('modal-stars-group');
    const ratingInput = document.getElementById('review-rating-value');
    
    starsGroup.querySelectorAll('i').forEach(star => {
      star.addEventListener('click', (e) => {
        const val = Number(e.target.dataset.rating);
        ratingInput.value = val;

        starsGroup.querySelectorAll('i').forEach(s => {
          const sVal = Number(s.dataset.rating);
          if (sVal <= val) {
            s.className = 'bi bi-star-fill active';
          } else {
            s.className = 'bi bi-star';
          }
        });
      });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = Number(ratingInput.value);
      const comment = document.getElementById('review-comment-value').value.trim();

      if (rating === 0) {
        showToast('Please select a rating star before publishing', 'warning');
        return;
      }

      try {
        const res = await API.post('/reviews', {
          productId,
          rating,
          comment
        });

        if (res.success) {
          showToast('Review submitted successfully!', 'success');
          modal.classList.add('hidden');
          form.reset();
          ratingInput.value = '0';
          starsGroup.querySelectorAll('i').forEach(s => s.className = 'bi bi-star');
          
          // Refresh reviews count & average
          this.afterRender({ id: productId });
        }
      } catch (err) {
        showToast(err.message || 'Review submission failed. Have you purchased this item?', 'error');
      }
    });
  }
};

export default ProductDetailsView;

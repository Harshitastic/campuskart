/* ==========================================================================
   CampusKart Buy & Sell Listing Details View
   ========================================================================== */

import { API } from '../api.js';
import { state } from '../app.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

const ListingDetailsView = {
  listing: null,

  /**
   * Render HTML skeleton structure
   */
  async render(request) {
    if (!request.id) {
      return `<div class="container empty-state"><h2 class="empty-state-title">No Listing Specified</h2></div>`;
    }

    return `
      <div class="container">
        <!-- Breadcrumb -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">
            <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp;
            <a href="#/buy-sell" style="color: var(--text-tertiary);">Buy &amp; Sell</a> &nbsp;/&nbsp;
            <span id="listing-breadcrumb-title" class="skeleton" style="display: inline-block; width: 120px; height: 14px;"></span>
          </span>
        </div>

        <div id="listing-loading-placeholder">
          <div class="full-screen-loader">
            <div class="loader-spinner"></div>
            <p class="loader-message">Fetching listing details...</p>
          </div>
        </div>

        <!-- Listing Details Layout Grid -->
        <div id="listing-content-grid" class="listing-details-layout hidden">
          <!-- Left Column: Gallery / Images -->
          <div class="details-gallery">
            <div class="main-img-container">
              <img id="listing-main-img" class="details-main-img" src="" alt="Listing Main Image">
              <div id="listing-sold-overlay" class="badge-sold hidden">Sold</div>
            </div>
            
            <div id="listing-thumbs-list" class="thumbs-list">
              <!-- Thumbnails rendered dynamically -->
            </div>
          </div>

          <!-- Right Column: Info Panel -->
          <div class="details-info">
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
                <span id="listing-condition-badge" class="listing-badge" style="position: static;"></span>
                <span id="listing-college-badge" class="listing-badge" style="position: static; background-color: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color);"></span>
              </div>
              <h1 id="listing-title" class="details-title" style="font-size: 28px; line-height: 1.3;"></h1>
            </div>

            <!-- Price -->
            <div class="details-prices">
              <span id="listing-price" class="details-price"></span>
              <span id="listing-status" class="details-stock-badge"></span>
            </div>

            <!-- Description -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 18px; margin-top: 6px;">
              <h4 style="font-weight: 700; margin-bottom: 8px;">Item Description</h4>
              <p id="listing-description" style="color: var(--text-secondary); font-size: 15px; white-space: pre-line;"></p>
            </div>

            <!-- Direct Contact Button ("I'm Interested" Mailto link) -->
            <div style="margin-top: 20px;">
              <a id="listing-contact-btn" href="" class="btn btn-primary btn-block">
                <i class="bi bi-envelope"></i> I'm Interested (Contact Seller)
              </a>
              <p id="sold-notice" class="hidden" style="text-align: center; color: var(--text-tertiary); font-weight: 600; margin-top: 12px;">
                This item has been marked as sold.
              </p>
            </div>

            <!-- Seller Information Card -->
            <div class="seller-card">
              <h4>Seller Information</h4>
              <div class="seller-info-row">
                <span class="seller-info-label">Name</span>
                <span id="seller-name"></span>
              </div>
              <div class="seller-info-row">
                <span class="seller-info-label">College</span>
                <span id="seller-college"></span>
              </div>
              <div class="seller-info-row">
                <span class="seller-info-label">Listed on</span>
                <span id="seller-date"></span>
              </div>
            </div>

            <!-- Spam reporting -->
            <div id="listing-report-block" style="text-align: center; margin-top: 20px;">
              <button id="report-listing-btn" class="btn btn-text btn-sm" style="color: var(--danger-color);">
                <i class="bi bi-flag"></i> Report Inappropriate or Spam Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bind event handlers
   */
  async afterRender(request) {
    const id = request.id;
    if (!id) return;

    try {
      // 1. Fetch listing details from server
      const data = await API.get(`/listings/${id}`);
      if (!data.success) throw new Error('Listing not found');

      this.listing = data.listing;

      // Populate text fields
      const breadcrumb = document.getElementById('listing-breadcrumb-title');
      breadcrumb.textContent = this.listing.title;
      breadcrumb.className = '';
      breadcrumb.removeAttribute('style');
      
      document.getElementById('listing-title').textContent = this.listing.title;
      document.getElementById('listing-price').textContent = formatCurrency(this.listing.expectedPrice);
      document.getElementById('listing-description').textContent = this.listing.description;
      
      document.getElementById('seller-name').textContent = this.listing.seller?.name || 'Student Seller';
      document.getElementById('seller-college').textContent = this.listing.college;
      document.getElementById('seller-date').textContent = formatDate(this.listing.createdAt);

      // Condition badge setup
      const condBadge = document.getElementById('listing-condition-badge');
      condBadge.textContent = this.listing.condition;
      let condClass = 'badge-condition-good';
      if (this.listing.condition === 'New') condClass = 'badge-condition-new';
      else if (this.listing.condition === 'Like New') condClass = 'badge-condition-likenew';
      else if (this.listing.condition === 'Fair') condClass = 'badge-condition-fair';
      condBadge.className = `listing-badge ${condClass}`;

      // College badge setup
      document.getElementById('listing-college-badge').textContent = this.listing.college;

      // Render image gallery
      const mainImg = document.getElementById('listing-main-img');
      mainImg.src = this.listing.images[0];
      mainImg.alt = this.listing.title;

      const thumbsList = document.getElementById('listing-thumbs-list');
      let thumbsHtml = '';
      this.listing.images.forEach((img, idx) => {
        thumbsHtml += `
          <div class="thumb-img-wrapper ${idx === 0 ? 'active' : ''}" data-src="${img}">
            <img src="${img}" alt="Thumb ${idx}">
          </div>
        `;
      });
      thumbsList.innerHTML = thumbsHtml;

      // Bind thumbnail clicks
      thumbsList.querySelectorAll('.thumb-img-wrapper').forEach(w => {
        w.addEventListener('click', () => {
          thumbsList.querySelectorAll('.thumb-img-wrapper').forEach(x => x.classList.remove('active'));
          w.classList.add('active');
          mainImg.src = w.dataset.src;
        });
      });

      // Handle Sold Status overlay logic
      const statusBadge = document.getElementById('listing-status');
      const contactBtn = document.getElementById('listing-contact-btn');
      const soldOverlay = document.getElementById('listing-sold-overlay');
      const soldNotice = document.getElementById('sold-notice');

      if (this.listing.status === 'Sold') {
        statusBadge.textContent = 'Sold';
        statusBadge.className = 'details-stock-badge stock-outstock';
        soldOverlay.classList.remove('hidden');
        contactBtn.classList.add('hidden');
        soldNotice.classList.remove('hidden');
      } else {
        statusBadge.textContent = 'Available';
        statusBadge.className = 'details-stock-badge stock-instock';
        soldOverlay.classList.add('hidden');
        contactBtn.classList.remove('hidden');
        soldNotice.classList.add('hidden');

        // Setup prefilled mailto parameters
        const mailTo = this.listing.contactEmail;
        const subject = encodeURIComponent(`Interested in your CampusKart listing: ${this.listing.title}`);
        const body = encodeURIComponent(
          `Hi,\n\nI'm interested in purchasing your product listed on CampusKart.\n\nIs this item still available?\n\nCould you please let me know the final price and pickup details?\n\nThank you.`
        );
        contactBtn.setAttribute('href', `mailto:${mailTo}?subject=${subject}&body=${body}`);
      }

      // Hide report listing if current user is the listing owner
      const reportBlock = document.getElementById('listing-report-block');
      if (state.user && this.listing.seller && state.user._id === this.listing.seller._id) {
        reportBlock.classList.add('hidden');
      } else {
        reportBlock.classList.remove('hidden');
        
        // Report action trigger
        document.getElementById('report-listing-btn').addEventListener('click', async () => {
          if (!state.user) {
            showToast('Please login to report a listing', 'warning');
            window.location.hash = '#/auth?mode=login';
            return;
          }

          try {
            const res = await API.put(`/listings/${this.listing._id}/report`);
            if (res.success) {
              showToast(res.message, 'success');
            }
          } catch (err) {
            showToast(err.message || 'Failed to report listing', 'error');
          }
        });
      }

      // Toggle views
      document.getElementById('listing-loading-placeholder').classList.add('hidden');
      document.getElementById('listing-content-grid').classList.remove('hidden');

    } catch (error) {
      console.error(error);
      document.getElementById('app').innerHTML = `
        <div class="container empty-state">
          <div class="empty-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <h2 class="empty-state-title">Failed to load Listing</h2>
          <p class="empty-state-text">${error.message || 'Details could not be fetched.'}</p>
        </div>
      `;
    }
  }
};

export default ListingDetailsView;

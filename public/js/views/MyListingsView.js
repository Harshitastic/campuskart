/* ==========================================================================
   CampusKart My Listings View (Student Seller Dashboard)
   ========================================================================== */

import { API } from '../api.js';
import { state } from '../app.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

const MyListingsView = {
  listings: [],
  editingListingId: null,

  /**
   * Render HTML skeleton structure
   */
  async render() {
    if (!state.user) {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-lock"></i></div>
          <h2 class="empty-state-title">Login Required</h2>
          <p class="empty-state-text">You must be logged in to manage your student classified listings.</p>
          <a href="#/auth?mode=login&redirect=my-listings" class="btn btn-primary">Login Now</a>
        </div>
      `;
    }

    return `
      <div class="container">
        <!-- Header -->
        <div style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 13px; color: var(--text-tertiary);">
              <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp; Seller Profile
            </span>
            <h1 style="font-size: 32px; margin-top: 4px;">My Campus Listings</h1>
          </div>
          <button id="create-listing-trigger" class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Post Used Product
          </button>
        </div>

        <!-- Listings List panel -->
        <div id="mylistings-loading-placeholder">
          <div class="full-screen-loader">
            <div class="loader-spinner"></div>
            <p class="loader-message">Fetching your listings...</p>
          </div>
        </div>

        <div id="mylistings-content-panel" class="mylistings-grid hidden">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Add/Edit Listing Modal -->
      <div id="listing-form-overlay" class="modal-overlay hidden">
        <div class="modal-box" style="max-width: 550px;">
          <div class="modal-header">
            <h3 id="listing-modal-title">Create Classified Listing</h3>
            <button id="listing-modal-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="listing-upsert-form" class="review-form-container">
              
              <div class="form-group">
                <label>Listing Title</label>
                <input type="text" id="listing-form-title" class="form-control" placeholder="e.g. Engineering drawing board clips" required>
              </div>

              <div class="form-group">
                <label>Expected Price (Rs.)</label>
                <input type="number" id="listing-form-price" class="form-control" placeholder="e.g. 250" min="0" required>
              </div>

              <div class="form-group">
                <label>Category Type</label>
                <select id="listing-form-category" class="form-control" required>
                  <option value="" disabled selected>Select category...</option>
                  <option value="Used Books">Used Books</option>
                  <option value="Calculators">Calculators</option>
                  <option value="Engineering Kits">Engineering Kits</option>
                  <option value="Laptop Accessories">Laptop Accessories</option>
                  <option value="Study Tables">Study Tables</option>
                  <option value="Chairs">Chairs</option>
                  <option value="Cycles">Cycles</option>
                  <option value="Monitors">Monitors</option>
                  <option value="Keyboards">Keyboards</option>
                  <option value="Hostel Furniture">Hostel Furniture</option>
                  <option value="College Merchandise">College Merchandise</option>
                  <option value="Backpacks">Backpacks</option>
                </select>
              </div>

              <div class="form-group">
                <label>Product Condition</label>
                <select id="listing-form-condition" class="form-control" required>
                  <option value="" disabled selected>Choose condition...</option>
                  <option value="New">New (Unopened box)</option>
                  <option value="Like New">Like New (Barely used, zero scratches)</option>
                  <option value="Good">Good (Minor wear, fully functional)</option>
                  <option value="Fair">Fair (Noticeable wear, functional)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Your College / Campus</label>
                <input type="text" id="listing-form-college" class="form-control" placeholder="e.g. IIT Bombay" required>
              </div>

              <div class="form-group">
                <label>Contact Email (Direct replies received here)</label>
                <input type="email" id="listing-form-email" class="form-control" placeholder="e.g. student@college.edu" required>
              </div>

              <div class="form-group">
                <label>Description Details</label>
                <textarea id="listing-form-desc" class="form-control" rows="4" placeholder="Mention age, scratches, flaws, and negotiation flexibility..." required></textarea>
              </div>

              <div class="form-group">
                <label>Upload Images (Max 3, JPG/PNG)</label>
                <input type="file" id="listing-form-files" class="form-control" multiple accept="image/*">
                <small style="color: var(--text-tertiary); font-size: 11px;">
                  If Cloudinary is offline, images are saved as Base64 in DB (files under 2MB recommended).
                </small>
                <div id="image-upload-spinner" class="hidden" style="margin-top: 8px; font-weight: 600; color: var(--accent-color);">
                  <i class="bi bi-arrow-repeat spin"></i> Uploading images to storage...
                </div>
              </div>

              <button type="submit" id="listing-submit-btn" class="btn btn-primary btn-block">Publish Listing</button>
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
    if (!state.user) return;

    this.fetchUserListings();

    const modal = document.getElementById('listing-form-overlay');
    const closeBtn = document.getElementById('listing-modal-close');
    const createBtn = document.getElementById('create-listing-trigger');
    const form = document.getElementById('listing-upsert-form');

    // Show modal on create trigger
    createBtn.addEventListener('click', () => {
      this.editingListingId = null;
      document.getElementById('listing-modal-title').textContent = 'Post Classified Listing';
      document.getElementById('listing-submit-btn').textContent = 'Publish Listing';
      
      // Auto-prefill contact details from logged-in user profile
      form.reset();
      document.getElementById('listing-form-email').value = state.user.email;
      if (state.user.addresses && state.user.addresses.length > 0) {
        // Simple heuristic: extract college name if address has it
        const defaultAddr = state.user.addresses.find(a => a.isDefault) || state.user.addresses[0];
        if (defaultAddr.address.toLowerCase().includes('hostel')) {
          const match = defaultAddr.address.split(',').pop().trim();
          document.getElementById('listing-form-college').value = match;
        }
      }

      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Form submission (Add / Edit)
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('listing-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        const title = document.getElementById('listing-form-title').value.trim();
        const price = Number(document.getElementById('listing-form-price').value);
        const category = document.getElementById('listing-form-category').value;
        const condition = document.getElementById('listing-form-condition').value;
        const college = document.getElementById('listing-form-college').value.trim();
        const email = document.getElementById('listing-form-email').value.trim();
        const desc = document.getElementById('listing-form-desc').value.trim();
        
        const filesInput = document.getElementById('listing-form-files');
        const uploadSpinner = document.getElementById('image-upload-spinner');

        let imageUrls = [];

        // Upload images first if files are selected
        if (filesInput.files && filesInput.files.length > 0) {
          uploadSpinner.classList.remove('hidden');
          
          if (filesInput.files.length > 3) {
            throw new Error('You can upload a maximum of 3 images');
          }

          // Single or multiple uploads using the API helper
          const uploadRes = await API.uploadMultiple(filesInput.files);
          imageUrls = uploadRes.urls;
          
          uploadSpinner.classList.add('hidden');
        }

        const payload = {
          title,
          description: desc,
          expectedPrice: price,
          category,
          condition,
          college,
          contactEmail: email
        };

        // If new images were uploaded, append them
        if (imageUrls.length > 0) {
          payload.images = imageUrls;
        } else if (!this.editingListingId) {
          // Default placeholder listing image if none provided during creation
          payload.images = ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop'];
        }

        if (this.editingListingId) {
          // Update Mode
          const res = await API.put(`/listings/${this.editingListingId}`, payload);
          if (res.success) {
            showToast('Listing updated successfully!', 'success');
          }
        } else {
          // Create Mode
          const res = await API.post('/listings', payload);
          if (res.success) {
            showToast('Listing published successfully!', 'success');
          }
        }

        modal.classList.add('hidden');
        form.reset();
        this.fetchUserListings();
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
        document.getElementById('image-upload-spinner').classList.add('hidden');
      } finally {
        submitBtn.disabled = false;
      }
    });
  },

  /**
   * Fetch and render current user listings
   */
  async fetchUserListings() {
    const listPanel = document.getElementById('mylistings-content-panel');
    const loading = document.getElementById('mylistings-loading-placeholder');
    if (!listPanel) return;

    try {
      const data = await API.get('/listings/my-listings');
      if (!data.success) throw new Error('Could not fetch listings');

      this.listings = data.listings;

      if (this.listings.length === 0) {
        listPanel.innerHTML = `
          <div class="empty-state" style="grid-column: span 1; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 14px;">
            <div class="empty-state-icon"><i class="bi bi-tag"></i></div>
            <h4 class="empty-state-title">No Classifieds Posted</h4>
            <p class="empty-state-text">List your study chair, calculator, or textbook that you no longer need.</p>
            <button id="empty-state-create-btn" class="btn btn-primary btn-sm">Post Your First Item</button>
          </div>
        `;
        listPanel.classList.remove('hidden');
        loading.classList.add('hidden');
        
        document.getElementById('empty-state-create-btn')?.addEventListener('click', () => {
          document.getElementById('create-listing-trigger').click();
        });
        return;
      }

      let html = '';
      this.listings.forEach(item => {
        const isSold = item.status === 'Sold';
        
        html += `
          <div class="mylistings-row" data-id="${item._id}">
            <div class="mylistings-product">
              <img src="${item.images[0]}" alt="${item.title}" class="mylistings-img">
              <div class="mylistings-info">
                <span class="mylistings-title">${item.title}</span>
                <span class="mylistings-date">Listed on: ${formatDate(item.createdAt)}</span>
              </div>
            </div>
            
            <span class="mylistings-price">${formatCurrency(item.expectedPrice)}</span>

            <span class="mylistings-status-badge ${isSold ? 'badge-sold-pill' : 'badge-available'}">
              ${item.status}
            </span>

            <div class="mylistings-actions">
              <button class="btn btn-outline btn-sm toggle-status-btn" title="Toggle Available/Sold">
                <i class="bi ${isSold ? 'bi-check-circle' : 'bi-slash-circle'}"></i> 
                Mark as ${isSold ? 'Available' : 'Sold'}
              </button>
              <button class="btn btn-secondary btn-sm edit-btn"><i class="bi bi-pencil"></i> Edit</button>
              <button class="btn btn-text btn-sm delete-btn" style="color: var(--danger-color);"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        `;
      });

      listPanel.innerHTML = html;
      listPanel.classList.remove('hidden');
      loading.classList.add('hidden');

      // Bind actions events
      listPanel.querySelectorAll('.mylistings-row').forEach(row => {
        const id = row.dataset.id;
        const targetListing = this.listings.find(x => x._id === id);

        // Edit button
        row.querySelector('.edit-btn').addEventListener('click', () => {
          this.editingListingId = id;
          document.getElementById('listing-modal-title').textContent = 'Edit Classified Listing';
          document.getElementById('listing-submit-btn').textContent = 'Save Changes';

          // Populate fields
          document.getElementById('listing-form-title').value = targetListing.title;
          document.getElementById('listing-form-price').value = targetListing.expectedPrice;
          document.getElementById('listing-form-category').value = targetListing.category;
          document.getElementById('listing-form-condition').value = targetListing.condition;
          document.getElementById('listing-form-college').value = targetListing.college;
          document.getElementById('listing-form-email').value = targetListing.contactEmail;
          document.getElementById('listing-form-desc').value = targetListing.description;

          document.getElementById('listing-form-overlay').classList.remove('hidden');
        });

        // Toggle availability status
        row.querySelector('.toggle-status-btn').addEventListener('click', async () => {
          const nextStatus = targetListing.status === 'Available' ? 'Sold' : 'Available';
          try {
            const res = await API.put(`/listings/${id}/status`, { status: nextStatus });
            if (res.success) {
              showToast(`Item marked as ${nextStatus}!`, 'success');
              this.fetchUserListings();
            }
          } catch (err) {
            showToast(err.message || 'Status update failed', 'error');
          }
        });

        // Delete button
        row.querySelector('.delete-btn').addEventListener('click', async () => {
          if (confirm(`Are you sure you want to delete the listing "${targetListing.title}"?`)) {
            try {
              const res = await API.delete(`/listings/${id}`);
              if (res.success) {
                showToast('Listing deleted successfully', 'info');
                this.fetchUserListings();
              }
            } catch (err) {
              showToast(err.message || 'Deletion failed', 'error');
            }
          }
        });
      });

    } catch (error) {
      console.error(error);
      listPanel.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <h2 class="empty-state-title">Failed to load listings</h2>
          <p class="empty-state-text">Check connection to API.</p>
        </div>
      `;
      loading.classList.add('hidden');
    }
  }
};

// CSS spinner rotation injection
const style = document.styleSheets[0] || document.head.appendChild(document.createElement('style')).sheet;
try {
  style.insertRule(`
    .spin {
      animation: spin-rotate 1s linear infinite;
      display: inline-block;
    }
    @keyframes spin-rotate {
      to { transform: rotate(360deg); }
    }
  `, style.cssRules.length);
} catch (e) {
  // Silent catch
}

export default MyListingsView;

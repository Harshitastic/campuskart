/* ==========================================================================
   CampusKart Home View
   ========================================================================== */

import { API } from '../api.js';
import { cart } from '../app.js';
import { formatCurrency, getProductSkeletonHTML } from '../utils.js';

const HomeView = {
  /**
   * Render the HTML template for the Home page
   */
  async render() {
    return `
      <!-- Shop Categories Grid (Displayed Directly) -->
      <section class="container" style="margin-top: 24px;">
        <div class="home-section-title">
          <h2>Shop by Category</h2>
          <a href="#/shop" class="btn btn-text">View All <i class="bi bi-arrow-right"></i></a>
        </div>
        <div id="home-categories-container" class="categories-grid">
          <!-- Populated by Categories API -->
          <div class="skeleton" style="height: 120px; border-radius: 12px; grid-column: span 5;"></div>
        </div>
      </section>

      <!-- Featured Hot Deals / Best Sellers Section -->
      <section class="container">
        <div class="home-section-title">
          <h2>Deals of the Week</h2>
          <a href="#/shop" class="btn btn-text">Shop All <i class="bi bi-arrow-right"></i></a>
        </div>
        <div id="home-featured-container" class="products-grid">
          ${getProductSkeletonHTML(4)}
        </div>
      </section>

      <!-- Why CampusKart Value Props -->
      <section class="container" style="margin-bottom: 60px;">
        <div class="home-section-title" style="justify-content: center; margin-top: 80px;">
          <h2 style="text-align: center;">Why College Students Choose CampusKart</h2>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-box"><i class="bi bi-truck"></i></div>
            <h3 class="feature-title">Hostel Delivery</h3>
            <p class="feature-text">Fast door-step delivery to your hostel room. Free shipping on all orders over Rs. 499.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-box"><i class="bi bi-wallet2"></i></div>
            <h3 class="feature-title">Cash on Delivery</h3>
            <p class="feature-text">Pay only after receiving your drafting boards, books, or setups in-hand.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-box"><i class="bi bi-arrow-left-right"></i></div>
            <h3 class="feature-title">Direct Student exchange</h3>
            <p class="feature-text">Sell your used chair, bicycle, or engineering calculators directly to juniors. Zero commissions.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-box"><i class="bi bi-shield-check"></i></div>
            <h3 class="feature-title">College Verified</h3>
            <p class="feature-text">All sellers are students from verified campuses, reducing spam and ensuring safety.</p>
          </div>
        </div>
      </section>

      <!-- Premium Footer -->
      <footer>
        <div class="container footer-grid" style="grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px;">
          <div class="footer-logo-col">
            <a href="#/" class="logo-brand">
              <span class="logo-symbol">CK</span>
              <span class="logo-text">Campus<span class="text-accent">Kart</span></span>
            </a>
            <p class="footer-logo-desc">CampusKart is an exclusive platform managing books, stationery, hostel gears, and used listing directory for college campuses.</p>
          </div>
          <div>
            <h4 class="footer-heading">Shop Essentials</h4>
            <ul class="footer-links">
              <li><a href="#/shop" class="footer-link">All Products</a></li>
              <li><a href="#/shop?category=Calculators" class="footer-link">Calculators</a></li>
              <li><a href="#/shop?category=Engineering-Kits" class="footer-link">Drawing Kits</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-heading">Buy & Sell</h4>
            <ul class="footer-links">
              <li><a href="#/buy-sell" class="footer-link">Student Directory</a></li>
              <li><a href="#/my-listings" class="footer-link">List an Item</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-heading">Developer</h4>
            <ul class="footer-links">
              <li><a href="https://github.com/harshitastic" target="_blank" class="footer-link"><i class="bi bi-github"></i> GitHub Profile</a></li>
              <li><a href="#/contact" class="footer-link"><i class="bi bi-envelope"></i> Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div class="container footer-bottom">
          <span>&copy; 2026 CampusKart India. All student rights reserved.</span>
          <span>Made with ❤️ by <a href="https://github.com/harshitastic" target="_blank" style="color: var(--text-primary); font-weight: 600; text-decoration: underline;">harshitastic</a></span>
        </div>
      </footer>
    `;
  },

  /**
   * Run operations after injecting HTML (APIs fetching, event binding)
   */
  async afterRender() {
    try {
      // 1. Fetch Categories list
      const catData = await API.get('/categories');
      const catContainer = document.getElementById('home-categories-container');
      if (catContainer && catData.success) {
        let catHtml = '';
        // Show first 5 categories or all
        catData.categories.slice(0, 5).forEach(c => {
          catHtml += `
            <div class="category-card" data-slug="${c.slug}">
              <img src="${c.image}" alt="${c.name}" class="category-card-img">
              <span class="category-card-title">${c.name}</span>
            </div>
          `;
        });
        catContainer.innerHTML = catHtml;
        
        // Attach click listeners to categories
        catContainer.querySelectorAll('.category-card').forEach(card => {
          card.addEventListener('click', () => {
            window.location.hash = `#/shop?category=${card.dataset.slug}`;
          });
        });
      }
    } catch (err) {
      console.error('Fetch categories homepage error:', err);
    }

    try {
      // 2. Fetch Featured Products (Hot deals)
      const prodData = await API.get('/products?limit=4&sortBy=rating');
      const prodContainer = document.getElementById('home-featured-container');
      if (prodContainer && prodData.success) {
        let prodHtml = '';
        prodData.products.forEach(p => {
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
                  <button class="add-to-cart-btn" data-id="${p._id}" title="Quick Add to Cart">
                    <i class="bi bi-plus-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        prodContainer.innerHTML = prodHtml;

        // Image & Title click redirect to Details
        prodContainer.querySelectorAll('.product-card-img-box, .product-card-title').forEach(el => {
          el.addEventListener('click', (e) => {
            const id = el.dataset.id;
            window.location.hash = `#/product/${id}`;
          });
        });

        // Quick add to cart
        prodContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const targetProduct = prodData.products.find(p => p._id === id);
            if (targetProduct) {
              cart.add(targetProduct, 1);
            }
          });
        });
      }
    } catch (err) {
      console.error('Fetch featured products homepage error:', err);
    }

    // Bind newsletter submit
    document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Thank you for subscribing! Campus discount codes are on their way.', 'success');
      e.target.reset();
    });
  }
};

export default HomeView;

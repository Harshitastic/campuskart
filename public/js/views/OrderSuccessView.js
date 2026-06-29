/* ==========================================================================
   CampusKart Order Success View
   ========================================================================== */

import { API } from '../api.js';
import { formatCurrency, formatDate } from '../utils.js';

const OrderSuccessView = {
  /**
   * Render HTML structure
   */
  async render(request) {
    const orderId = request.queryParams.id;
    if (!orderId) {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-x-circle" style="color: var(--danger-color);"></i></div>
          <h2 class="empty-state-title">Order Context Missing</h2>
          <p class="empty-state-text">No order reference parameters were detected. Return to shop.</p>
          <a href="#/shop" class="btn btn-primary">Go to Shop</a>
        </div>
      `;
    }

    return `
      <div class="container" style="max-width: 650px; margin-top: 40px;">
        <div id="success-loading">
          <div class="full-screen-loader">
            <div class="loader-spinner"></div>
            <p class="loader-message">Fetching order summary...</p>
          </div>
        </div>

        <div id="success-content" class="checkout-block hidden" style="text-align: center; padding: 48px 32px;">
          <!-- Big Check icon -->
          <div style="font-size: 56px; color: var(--success-color); margin-bottom: 20px;">
            <i class="bi bi-patch-check-fill"></i>
          </div>

          <h1 style="font-size: 28px; margin-bottom: 8px;">Thank You for Your Order!</h1>
          <p style="color: var(--text-secondary); margin-bottom: 30px;">Your purchase request has been processed successfully.</p>
          
          <!-- Summary Details -->
          <div style="background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px; text-align: left; margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
              <span style="font-weight: 700;">Invoice Number</span>
              <span id="success-invoice" style="font-family: monospace; font-weight: 600; color: var(--accent-color);"></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: var(--text-secondary);">Estimated Delivery</span>
              <span id="success-delivery-date" style="font-weight: 700; color: var(--success-color);"></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: var(--text-secondary);">Payment Method</span>
              <span id="success-payment-method" style="font-weight: 600;"></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: var(--text-secondary);">Grand Total</span>
              <span id="success-grand-total" style="font-weight: 800;"></span>
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 4px;">
              <div style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">Shipping Address</div>
              <div id="success-shipping-address" style="color: var(--text-secondary); font-size: 13px; line-height: 1.4;"></div>
            </div>
          </div>

          <!-- Buttons -->
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="#/profile?tab=orders" class="btn btn-primary">Track My Orders</a>
            <a href="#/shop" class="btn btn-outline">Continue Shopping</a>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Bind components
   */
  async afterRender(request) {
    const orderId = request.queryParams.id;
    if (!orderId) return;

    try {
      const data = await API.get(`/orders/${orderId}`);
      if (!data.success) throw new Error('Order not found');

      const { order } = data;

      document.getElementById('success-invoice').textContent = order.invoiceNumber;
      
      // Calculate delivery: 3 days from checkout date
      const orderDate = new Date(order.createdAt);
      orderDate.setDate(orderDate.getDate() + 3);
      document.getElementById('success-delivery-date').textContent = formatDate(orderDate);
      
      document.getElementById('success-payment-method').textContent = `${order.paymentMethod} (${order.paymentStatus})`;
      document.getElementById('success-grand-total').textContent = formatCurrency(order.grandTotal);
      
      const addr = order.shippingAddress;
      document.getElementById('success-shipping-address').textContent = 
        `${addr.name} | Phone: ${addr.phone}\n${addr.address}, ${addr.city}, ${addr.state} - ${addr.pinCode}`;

      // Toggle panels
      document.getElementById('success-loading').classList.add('hidden');
      document.getElementById('success-content').classList.remove('hidden');

    } catch (err) {
      console.error(err);
      document.getElementById('app').innerHTML = `
        <div class="container empty-state">
          <div class="empty-state-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <h2 class="empty-state-title">Order Not Found</h2>
          <p class="empty-state-text">Failed to fetch order summary details from database.</p>
          <a href="#/" class="btn btn-secondary">Go Home</a>
        </div>
      `;
    }
  }
};

export default OrderSuccessView;

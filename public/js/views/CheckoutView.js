/* ==========================================================================
   CampusKart Checkout View
   ========================================================================== */

import { API } from '../api.js';
import { state, cart, syncUserAuth } from '../app.js';
import { formatCurrency, showToast } from '../utils.js';

const CheckoutView = {
  selectedAddressId: null,
  selectedPaymentMethod: 'COD',

  /**
   * Render HTML structure
   */
  async render() {
    if (!state.user) {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-lock"></i></div>
          <h2 class="empty-state-title">Login Required</h2>
          <p class="empty-state-text">You must be logged in as a student to proceed with e-commerce checkouts.</p>
          <a href="#/auth?mode=login&redirect=checkout" class="btn btn-primary">Login Now</a>
        </div>
      `;
    }

    if (state.cart.length === 0) {
      return `
        <div class="container empty-state" style="margin-top: 60px;">
          <div class="empty-state-icon"><i class="bi bi-cart"></i></div>
          <h2 class="empty-state-title">Shopping Cart is Empty</h2>
          <p class="empty-state-text">Add products to your cart before proceeding to checkout.</p>
          <a href="#/shop" class="btn btn-primary">Browse Shop</a>
        </div>
      `;
    }

    // Default to the user's default saved address if available
    const defaultAddr = state.user.addresses?.find(a => a.isDefault) || state.user.addresses?.[0];
    this.selectedAddressId = defaultAddr ? defaultAddr._id : null;

    return `
      <div class="container">
        <!-- Header Title -->
        <div style="margin-bottom: 30px;">
          <span style="font-size: 13px; color: var(--text-tertiary);">
            <a href="#/" style="color: var(--text-tertiary);">Home</a> &nbsp;/&nbsp; Checkout
          </span>
          <h1 style="font-size: 32px; margin-top: 4px;">Completing Your Order</h1>
        </div>

        <div class="checkout-layout">
          <!-- Left: Address & Payment Columns -->
          <div>
            <!-- Shipping Address selection -->
            <div class="checkout-block">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <h3 style="font-size: 18px; font-weight: 700; margin: 0;">1. Delivery Address</h3>
                <button id="add-checkout-address-btn" class="btn btn-secondary btn-sm"><i class="bi bi-plus-lg"></i> Add Address</button>
              </div>

              <div id="checkout-addresses-picker" class="address-picker-grid">
                <!-- Rendered dynamically -->
              </div>
            </div>

            <!-- Payment Method selection -->
            <div class="checkout-block">
              <h3 class="checkout-block-title">2. Payment Method</h3>
              <div class="payment-method-row">
                <div class="payment-method-option selected" data-method="COD">
                  <input type="radio" name="payment-opt" id="pay-cod" value="COD" checked>
                  <label for="pay-cod" class="payment-option-details" style="cursor: pointer;">
                    <span class="payment-option-title"><i class="bi bi-cash-stack"></i> Cash on Delivery (COD)</span>
                    <span class="payment-option-desc">Pay cash or scan UPI at your hostel room door.</span>
                  </label>
                </div>
                <div class="payment-method-option" data-method="Razorpay">
                  <input type="radio" name="payment-opt" id="pay-rzp" value="Razorpay">
                  <label for="pay-rzp" class="payment-option-details" style="cursor: pointer;">
                    <span class="payment-option-title"><i class="bi bi-credit-card"></i> Pay Securely via Razorpay</span>
                    <span class="payment-option-desc">Pay using Cards, NetBanking, UPI, or Wallets instantly.</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Summary Sidebar -->
          <aside class="checkout-sidebar">
            <div class="checkout-summary-box">
              <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                Order Summary
              </h3>
              
              <!-- Mini Cart Items list -->
              <div id="checkout-summary-items" class="checkout-items-list">
                <!-- Populated dynamically -->
              </div>

              <!-- Prices summary details -->
              <div class="price-summary-container">
                <div class="price-summary-row">
                  <span>Subtotal</span>
                  <span id="checkout-sum-subtotal">Rs. 0</span>
                </div>
                <div id="checkout-sum-discount-row" class="price-summary-row discount-row hidden">
                  <span>Coupon Discount</span>
                  <span id="checkout-sum-discount">-Rs. 0</span>
                </div>
                <div class="price-summary-row">
                  <span>Shipping Cost</span>
                  <span id="checkout-sum-shipping">Rs. 0</span>
                </div>
                <hr class="price-summary-divider">
                <div class="price-summary-row grand-total-row">
                  <span>Grand Total</span>
                  <span id="checkout-sum-total">Rs. 0</span>
                </div>
              </div>

              <button id="checkout-place-order-btn" class="btn btn-primary btn-block" style="margin-top: 24px;">
                <i class="bi bi-shield-lock"></i> Place Order (COD)
              </button>
            </div>
          </aside>
        </div>
      </div>

      <!-- Add Address Modal -->
      <div id="checkout-addr-modal" class="modal-overlay hidden">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Add New Shipping Address</h3>
            <button id="checkout-addr-close" class="close-btn"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <form id="checkout-addr-form" class="review-form-container">
              <div class="form-group">
                <label>Receiver Name</label>
                <input type="text" id="addr-form-name" class="form-control" placeholder="Rahul Sharma" required>
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input type="tel" id="addr-form-phone" class="form-control" placeholder="9988776655" required>
              </div>
              <div class="form-group">
                <label>Address Details (Hostel, Room Number, Block)</label>
                <input type="text" id="addr-form-address" class="form-control" placeholder="Room 104, Hostel A, BITS Pilani" required>
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" id="addr-form-city" class="form-control" placeholder="Pilani" required>
              </div>
              <div class="form-group">
                <label>State</label>
                <input type="text" id="addr-form-state" class="form-control" placeholder="Rajasthan" required>
              </div>
              <div class="form-group">
                <label>PIN Code</label>
                <input type="text" id="addr-form-pincode" class="form-control" placeholder="333031" required>
              </div>
              <div class="form-group" style="display: flex; gap: 8px; align-items: center;">
                <input type="checkbox" id="addr-form-default" style="width: 16px; height: 16px;">
                <label for="addr-form-default" style="margin-bottom: 0; cursor: pointer;">Set as default address</label>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Save Address</button>
            </form>
          </div>
        </div>
      </div>

      <!-- Razorpay Mock Modal Dialog -->
      <div id="rzp-mock-modal" class="modal-overlay hidden">
        <div class="modal-box" style="max-width: 440px; text-align: center; border-top: 5px solid var(--accent-color);">
          <div class="modal-body" style="padding: 32px 24px;">
            <div style="font-size: 40px; color: var(--accent-color); margin-bottom: 16px;">
              <i class="bi bi-wallet-fill animate-pulse"></i>
            </div>
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Razorpay Gateway Simulator</h3>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 24px;">
              Razorpay API keys are blank. We are running in payment simulation sandbox mode.
            </p>
            
            <div style="background-color: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: left; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 600;">Amount:</span>
                <span id="rzp-mock-total" style="font-weight: 700; color: var(--accent-color);"></span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">Recipient:</span>
                <span>CampusKart India</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button id="rzp-mock-success-btn" class="btn btn-primary btn-block">
                <i class="bi bi-check-lg"></i> Simulate Successful Payment
              </button>
              <button id="rzp-mock-fail-btn" class="btn btn-outline btn-block" style="color: var(--danger-color); border-color: var(--danger-color);">
                <i class="bi bi-x-lg"></i> Simulate Failed Payment
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
  async afterRender() {
    if (!state.user || state.cart.length === 0) return;

    this.renderAddresses();
    this.renderSummary();

    // Toggle Payment Methods selection visually
    const options = document.querySelectorAll('.payment-method-option');
    const placeOrderBtn = document.getElementById('checkout-place-order-btn');

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        options.forEach(o => {
          o.classList.remove('selected');
          o.querySelector('input').checked = false;
        });
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
        this.selectedPaymentMethod = opt.dataset.method;

        if (this.selectedPaymentMethod === 'COD') {
          placeOrderBtn.innerHTML = '<i class="bi bi-shield-lock"></i> Place Order (COD)';
        } else {
          placeOrderBtn.innerHTML = '<i class="bi bi-credit-card"></i> Pay Securely via Razorpay';
        }
      });
    });

    // Add Address Modal listeners
    const modal = document.getElementById('checkout-addr-modal');
    const closeBtn = document.getElementById('checkout-addr-close');
    const openBtn = document.getElementById('add-checkout-address-btn');
    const form = document.getElementById('checkout-addr-form');

    openBtn.addEventListener('click', () => {
      form.reset();
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('addr-form-name').value.trim();
        const phone = document.getElementById('addr-form-phone').value.trim();
        const address = document.getElementById('addr-form-address').value.trim();
        const city = document.getElementById('addr-form-city').value.trim();
        const stateVal = document.getElementById('addr-form-state').value.trim();
        const pinCode = document.getElementById('addr-form-pincode').value.trim();
        const isDefault = document.getElementById('addr-form-default').checked;

        const data = await API.post('/auth/addresses', {
          name, phone, address, city, state: stateVal, pinCode, isDefault
        });

        if (data.success) {
          showToast('Address saved successfully!', 'success');
          modal.classList.add('hidden');
          
          // Re-sync user session auth
          await syncUserAuth();
          
          // Render updated picker
          this.renderAddresses();
        }
      } catch (err) {
        showToast(err.message || 'Failed to save address', 'error');
      }
    });

    // Place Order Form submit trigger
    placeOrderBtn.addEventListener('click', () => {
      this.handlePlaceOrder();
    });
  },

  /**
   * Render addresses checkboxes selection
   */
  renderAddresses() {
    const container = document.getElementById('checkout-addresses-picker');
    if (!container) return;

    if (!state.user.addresses || state.user.addresses.length === 0) {
      container.innerHTML = `
        <div style="grid-column: span 2; text-align: center; padding: 20px; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 12px;">No shipping addresses saved on your profile.</p>
          <button id="add-checkout-first-address" class="btn btn-secondary btn-sm">Add Your First Address</button>
        </div>
      `;
      document.getElementById('checkout-place-order-btn').disabled = true;

      document.getElementById('add-checkout-first-address').addEventListener('click', () => {
        document.getElementById('add-checkout-address-btn').click();
      });
      return;
    }

    document.getElementById('checkout-place-order-btn').disabled = false;

    let html = '';
    state.user.addresses.forEach(addr => {
      const isSelected = this.selectedAddressId === addr._id;
      html += `
        <div class="address-picker-card ${isSelected ? 'selected' : ''}" data-id="${addr._id}">
          <div class="address-picker-name">${addr.name}</div>
          <div class="address-picker-text">${addr.address}, ${addr.city}, ${addr.state} - ${addr.pinCode}</div>
          <div class="address-picker-phone"><i class="bi bi-telephone"></i> ${addr.phone}</div>
          ${addr.isDefault ? '<span style="font-size: 9px; font-weight: 700; background-color: var(--accent-color); color: white; padding: 2px 6px; border-radius: 4px; position: absolute; top: 12px; right: 12px;">DEFAULT</span>' : ''}
        </div>
      `;
    });

    container.innerHTML = html;

    // Click cards selection triggers
    container.querySelectorAll('.address-picker-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.address-picker-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedAddressId = card.dataset.id;
      });
    });
  },

  /**
   * Render shopping summary list in right side bar
   */
  renderSummary() {
    const list = document.getElementById('checkout-summary-items');
    if (!list) return;

    let itemsHtml = '';
    state.cart.forEach(item => {
      itemsHtml += `
        <div class="checkout-item-mini">
          <img src="${item.image}" alt="${item.name}">
          <div class="checkout-item-mini-info">
            <div class="checkout-item-mini-title">${item.name}</div>
            <div class="checkout-item-mini-qty">Qty: ${item.quantity}</div>
          </div>
          <div class="checkout-item-mini-price">${formatCurrency(item.price * item.quantity)}</div>
        </div>
      `;
    });
    list.innerHTML = itemsHtml;

    // Load price breakdowns
    const { subtotal, discount, shippingCharges, total } = cart.getTotals();
    document.getElementById('checkout-sum-subtotal').textContent = formatCurrency(subtotal);
    
    const discountRow = document.getElementById('checkout-sum-discount-row');
    if (state.appliedCoupon) {
      discountRow.classList.remove('hidden');
      document.getElementById('checkout-sum-discount').textContent = `-${formatCurrency(discount)}`;
    } else {
      discountRow.classList.add('hidden');
    }

    document.getElementById('checkout-sum-shipping').textContent = shippingCharges === 0 ? 'FREE' : formatCurrency(shippingCharges);
    document.getElementById('checkout-sum-total').textContent = formatCurrency(total);
  },

  /**
   * Final Order Placement execution handler
   */
  async handlePlaceOrder() {
    if (!this.selectedAddressId) {
      showToast('Please select a shipping delivery address', 'warning');
      return;
    }

    const placeBtn = document.getElementById('checkout-place-order-btn');
    placeBtn.disabled = true;

    // Retrieve active address details
    const selectedAddress = state.user.addresses.find(a => a._id === this.selectedAddressId);

    const payload = {
      items: state.cart,
      shippingAddress: {
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pinCode: selectedAddress.pinCode
      },
      paymentMethod: this.selectedPaymentMethod,
      couponCode: state.appliedCoupon ? state.appliedCoupon.code : null
    };

    try {
      const res = await API.post('/orders', payload);
      
      if (res.success) {
        if (this.selectedPaymentMethod === 'COD') {
          // COD succeeds immediately
          cart.clear();
          showToast('Order placed successfully!', 'success');
          window.location.hash = `#/order-success?id=${res.order._id}`;
        } else {
          // Razorpay payments routing
          if (res.isMockMode) {
            // Open mock simulator modal
            this.openMockPaymentGateway(res.order, res.order.grandTotal);
          } else {
            // Open official Razorpay window
            this.openRazorpayGateway(res.order, res.razorpayKeyId, res.razorpayOrderId);
          }
        }
      }
    } catch (err) {
      showToast(err.message || 'Fulfillment request failed', 'error');
      placeBtn.disabled = false;
    }
  },

  /**
   * Trigger Official Razorpay Overlay Popup
   */
  openRazorpayGateway(order, keyId, razorpayOrderId) {
    const selectedAddress = state.user.addresses.find(a => a._id === this.selectedAddressId);
    
    const options = {
      key: keyId,
      amount: order.grandTotal * 100, // in Paise
      currency: 'INR',
      name: 'CampusKart',
      description: 'Hostel Essentials Checkout',
      order_id: razorpayOrderId,
      handler: async (response) => {
        try {
          const verifyData = await API.post('/orders/verify', {
            orderId: order._id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
          
          if (verifyData.success) {
            cart.clear();
            showToast('Payment verified successfully!', 'success');
            window.location.hash = `#/order-success?id=${order._id}`;
          }
        } catch (err) {
          showToast(err.message || 'Payment verification failed', 'error');
          document.getElementById('checkout-place-order-btn').disabled = false;
        }
      },
      prefill: {
        name: state.user.name,
        email: state.user.email,
        contact: selectedAddress.phone
      },
      theme: {
        color: '#4f46e5'
      },
      modal: {
        ondismiss: () => {
          showToast('Payment window cancelled by user', 'info');
          document.getElementById('checkout-place-order-btn').disabled = false;
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  },

  /**
   * Render custom Mock payment overlay dialog
   */
  openMockPaymentGateway(order, totalValue) {
    const mockModal = document.getElementById('rzp-mock-modal');
    document.getElementById('rzp-mock-total').textContent = formatCurrency(totalValue);
    
    mockModal.classList.remove('hidden');

    const successBtn = document.getElementById('rzp-mock-success-btn');
    const failBtn = document.getElementById('rzp-mock-fail-btn');

    const cleanModal = () => {
      mockModal.classList.add('hidden');
      document.getElementById('checkout-place-order-btn').disabled = false;
    };

    // Simulate Success
    successBtn.onclick = async () => {
      successBtn.disabled = true;
      successBtn.textContent = 'Processing...';
      try {
        const verifyData = await API.post('/orders/verify', {
          orderId: order._id,
          razorpayPaymentId: `pay_mock_${Math.random().toString(36).slice(2, 10)}`,
          razorpaySignature: 'signature_mock'
        });
        
        if (verifyData.success) {
          cart.clear();
          showToast('Simulated Payment Success!', 'success');
          mockModal.classList.add('hidden');
          window.location.hash = `#/order-success?id=${order._id}`;
        }
      } catch (err) {
        showToast('Verification of mock payment failed', 'error');
        cleanModal();
      } finally {
        successBtn.disabled = false;
        successBtn.textContent = 'Simulate Successful Payment';
      }
    };

    // Simulate Failure
    failBtn.onclick = () => {
      showToast('Payment simulation cancelled / failed.', 'error');
      cleanModal();
    };
  }
};

export default CheckoutView;

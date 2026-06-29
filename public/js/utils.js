/* ==========================================================================
   CampusKart UI Utilities & Shared Helpers
   ========================================================================== */

/**
 * Display a premium toast notification
 * @param {string} message Text content to display
 * @param {string} type Notification style: 'success' | 'error' | 'warning' | 'info'
 */
export const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'bi-info-circle';
  if (type === 'success') iconClass = 'bi-check-circle';
  else if (type === 'error') iconClass = 'bi-exclamation-triangle';
  else if (type === 'warning') iconClass = 'bi-exclamation-circle';

  toast.innerHTML = `
    <div class="toast-icon"><i class="bi ${iconClass}"></i></div>
    <div class="toast-content">${message}</div>
    <div class="toast-bar"></div>
  `;

  container.appendChild(toast);

  // Automatically fade out and remove the toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.35s ease forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
};

// CSS Keyframes injection dynamically for toast-out
const styleSheet = document.styleSheets[0] || document.head.appendChild(document.createElement('style')).sheet;
try {
  styleSheet.insertRule(`
    @keyframes toast-out {
      to {
        transform: translateY(-20px);
        opacity: 0;
      }
    }
  `, styleSheet.cssRules.length);
} catch (e) {
  // Silent catch if styleSheet is not immediately ready
}

/**
 * Format a number to Indian Rupee (INR) currency display
 * @param {number} value The number to format
 * @returns {string} Formatted price
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'Rs. 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value).replace('INR', 'Rs.');
};

/**
 * Format date string to clean, user-friendly presentation
 * @param {string|Date} dateStr The raw date string
 * @returns {string} Formatted date (e.g. 29 Jun 2026)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Generate product card skeleton HTML template
 * @param {number} count Number of skeletons to output
 * @returns {string} HTML string
 */
export const getProductSkeletonHTML = (count = 3) => {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-card-img skeleton"></div>
        <div class="skeleton-card-title skeleton"></div>
        <div class="skeleton-card-text skeleton"></div>
        <div class="skeleton-card-price skeleton"></div>
      </div>
    `;
  }
  return html;
};

/**
 * Generate table row skeleton HTML template
 * @param {number} rows Number of rows
 * @param {number} cols Number of columns
 * @returns {string} HTML string
 */
export const getTableSkeletonHTML = (rows = 5, cols = 4) => {
  let headerHtml = '';
  for (let c = 0; c < cols; c++) {
    headerHtml += `<th class="skeleton" style="height: 20px; width: ${100 / cols}%"></th>`;
  }

  let bodyHtml = '';
  for (let r = 0; r < rows; r++) {
    bodyHtml += '<tr>';
    for (let c = 0; c < cols; c++) {
      bodyHtml += `<td><div class="skeleton" style="height: 16px; width: ${60 + Math.random() * 30}%"></div></td>`;
    }
    bodyHtml += '</tr>';
  }

  return `
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>
          ${bodyHtml}
        </tbody>
      </table>
    </div>
  `;
};

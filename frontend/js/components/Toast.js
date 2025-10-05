// frontend/js/components/Toast.js

export class Toast {
  static container = null;
  static toasts = new Map();
  static counter = 0;

  static init(options) {
    Toast.container = options.container || document.getElementById("toasts");
  }

  static show(message, type = "info", duration = 3000) {
    if (!Toast.container) {
      Toast.container = document.getElementById("toasts");
      if (!Toast.container) {
        console.warn("Toast container not found");
        return;
      }
    }

    const id = ++Toast.counter;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.dataset.toastId = id;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" data-toast-id="${id}" aria-label="Close notification">✕</button>
    `;

    Toast.container.appendChild(toast);
    Toast.toasts.set(id, toast);

    // Bind close button
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => Toast.remove(id));

    // Auto-remove with cleanup
    const timeoutId = setTimeout(() => Toast.remove(id), duration);
    toast.dataset.timeoutId = timeoutId;

    return id;
  }

  static remove(id) {
    const toast = Toast.toasts.get(id);
    if (!toast) return;

    // Clear timeout if exists
    if (toast.dataset.timeoutId) {
      clearTimeout(parseInt(toast.dataset.timeoutId));
    }

    // Fade out animation
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";

    setTimeout(() => {
      toast.remove();
      Toast.toasts.delete(id);
    }, 300);
  }

  static clear() {
    Toast.toasts.forEach((toast, id) => Toast.remove(id));
  }
}

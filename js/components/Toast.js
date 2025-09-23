// frontend/js/components/Toast.js

export class Toast {
  static container = null;
  static toasts = new Map();
  static counter = 0;

  static init(options) {
    Toast.container = options.container;
  }

  static show(message, type = "info", duration = 3000) {
    if (!Toast.container) {
      console.warn("Toast container not initialized");
      return;
    }

    const id = ++Toast.counter;
    const toast = document.createElement("div");
    toast.className = `toast ${type} slide-in`;
    toast.dataset.toastId = id;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" data-toast-id="${id}">✕</button>
        `;

    Toast.container.appendChild(toast);
    Toast.toasts.set(id, toast);

    // Bind close button
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => Toast.remove(id));

    // Auto-remove
    setTimeout(() => Toast.remove(id), duration);

    return id;
  }

  static remove(id) {
    const toast = Toast.toasts.get(id);
    if (!toast) return;

    toast.style.animation = "slide-out 250ms ease-in-out";
    setTimeout(() => {
      toast.remove();
      Toast.toasts.delete(id);
    }, 250);
  }

  static clear() {
    Toast.toasts.forEach((toast, id) => Toast.remove(id));
  }
}

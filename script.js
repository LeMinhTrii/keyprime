const header = document.getElementById("siteHeader");
const topProgress = document.getElementById("topProgress");
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");
const copyQuote = document.getElementById("copyQuote");
const toast = document.getElementById("toast");

const qtyWin10 = document.getElementById("qtyWin10");
const qtyWin11 = document.getElementById("qtyWin11");
const qtyOffice = document.getElementById("qtyOffice");
const summaryList = document.getElementById("summaryList");
const grandTotal = document.getElementById("grandTotal");

function formatVND(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-show");

  setTimeout(() => {
    toast.classList.remove("is-show");
  }, 2200);
}

/* Header scroll progress */
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (topProgress) {
    topProgress.style.width = percent + "%";
  }

  if (header) {
    header.classList.toggle("is-scrolled", scrollTop > 10);
  }
});

/* Mobile menu */
if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");

    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* FAQ */
document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const content = item.querySelector(".faq-content");

    if (!item || !content) return;

    const isOpen = item.classList.toggle("is-open");
    content.style.maxHeight = isOpen ? content.scrollHeight + "px" : 0;
  });
});

/* Calculator nhiều sản phẩm */
const multiPricing = {
  win10: {
    name: "Windows 10 Retail Vĩnh Viễn",
    under10: 899000,
    over10: 799000,
    suffix: "/key",
    input: qtyWin10,
  },
  win11: {
    name: "Windows 11 Retail Vĩnh Viễn",
    under10: 899000,
    over10: 799000,
    suffix: "/key",
    input: qtyWin11,
  },
  office: {
    name: "Microsoft 365 E5 Developer",
    under10: 599000,
    over10: 499000,
    suffix: "/năm",
    input: qtyOffice,
  },
};

function getMultiQuote() {
  const items = Object.values(multiPricing)
    .map((item) => {
      const qty = Math.max(0, Number(item.input?.value || 0));
      const unit = qty >= 10 ? item.over10 : item.under10;
      const total = qty * unit;

      return {
        name: item.name,
        qty,
        unit,
        total,
        suffix: item.suffix,
      };
    })
    .filter((item) => item.qty > 0);

  const totalAll = items.reduce((sum, item) => sum + item.total, 0);

  return {
    items,
    totalAll,
  };
}

function updateMultiQuote() {
  if (!summaryList || !grandTotal) return;

  const quote = getMultiQuote();

  if (!quote.items.length) {
    summaryList.innerHTML = `
      <p class="empty-summary">Chưa nhập số lượng sản phẩm.</p>
    `;
    grandTotal.textContent = formatVND(0);
    return;
  }

  summaryList.innerHTML = quote.items
    .map(
      (item) => `
        <div class="summary-item">
          <div>
            <strong>${item.name}</strong>
            <span>${item.qty} key × ${formatVND(item.unit)}${item.suffix}</span>
          </div>
          <b>${formatVND(item.total)}</b>
        </div>
      `,
    )
    .join("");

  grandTotal.textContent = formatVND(quote.totalAll);
}

[qtyWin10, qtyWin11, qtyOffice].forEach((input) => {
  if (input) {
    input.addEventListener("input", updateMultiQuote);
  }
});

/* Copy báo giá */
if (copyQuote) {
  copyQuote.addEventListener("click", async () => {
    const quote = getMultiQuote();

    if (!quote.items.length) {
      showToast("Vui lòng nhập số lượng sản phẩm");
      return;
    }

    const detailText = quote.items
      .map((item) => {
        return `${item.name}: ${item.qty} key × ${formatVND(item.unit)}${item.suffix} = ${formatVND(item.total)}`;
      })
      .join("\n");

    const text = `Báo giá dự kiến:\n${detailText}\nTổng cộng: ${formatVND(
      quote.totalAll,
    )}\nCó hỗ trợ xuất hóa đơn và tư vấn kích hoạt.`;

    try {
      await navigator.clipboard.writeText(text);
      showToast("Đã copy báo giá");
    } catch (error) {
      showToast("Trình duyệt chưa cho phép copy");
    }
  });
}

/* Year */
const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

updateMultiQuote();

// form submission with Google Sheets API

const handleSubmitForm = () => {
  const form = document.getElementById("licenseLeadForm");
  const formMessage = document.getElementById("licenseFormMessage");

  const GOOGLE_SHEET_API =
    "https://script.google.com/macros/s/AKfycbwPSP-7AqkZJzWYM3KygG-WM8A0WcCUG8m9Vr-CFO9xe3BpbPer555AqbEsZl5ssuWFNg/exec";

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const oldText = submitBtn.textContent;

    const data = {
      customer_name: form.querySelector('[name="customer_name"]').value.trim(),
      customer_phone: form
        .querySelector('[name="customer_phone"]')
        .value.trim(),
      product_need: form.querySelector('[name="product_need"]').value,
      expected_quantity: form.querySelector('[name="expected_quantity"]').value,
      customer_note: form.querySelector('[name="customer_note"]').value.trim(),
    };

    console.log("DATA GỬI ĐI:", data);

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Đang gửi...";

      await fetch(GOOGLE_SHEET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(data),
      });

      formMessage.textContent =
        "Gửi thông tin thành công. Chúng tôi sẽ liên hệ sớm.";
      formMessage.className = "form-message success";

      form.reset();
    } catch (error) {
      console.error("Lỗi gửi form:", error);

      formMessage.textContent = "Không gửi được thông tin. Vui lòng thử lại.";
      formMessage.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText;
    }
  });
};

// document.addEventListener("DOMContentLoaded", handleSubmitForm);

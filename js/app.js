/**
 * Delivery Label & Order Management Application Logic
 */

// Application State
const state = {
    orders: [],
    settings: { ...DEFAULT_SETTINGS },
    selectedOrderIds: new Set(),
    activeOrderId: null,
    searchQuery: "",
    statusFilter: "ALL",
    shipperFilter: "ALL",
    currentTab: "label", // "label", "telegram", "a4"
    zoomLevel: 1.0
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    loadState();
    setupEventListeners();
    renderStats();
    renderTable();
    if (state.orders.length > 0) {
        selectOrder(state.orders[0].id);
    }
});

// Load state from localStorage or default sample
function loadState() {
    try {
        const savedOrders = localStorage.getItem("acc_delivery_orders");
        if (savedOrders) {
            state.orders = JSON.parse(savedOrders);
        } else {
            state.orders = [...INITIAL_ORDERS];
            saveOrders();
        }

        const savedSettings = localStorage.getItem("acc_delivery_settings");
        if (savedSettings) {
            state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
    } catch (e) {
        console.error("Failed to load state", e);
        state.orders = [...INITIAL_ORDERS];
    }
}

function saveOrders() {
    try {
        localStorage.setItem("acc_delivery_orders", JSON.stringify(state.orders));
    } catch (e) {
        console.error("Failed to save orders", e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem("acc_delivery_settings", JSON.stringify(state.settings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
}

// Generate unique ID like F38BA5
function generateOrderId() {
    const chars = "ABCDEF0123456789";
    let id = "";
    for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// Get Active Order
function getActiveOrder() {
    return state.orders.find(o => o.id === state.activeOrderId) || state.orders[0] || null;
}

// Render Stats Bar
function renderStats() {
    const totalCount = state.orders.length;
    const totalRev = state.orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    const paidCount = state.orders.filter(o => (o.paymentStatus || "").toUpperCase() === "PAID").length;
    const codCount = state.orders.filter(o => (o.paymentStatus || "").toUpperCase() === "COD").length;

    const elTotal = document.getElementById("stat-total-orders");
    const elRev = document.getElementById("stat-total-revenue");
    const elPaid = document.getElementById("stat-paid-count");
    const elCod = document.getElementById("stat-cod-count");

    if (elTotal) elTotal.textContent = totalCount;
    if (elRev) elRev.textContent = `$${totalRev.toFixed(2)}`;
    if (elPaid) elPaid.textContent = paidCount;
    if (elCod) elCod.textContent = codCount;
}

// Filter Orders
function getFilteredOrders() {
    return state.orders.filter(order => {
        // Status filter
        if (state.statusFilter !== "ALL" && (order.paymentStatus || "").toUpperCase() !== state.statusFilter) {
            return false;
        }
        // Shipper filter
        if (state.shipperFilter !== "ALL" && !order.shipper.includes(state.shipperFilter)) {
            return false;
        }
        // Search query
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            const matchName = (order.customerName || "").toLowerCase().includes(q);
            const matchPhone = (order.phone || "").toLowerCase().includes(q);
            const matchId = (order.id || "").toLowerCase().includes(q);
            const matchLoc = (order.location || "").toLowerCase().includes(q);
            const matchAddr = (order.address || "").toLowerCase().includes(q);
            const matchProd = (order.products || "").toLowerCase().includes(q);
            return matchName || matchPhone || matchId || matchLoc || matchAddr || matchProd;
        }
        return true;
    });
}

// Render Orders Table
function renderTable() {
    const tbody = document.getElementById("orders-tbody");
    const emptyState = document.getElementById("table-empty-state");
    const countBadge = document.getElementById("table-count-badge");
    const selectAllCheckbox = document.getElementById("select-all-checkbox");

    if (!tbody) return;

    const filtered = getFilteredOrders();
    if (countBadge) countBadge.textContent = `${filtered.length} Orders`;

    if (filtered.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.style.display = "block";
        return;
    }

    if (emptyState) emptyState.style.display = "none";

    let html = "";
    filtered.forEach(order => {
        const isSelected = state.selectedOrderIds.has(order.id);
        const isActive = order.id === state.activeOrderId;
        const statusClass = (order.paymentStatus || "PAID").toLowerCase();

        html += `
            <tr class="${isActive ? 'active-row' : ''}" data-id="${order.id}">
                <td onclick="event.stopPropagation()">
                    <input type="checkbox" class="row-checkbox" data-id="${order.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td class="order-id-cell">#${escapeHtml(order.id)}</td>
                <td class="customer-cell">
                    <span class="name">${escapeHtml(order.customerName)}</span>
                    <span class="phone">${escapeHtml(order.phone)}</span>
                </td>
                <td class="address-cell">
                    <span class="loc-tag">${escapeHtml(order.location || '')}</span>
                    <span>${escapeHtml(order.address || '')}</span>
                </td>
                <td class="products-cell" title="${escapeHtml(order.products || '')}">
                    ${escapeHtml(order.products || '-')}
                </td>
                <td class="amount-cell">
                    $${parseFloat(order.totalAmount || 0).toFixed(2)}
                </td>
                <td>
                    <span class="status-chip ${statusClass}">
                        ${order.paymentStatus === 'PAID' ? '✓ ' : ''}${escapeHtml(order.paymentStatus || 'PAID')}
                    </span>
                </td>
                <td>
                    <span class="shipper-chip">${escapeHtml(order.shipper || '-')}</span>
                </td>
                <td class="row-actions" onclick="event.stopPropagation()">
                    <button class="row-btn" title="បោះពុម្ព Label" onclick="printSingleOrder('${order.id}')">
                        🖨️
                    </button>
                    <button class="row-btn" title="កែប្រែ (Edit)" onclick="openEditModal('${order.id}')">
                        ✏️
                    </button>
                    <button class="row-btn" title="ចម្លង (Duplicate)" onclick="duplicateOrder('${order.id}')">
                        📄
                    </button>
                    <button class="row-btn delete" title="លុប (Delete)" onclick="deleteOrder('${order.id}')">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Check if all are selected
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = filtered.length > 0 && filtered.every(o => state.selectedOrderIds.has(o.id));
    }

    // Attach row click listeners
    tbody.querySelectorAll("tr").forEach(tr => {
        tr.addEventListener("click", () => {
            const id = tr.getAttribute("data-id");
            selectOrder(id);
        });
    });

    // Attach checkbox listeners
    tbody.querySelectorAll(".row-checkbox").forEach(cb => {
        cb.addEventListener("change", (e) => {
            const id = cb.getAttribute("data-id");
            if (cb.checked) {
                state.selectedOrderIds.add(id);
            } else {
                state.selectedOrderIds.delete(id);
            }
            updateBulkCounter();
        });
    });

    updateBulkCounter();
}

function updateBulkCounter() {
    const countEl = document.getElementById("selected-count-label");
    if (countEl) {
        countEl.textContent = `${state.selectedOrderIds.size} ត្រូវបានជ្រើសរើស`;
    }
}

// Select an Order for Live Preview
function selectOrder(id) {
    state.activeOrderId = id;
    
    // Highlight table row
    document.querySelectorAll("#orders-tbody tr").forEach(tr => {
        if (tr.getAttribute("data-id") === id) {
            tr.classList.add("active-row");
        } else {
            tr.classList.remove("active-row");
        }
    });

    renderCurrentPreview();
}

// Render Current Preview Based on Active Tab
function renderCurrentPreview() {
    const order = getActiveOrder();
    const container = document.getElementById("preview-render-area");
    if (!container) return;

    if (!order) {
        container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding: 2rem;">សូមជ្រើសរើស ឬបន្ថែម Order ដើម្បី Preview</div>`;
        return;
    }

    if (state.currentTab === "label") {
        container.innerHTML = generateThermalLabelHTML(order);
        // Generate QR code for label
        setTimeout(() => {
            const qrEl = document.getElementById(`qr-preview-${order.id}`);
            if (qrEl && window.QRCode) {
                qrEl.innerHTML = "";
                const qrContent = order.qrData || `ORDER:${order.id}|${order.phone}|${order.totalAmount}`;
                new QRCode(qrEl, {
                    text: qrContent,
                    width: 72,
                    height: 72,
                    colorDark: "#000000",
                    colorLight: "#ffffff"
                });
            }
        }, 10);
    } else if (state.currentTab === "telegram") {
        container.innerHTML = generateTelegramReceiptHTML(order);
    } else if (state.currentTab === "a4") {
        container.innerHTML = generateA4SheetPreviewHTML();
        // Generate QR codes for all visible labels on A4 preview
        setTimeout(() => {
            state.orders.slice(0, 6).forEach(ord => {
                const qrEl = document.getElementById(`qr-a4-${ord.id}`);
                if (qrEl && window.QRCode) {
                    qrEl.innerHTML = "";
                    new QRCode(qrEl, {
                        text: ord.qrData || `ORDER:${ord.id}`,
                        width: 58,
                        height: 58,
                        colorDark: "#000000",
                        colorLight: "#ffffff"
                    });
                }
            });
        }, 10);
    }
}

// =========================================================================
// HTML GENERATOR: 80x60mm DELIVERY THERMAL LABEL (Replica of Image 1)
// =========================================================================
function generateThermalLabelHTML(order, isPrint = false) {
    const storeName = state.settings.storeName || "ACC Store";
    const pageName = order.pageName || state.settings.pageName || "INO Tech Studio";
    const sellerStaff = order.sellerStaff || state.settings.sellerStaff || "Chunras";
    const watermarkText = (order.paymentStatus || "PAID").toUpperCase();
    const isPaid = watermarkText === "PAID";
    const dateFormatted = order.date || new Date().toLocaleDateString('en-GB');

    return `
        <div class="thermal-label-container">
            <div class="thermal-label">
                <div class="label-inner-frame">
                    <!-- Top Black Header -->
                    <div class="label-top-header">
                        <div class="label-store-name">${escapeHtml(storeName)}</div>
                        <div class="label-order-id-tag">#${escapeHtml(order.id)}</div>
                    </div>

                    <!-- Main Split Body -->
                    <div class="label-body">
                        <!-- Left Section (62%) -->
                        <div class="label-left-section">
                            <div class="label-meta-row">
                                <span>RECIPIENT DELIVERY</span>
                                <span>DATE: ${escapeHtml(dateFormatted)}</span>
                            </div>

                            <div class="label-recipient-info">
                                <div class="label-cust-name">${escapeHtml(order.customerName)}</div>
                                <div class="label-cust-phone">${escapeHtml(order.phone)}</div>
                                <div class="label-cust-location">${escapeHtml(order.location || '')}</div>
                                <div class="label-cust-address">${escapeHtml(order.address || '')}</div>
                            </div>

                            <!-- Diagonal Watermark -->
                            <div class="label-watermark">${escapeHtml(watermarkText)}</div>

                            <!-- Left Footer -->
                            <div class="label-left-footer">
                                <span>${escapeHtml(pageName)}</span>
                                <span>${escapeHtml(sellerStaff)}</span>
                            </div>
                        </div>

                        <!-- Right Section (38%) -->
                        <div class="label-right-section">
                            <div class="label-qr-wrapper">
                                <div class="label-qr-code" id="${isPrint ? 'qr-print-' + order.id : 'qr-preview-' + order.id}"></div>
                            </div>

                            <div class="label-shipper-box">
                                <span class="shipper-label">SHIPPER:</span>
                                <div class="shipper-val" title="${escapeHtml(order.shipper)}">${escapeHtml(order.shipper || 'វីរៈប៊ុនថាំ (VET)')}</div>
                            </div>

                            <div class="label-price-box">
                                <div class="price-status-header">
                                    <span>${isPaid ? '✓' : '⚠️'}</span>
                                    <span>${escapeHtml(watermarkText)}</span>
                                </div>
                                <div class="price-amount">$${parseFloat(order.totalAmount || 0).toFixed(2)}</div>
                            </div>

                            <div class="price-sub-status">
                                ${isPaid ? 'Paid' : 'Unpaid (COD)'}
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Right Label Tag -->
                    <div class="label-bottom-footer">
                        ${escapeHtml(state.settings.systemFooter || 'PRO DELIVERY SYSTEM')}
                    </div>
                </div>
            </div>

            ${!isPrint ? `
                <div class="label-dimension-badge">
                    <span>🖨️ 80x60mm</span>
                    <span>LANDSCAPE</span>
                </div>
            ` : ''}
        </div>
    `;
}

// =========================================================================
// HTML GENERATOR: TELEGRAM BOT RECEIPT CARD (Replica of Image 2)
// =========================================================================
function generateTelegramReceiptHTML(order) {
    const pageName = order.pageName || state.settings.pageName || "INO Tech Studio";
    const dateFormatted = `${order.date || '18/09/2026'} ${order.time || '18:37'}`;
    const itemPrice = parseFloat(order.itemPrice || order.totalAmount || 0).toFixed(2);
    const deliveryFee = parseFloat(order.deliveryFee || 0).toFixed(2);
    const totalAmount = parseFloat(order.totalAmount || 0).toFixed(2);
    const isPaid = (order.paymentStatus || "").toUpperCase() === "PAID";
    const paymentMethodText = order.paymentMethod || (isPaid ? "Paid (ABA Bank (ACC Store) ($))" : "COD (ប្រមូលប្រាក់ពេលដឹកជញ្ជូន)");

    return `
        <div class="telegram-card">
            <div class="tg-header">
                <span class="tg-bot-title">📦 ACC Bot</span>
                <span class="tg-admin-tag">admin</span>
            </div>

            <div class="tg-notice">
                ✅ សូមបងពិនិត្យលេខទូរស័ព្ទ និងទីតាំងម្ដងទៀតបង 🙏
            </div>

            <div class="tg-details-list">
                <div class="tg-row">
                    <span class="icon">📑</span>
                    <span><strong>Page:</strong> ${escapeHtml(pageName)}</span>
                </div>
                <div class="tg-row">
                    <span class="icon">👤</span>
                    <span><strong>អតិថិជន:</strong> ${escapeHtml(order.customerName)}</span>
                </div>
                <div class="tg-row">
                    <span class="icon">📞</span>
                    <span><strong>លេខទូរស័ព្ទ:</strong> <a href="tel:${escapeHtml(order.phone)}" style="color:#60a5fa; text-decoration:none;">${escapeHtml(order.phone)}</a></span>
                </div>
                <div class="tg-row">
                    <span class="icon">📍</span>
                    <span><strong>ទីតាំង:</strong> ${escapeHtml(order.location || '')}</span>
                </div>
                <div class="tg-row">
                    <span class="icon">🏠</span>
                    <span><strong>អាសយដ្ឋាន:</strong> ${escapeHtml(order.address || '')}</span>
                </div>
            </div>

            <div class="tg-divider">------------- ផលិតផល -------------</div>

            <div class="tg-products-box">
                ${escapeHtml(order.products || '1. ទំនិញបញ្ជាទិញ')}
            </div>

            <div class="tg-summary-box">
                <div class="tg-summary-title">💰 សរុប:</div>
                <div>- តម្លៃទំនិញ: $${itemPrice}</div>
                <div>- សេវាដឹក: $${deliveryFee}</div>
                <div>- <strong>សរុបចុងក្រោយ: $${totalAmount}</strong></div>
                <div>- 💵 <strong>ស្ថានភាពបង់ប្រាក់:</strong> ${escapeHtml(paymentMethodText)}</div>
            </div>

            <div class="tg-shipping-info">
                <div>🚚 <strong>វិធីសាស្ត្រដឹកជញ្ជូន:</strong> ${escapeHtml(order.shipper || 'វីរៈប៊ុនថាំ (VET)')}</div>
                <div>📅 ${escapeHtml(dateFormatted)}</div>
            </div>

            <div class="tg-footer-row">
                <span>អរគុណបង 🙏🥰</span>
                <span>ID: <strong>#${escapeHtml(order.id)}</strong></span>
            </div>

            <div class="tg-action-buttons">
                <button class="tg-btn print-btn" onclick="printSingleOrder('${order.id}')">
                    🖨️ ព្រីន Label
                </button>
                <button class="tg-btn" onclick="contactCustomer('${escapeHtml(order.phone)}')">
                    💬 ទាក់ទងអតិថិជន
                </button>
            </div>
        </div>
    `;
}

// Generate A4 Sheet Preview (Grid of labels)
function generateA4SheetPreviewHTML() {
    const list = state.orders.slice(0, 6);
    let html = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background:#fff; padding:15px; border-radius:8px; width:100%; max-width:500px;">`;
    
    list.forEach(order => {
        const storeName = state.settings.storeName || "ACC Store";
        const dateFormatted = order.date || '18/09/2026';
        html += `
            <div style="border:1.5px solid #000; border-radius:4px; font-family:var(--font-khmer); background:#fff; color:#000; padding:4px; font-size:9px; height:160px; display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
                <div style="background:#000; color:#fff; display:flex; justify-content:space-between; padding:2px 4px; font-size:9px; font-weight:800; border-radius:2px;">
                    <span>${escapeHtml(storeName)}</span>
                    <span>#${escapeHtml(order.id)}</span>
                </div>
                <div style="display:grid; grid-template-columns: 60% 40%; gap:4px; flex:1; padding-top:4px;">
                    <div>
                        <div style="font-size:7px; color:#555;">RECIPIENT • ${dateFormatted}</div>
                        <div style="font-weight:800; font-size:10px;">${escapeHtml(order.customerName)}</div>
                        <div style="font-weight:700; font-size:9px;">${escapeHtml(order.phone)}</div>
                        <div style="font-weight:800; font-size:9px; margin-top:2px;">${escapeHtml(order.location || '')}</div>
                        <div style="font-size:8px; line-height:1.1;">${escapeHtml(order.address || '')}</div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:space-between;">
                        <div id="qr-a4-${order.id}" style="width:48px; height:48px;"></div>
                        <div style="border:1px solid #000; border-radius:2px; padding:1px 2px; text-align:center; width:100%;">
                            <div style="font-size:6px; font-weight:800;">${escapeHtml(order.paymentStatus || 'PAID')}</div>
                            <div style="font-size:10px; font-weight:900;">$${parseFloat(order.totalAmount || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:7px; border-top:1px solid #ccc; padding-top:2px;">
                    <span>${escapeHtml(order.shipper || 'VET')}</span>
                    <span>PRO DELIVERY</span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

// =========================================================================
// PRINT ENGINE
// =========================================================================
function printSingleOrder(id) {
    const order = state.orders.find(o => o.id === id) || getActiveOrder();
    if (!order) return;

    const printContainer = document.getElementById("print-render-container");
    if (!printContainer) return;

    printContainer.innerHTML = `
        <div class="print-page-item">
            ${generateThermalLabelHTML(order, true)}
        </div>
    `;

    // Render high quality QR code for print
    const qrEl = document.getElementById(`qr-print-${order.id}`);
    if (qrEl && window.QRCode) {
        new QRCode(qrEl, {
            text: order.qrData || `ORDER:${order.id}|${order.phone}|${order.totalAmount}`,
            width: 140,
            height: 140,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    }

    setTimeout(() => {
        window.print();
    }, 150);
}

function printBatchSelected() {
    const selectedIds = Array.from(state.selectedOrderIds);
    const targetOrders = selectedIds.length > 0 
        ? state.orders.filter(o => selectedIds.includes(o.id))
        : state.orders;

    if (targetOrders.length === 0) {
        alert("សូមជ្រើសរើស Order យ៉ាងហោចណាស់មួយដើម្បីបោះពុម្ព!");
        return;
    }

    const printContainer = document.getElementById("print-render-container");
    if (!printContainer) return;

    let html = "";
    targetOrders.forEach(order => {
        html += `
            <div class="print-page-item">
                ${generateThermalLabelHTML(order, true)}
            </div>
        `;
    });

    printContainer.innerHTML = html;

    // Render QR codes for each label
    setTimeout(() => {
        targetOrders.forEach(order => {
            const qrEl = document.getElementById(`qr-print-${order.id}`);
            if (qrEl && window.QRCode) {
                new QRCode(qrEl, {
                    text: order.qrData || `ORDER:${order.id}|${order.phone}|${order.totalAmount}`,
                    width: 140,
                    height: 140,
                    colorDark: "#000000",
                    colorLight: "#ffffff"
                });
            }
        });

        setTimeout(() => {
            window.print();
        }, 200);
    }, 50);
}

// =========================================================================
// SMART TELEGRAM TEXT PARSER (Parses Image 2 format automatically)
// =========================================================================
function parseTelegramText(rawText) {
    if (!rawText || typeof rawText !== "string") return null;

    const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
    const result = {
        id: generateOrderId(),
        customerName: "",
        phone: "",
        location: "",
        address: "",
        products: "",
        itemPrice: 0,
        deliveryFee: 0,
        totalAmount: 0,
        paymentStatus: "PAID",
        paymentMethod: "",
        shipper: "វីរៈប៊ុនថាំ (VET)",
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: ""
    };

    // Regex extraction
    rawText.split("\n").forEach(line => {
        const clean = line.trim();

        // Page
        if (clean.includes("Page:")) {
            result.pageName = clean.replace(/.*Page:\s*/i, "").trim();
        }
        // Customer Name
        if (clean.includes("អតិថិជន:") || clean.includes("Customer:") || clean.includes("ឈ្មោះ:")) {
            result.customerName = clean.replace(/.*(អតិថិជន|Customer|ឈ្មោះ):\s*/i, "").trim();
        }
        // Phone
        if (clean.includes("លេខទូរស័ព្ទ:") || clean.includes("Phone:") || clean.includes("Tel:")) {
            result.phone = clean.replace(/.*(លេខទូរស័ព្ទ|Phone|Tel):\s*/i, "").trim();
        }
        // Location / Province
        if (clean.includes("ទីតាំង:") || clean.includes("Location:")) {
            result.location = clean.replace(/.*(ទីតាំង|Location):\s*/i, "").trim();
        }
        // Address
        if (clean.includes("អាសយដ្ឋាន:") || clean.includes("Address:") || clean.includes("ទីកន្លែង:")) {
            result.address = clean.replace(/.*(អាសយដ្ឋាន|Address|ទីកន្លែង):\s*/i, "").trim();
        }
        // Shipper / Delivery
        if (clean.includes("វិធីសាស្ត្រដឹកជញ្ជូន:") || clean.includes("Shipper:") || clean.includes("ដឹកតាម:")) {
            result.shipper = clean.replace(/.*(វិធីសាស្ត្រដឹកជញ្ជូន|Shipper|ដឹកតាម):\s*/i, "").trim();
        }
        // Payment status
        if (clean.includes("ស្ថានភាពបង់ប្រាក់:") || clean.includes("Payment:")) {
            const payStr = clean.replace(/.*(ស្ថានភាពបង់ប្រាក់|Payment):\s*/i, "").trim();
            result.paymentMethod = payStr;
            if (payStr.toLowerCase().includes("paid") || payStr.toLowerCase().includes("aba") || payStr.includes("រួច")) {
                result.paymentStatus = "PAID";
            } else if (payStr.toLowerCase().includes("cod") || payStr.includes("ប្រមូល")) {
                result.paymentStatus = "COD";
            }
        }
        // Order ID (e.g. ID: F38BA5 or #F38BA5)
        if (clean.includes("ID:") || clean.includes("#")) {
            const idMatch = clean.match(/ID:\s*#?([A-Za-z0-9]+)/i) || clean.match(/#([A-Za-z0-9]{4,8})/);
            if (idMatch && idMatch[1]) {
                result.id = idMatch[1].toUpperCase();
            }
        }
        // Total Amount
        if (clean.includes("សរុបចុងក្រោយ:") || clean.includes("Total:")) {
            const priceMatch = clean.match(/\$\s*(\d+(\.\d+)?)/) || clean.match(/(\d+(\.\d+)?)\s*\$/);
            if (priceMatch) {
                result.totalAmount = parseFloat(priceMatch[1]);
            }
        }
        // Item price
        if (clean.includes("តម្លៃទំនិញ:") || clean.includes("Price:")) {
            const itemMatch = clean.match(/\$\s*(\d+(\.\d+)?)/) || clean.match(/(\d+(\.\d+)?)\s*\$/);
            if (itemMatch) {
                result.itemPrice = parseFloat(itemMatch[1]);
            }
        }
        // Delivery Fee
        if (clean.includes("សេវាដឹក:") || clean.includes("Delivery fee:")) {
            const feeMatch = clean.match(/\$\s*(\d+(\.\d+)?)/) || clean.match(/(\d+(\.\d+)?)\s*\$/);
            if (feeMatch) {
                result.deliveryFee = parseFloat(feeMatch[1]);
            }
        }
    });

    // Extract product section between "ផលិតផល" and "សរុប"
    const prodMatch = rawText.match(/ផលិតផល\s*-*\s*\n([\s\S]*?)(?=💰|សរុប|$)/i);
    if (prodMatch && prodMatch[1]) {
        result.products = prodMatch[1].trim();
    } else {
        // Fallback: try finding line starting with 1.
        const numLine = lines.find(l => /^\d+\./.test(l));
        if (numLine) result.products = numLine;
    }

    if (!result.totalAmount && result.itemPrice) {
        result.totalAmount = result.itemPrice + (result.deliveryFee || 0);
    }

    return result;
}

// =========================================================================
// CRUD OPERATIONS
// =========================================================================
function addNewOrder(orderData) {
    state.orders.unshift(orderData);
    saveOrders();
    renderStats();
    renderTable();
    selectOrder(orderData.id);
}

function updateOrder(id, updatedFields) {
    const idx = state.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
        state.orders[idx] = { ...state.orders[idx], ...updatedFields };
        saveOrders();
        renderStats();
        renderTable();
        if (state.activeOrderId === id) {
            renderCurrentPreview();
        }
    }
}

function deleteOrder(id) {
    if (!confirm("តើអ្នកពិតជាចង់លុប Order នេះមែនទេ?")) return;
    state.orders = state.orders.filter(o => o.id !== id);
    state.selectedOrderIds.delete(id);
    saveOrders();
    renderStats();
    renderTable();
    if (state.activeOrderId === id && state.orders.length > 0) {
        selectOrder(state.orders[0].id);
    } else if (state.orders.length === 0) {
        state.activeOrderId = null;
        renderCurrentPreview();
    }
}

function deleteBatchSelected() {
    if (state.selectedOrderIds.size === 0) {
        alert("សូមជ្រើសរើស Order ដែលត្រូវលុប!");
        return;
    }
    if (!confirm(`តើអ្នកពិតជាចង់លុប ${state.selectedOrderIds.size} Orders នេះមែនទេ?`)) return;

    state.orders = state.orders.filter(o => !state.selectedOrderIds.has(o.id));
    state.selectedOrderIds.clear();
    saveOrders();
    renderStats();
    renderTable();
    if (state.orders.length > 0) {
        selectOrder(state.orders[0].id);
    } else {
        state.activeOrderId = null;
        renderCurrentPreview();
    }
}

function duplicateOrder(id) {
    const original = state.orders.find(o => o.id === id);
    if (!original) return;

    const copy = {
        ...original,
        id: generateOrderId(),
        customerName: original.customerName + " (Copy)",
        date: new Date().toLocaleDateString('en-GB')
    };

    addNewOrder(copy);
}

// Contact customer action (Telegram / Call)
function contactCustomer(phone) {
    if (!phone) return;
    const cleanNum = phone.replace(/[^0-9]/g, "");
    window.open(`https://t.me/+855${cleanNum.replace(/^0/, '')}`, '_blank');
}

// =========================================================================
// MODALS & EVENT HANDLERS
// =========================================================================
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value.trim();
            renderTable();
        });
    }

    // Status filter
    const statusFilter = document.getElementById("status-filter-select");
    if (statusFilter) {
        statusFilter.addEventListener("change", (e) => {
            state.statusFilter = e.target.value;
            renderTable();
        });
    }

    // Shipper filter
    const shipperFilter = document.getElementById("shipper-filter-select");
    if (shipperFilter) {
        shipperFilter.addEventListener("change", (e) => {
            state.shipperFilter = e.target.value;
            renderTable();
        });
    }

    // Select all checkbox
    const selectAllCheckbox = document.getElementById("select-all-checkbox");
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const filtered = getFilteredOrders();
            if (e.target.checked) {
                filtered.forEach(o => state.selectedOrderIds.add(o.id));
            } else {
                state.selectedOrderIds.clear();
            }
            renderTable();
        });
    }

    // Tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.currentTab = btn.getAttribute("data-tab");
            renderCurrentPreview();
        });
    });

    // Theme toggle
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            const next = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            state.settings.theme = next;
            saveSettings();
            themeBtn.textContent = next === "dark" ? "🌙" : "☀️";
        });
    }

    // Add Order Modal Form Submit
    const orderForm = document.getElementById("order-form");
    if (orderForm) {
        orderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            saveOrderFromModal();
        });
    }

    // Telegram Parser Submit
    const parseBtn = document.getElementById("btn-apply-parser");
    if (parseBtn) {
        parseBtn.addEventListener("click", () => {
            const rawText = document.getElementById("telegram-raw-input").value;
            if (!rawText.trim()) {
                alert("សូមបញ្ចូលអត្ថបទ Telegram Order!");
                return;
            }
            const parsed = parseTelegramText(rawText);
            if (parsed && (parsed.customerName || parsed.phone || parsed.products)) {
                addNewOrder(parsed);
                closeModal("telegram-parser-modal");
                document.getElementById("telegram-raw-input").value = "";
            } else {
                alert("មិនអាចទាញយកទិន្នន័យបានទេ សូមពិនិត្យទម្រង់អត្ថបទម្តងទៀត!");
            }
        });
    }

    // Settings Form Submit
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            state.settings.storeName = document.getElementById("setting-store-name").value;
            state.settings.pageName = document.getElementById("setting-page-name").value;
            state.settings.sellerStaff = document.getElementById("setting-seller-staff").value;
            state.settings.systemFooter = document.getElementById("setting-system-footer").value;
            saveSettings();
            closeModal("settings-modal");
            renderCurrentPreview();
        });
    }
}

// Modal controls
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

// Open Add / Edit Modal
function openNewOrderModal() {
    document.getElementById("modal-order-title").textContent = "➕ បន្ថែម Order ថ្មី";
    document.getElementById("form-order-id").value = generateOrderId();
    document.getElementById("form-cust-name").value = "";
    document.getElementById("form-phone").value = "";
    document.getElementById("form-location").value = "";
    document.getElementById("form-address").value = "";
    document.getElementById("form-products").value = "";
    document.getElementById("form-item-price").value = "0.00";
    document.getElementById("form-delivery-fee").value = "0.00";
    document.getElementById("form-total-amount").value = "0.00";
    document.getElementById("form-payment-status").value = "PAID";
    document.getElementById("form-payment-method").value = "Paid (ABA Bank (ACC Store) ($))";
    document.getElementById("form-shipper").value = "វីរៈប៊ុនថាំ (VET)";
    document.getElementById("form-edit-mode").value = "new";

    openModal("order-edit-modal");
}

function openEditModal(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) return;

    document.getElementById("modal-order-title").textContent = `✏️ កែប្រែ Order #${order.id}`;
    document.getElementById("form-order-id").value = order.id;
    document.getElementById("form-cust-name").value = order.customerName || "";
    document.getElementById("form-phone").value = order.phone || "";
    document.getElementById("form-location").value = order.location || "";
    document.getElementById("form-address").value = order.address || "";
    document.getElementById("form-products").value = order.products || "";
    document.getElementById("form-item-price").value = order.itemPrice || order.totalAmount || "0.00";
    document.getElementById("form-delivery-fee").value = order.deliveryFee || "0.00";
    document.getElementById("form-total-amount").value = order.totalAmount || "0.00";
    document.getElementById("form-payment-status").value = order.paymentStatus || "PAID";
    document.getElementById("form-payment-method").value = order.paymentMethod || "";
    document.getElementById("form-shipper").value = order.shipper || "វីរៈប៊ុនថាំ (VET)";
    document.getElementById("form-edit-mode").value = "edit";

    openModal("order-edit-modal");
}

function saveOrderFromModal() {
    const mode = document.getElementById("form-edit-mode").value;
    const id = document.getElementById("form-order-id").value.trim().toUpperCase();
    const customerName = document.getElementById("form-cust-name").value.trim();
    const phone = document.getElementById("form-phone").value.trim();
    const location = document.getElementById("form-location").value.trim();
    const address = document.getElementById("form-address").value.trim();
    const products = document.getElementById("form-products").value.trim();
    const itemPrice = parseFloat(document.getElementById("form-item-price").value) || 0;
    const deliveryFee = parseFloat(document.getElementById("form-delivery-fee").value) || 0;
    const totalAmount = parseFloat(document.getElementById("form-total-amount").value) || (itemPrice + deliveryFee);
    const paymentStatus = document.getElementById("form-payment-status").value;
    const paymentMethod = document.getElementById("form-payment-method").value;
    const shipper = document.getElementById("form-shipper").value;

    const orderData = {
        id,
        customerName,
        phone,
        location,
        address,
        products,
        itemPrice,
        deliveryFee,
        totalAmount,
        paymentStatus,
        paymentMethod,
        shipper,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pageName: state.settings.pageName,
        sellerStaff: state.settings.sellerStaff,
        qrData: `ACC-${id}-${phone}-${totalAmount}USD`
    };

    if (mode === "new") {
        addNewOrder(orderData);
    } else {
        updateOrder(id, orderData);
    }

    closeModal("order-edit-modal");
}

function openSettingsModal() {
    document.getElementById("setting-store-name").value = state.settings.storeName || "ACC Store";
    document.getElementById("setting-page-name").value = state.settings.pageName || "INO Tech Studio";
    document.getElementById("setting-seller-staff").value = state.settings.sellerStaff || "Chunras";
    document.getElementById("setting-system-footer").value = state.settings.systemFooter || "PRO DELIVERY SYSTEM";
    openModal("settings-modal");
}

function openTelegramParserModal() {
    openModal("telegram-parser-modal");
}

// Export Orders to CSV
function exportOrdersCSV() {
    if (state.orders.length === 0) {
        alert("មិនមានទិន្នន័យសម្រាប់ Export ទេ!");
        return;
    }

    const headers = ["ID", "Customer Name", "Phone", "Location", "Address", "Products", "Total Amount", "Status", "Shipper", "Date"];
    const rows = state.orders.map(o => [
        `#${o.id}`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${(o.location || '').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.products || '').replace(/"/g, '""')}"`,
        o.totalAmount,
        o.paymentStatus,
        `"${(o.shipper || '').replace(/"/g, '""')}"`,
        o.date
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Delivery_Orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility: Escape HTML
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

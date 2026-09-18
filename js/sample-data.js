// Sample initial orders pre-configured for Cambodian E-Commerce Delivery
const INITIAL_ORDERS = [
    {
        id: "F38BA5",
        customerName: "Seng Leang",
        phone: "085467475(Cellcard)",
        location: "សៀមរាប",
        address: "សៀមរាប ចុងកៅស៊ូ",
        products: "ATTACK SHARK L50 PRO | Black x1 = $52.00",
        itemsList: [
            { name: "ATTACK SHARK L50 PRO (Black)", qty: 1, price: 52.00 }
        ],
        itemPrice: 52.00,
        deliveryFee: 0.00,
        totalAmount: 52.00,
        paymentStatus: "PAID", // "PAID", "COD", "UNPAID"
        paymentMethod: "Paid (ABA Bank (ACC Store) ($))",
        shipper: "វីរៈប៊ុនថាំ (VET)",
        date: "18/09/2026",
        time: "18:37",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "ប្រញាប់ដឹកមុនម៉ោង 5 ល្ងាច",
        qrData: "ACC-F38BA5-085467475-52USD"
    },
    {
        id: "A89C12",
        customerName: "Keo Pich",
        phone: "012889977(Smart)",
        location: "ភ្នំពេញ",
        address: "ផ្ទះលេខ 23 ផ្លូវ 271 សង្កាត់ទឹកល្អក់3 ខណ្ឌទួលគោក",
        products: "Logitech G Pro X Superlight 2 | White x1 = $145.00",
        itemsList: [
            { name: "Logitech G Pro X Superlight 2 (White)", qty: 1, price: 145.00 }
        ],
        itemPrice: 145.00,
        deliveryFee: 1.50,
        totalAmount: 146.50,
        paymentStatus: "COD",
        paymentMethod: "COD (ប្រមូលប្រាក់ពេលដឹកជញ្ជូន)",
        shipper: "J&T Express",
        date: "18/09/2026",
        time: "14:20",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "ទូរស័ព្ទមុនពេលទៅដល់",
        qrData: "ACC-A89C12-012889977-146.5USD"
    },
    {
        id: "D44E78",
        customerName: "Chan Dara",
        phone: "0976543210(Metfone)",
        location: "បាត់ដំបង",
        address: "ភូមិរំចេក៤ ឃុំរតនៈ ក្រុងបាត់ដំបង",
        products: "Keychron K2 V2 Wireless RGB x1 = $79.00, Mouse Pad XXL x1 = $12.00",
        itemsList: [
            { name: "Keychron K2 V2 Wireless RGB", qty: 1, price: 79.00 },
            { name: "Mouse Pad XXL", qty: 1, price: 12.00 }
        ],
        itemPrice: 91.00,
        deliveryFee: 0.00,
        totalAmount: 91.00,
        paymentStatus: "PAID",
        paymentMethod: "Paid (ACLEDA ToanChet)",
        shipper: "កាពីតូល (Capitol)",
        date: "18/09/2026",
        time: "10:15",
        pageName: "INO Tech Studio",
        sellerStaff: "Sokha",
        notes: "ផ្ញើរថយន្តក្រុង ព្រឹកស្អែក",
        qrData: "ACC-D44E78-0976543210-91USD"
    },
    {
        id: "B12F90",
        customerName: "Meng Sopheak",
        phone: "093221100(Smart)",
        location: "កំពត",
        address: "ជិតរង្វង់មូលធុរេន ក្រុងកំពត",
        products: "Edifier R1700BTs Bluetooth Speaker x1 = $85.00",
        itemsList: [
            { name: "Edifier R1700BTs Bluetooth Speaker", qty: 1, price: 85.00 }
        ],
        itemPrice: 85.00,
        deliveryFee: 2.00,
        totalAmount: 87.00,
        paymentStatus: "PAID",
        paymentMethod: "Paid (KHQR - Wing)",
        shipper: "វីរៈប៊ុនថាំ (VET)",
        date: "17/09/2026",
        time: "16:45",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "",
        qrData: "ACC-B12F90-093221100-87USD"
    },
    {
        id: "E77A33",
        customerName: "Rithy San",
        phone: "069554433(Smart)",
        location: "កណ្តាល",
        address: "ក្រុងតាខ្មៅ ជិតផ្សារតាខ្មៅចាស់",
        products: "Fantech Helios II Pro Wireless Mouse x1 = $38.00",
        itemsList: [
            { name: "Fantech Helios II Pro Wireless Mouse", qty: 1, price: 38.00 }
        ],
        itemPrice: 38.00,
        deliveryFee: 1.50,
        totalAmount: 39.50,
        paymentStatus: "COD",
        paymentMethod: "COD (ប្រមូលប្រាក់ពេលដឹកជញ្ជូន)",
        shipper: "Flash Express",
        date: "18/09/2026",
        time: "09:30",
        pageName: "INO Tech Studio",
        sellerStaff: "Chunras",
        notes: "Call 069554433",
        qrData: "ACC-E77A33-069554433-39.5USD"
    }
];

const DEFAULT_SETTINGS = {
    storeName: "ACC Store",
    pageName: "INO Tech Studio",
    sellerStaff: "Chunras",
    systemFooter: "PRO DELIVERY SYSTEM",
    paperSize: "80x60", // 80x60, 100x75, 100x150, 75x50, A4
    orientation: "landscape",
    currencySymbol: "$",
    defaultShipper: "វីរៈប៊ុនថាំ (VET)",
    showWatermark: true,
    watermarkText: "PAID",
    qrType: "smart", // smart, phone, id, payment
    theme: "dark"
};

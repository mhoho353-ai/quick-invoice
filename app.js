let invoiceItems = [];
let dailyTransactions = JSON.parse(localStorage.getItem('dailyTransactions')) || [];

const storeNameInput = document.getElementById('storeName');
const prodNameInput = document.getElementById('prodName');
const prodPriceInput = document.getElementById('prodPrice');
const prodQtyInput = document.getElementById('prodQty');
const addProdBtn = document.getElementById('addProdBtn');
const savedProductsSelect = document.getElementById('savedProductsSelect');
const itemsTableBody = document.getElementById('itemsTableBody');
const grandTotalEl = document.getElementById('grandTotal');

// استرجاع اسم المتجر المحفوظ مسبقاً
if (localStorage.getItem('savedStoreName')) {
    storeNameInput.value = localStorage.getItem('savedStoreName');
}
storeNameInput.addEventListener('input', () => {
    localStorage.setItem('savedStoreName', storeNameInput.value.trim());
});

// التاريخ والوقت الحي
function updateDateTime() {
    const now = new Date();
    document.getElementById('liveDateTime').textContent = now.toLocaleString('ar-EG');
}
setInterval(updateDateTime, 1000);
updateDateTime();

// تحميل المنتجات المحفوظة
function loadSavedProductsOptions() {
    let savedProducts = JSON.parse(localStorage.getItem('myProductsCatalog')) || {};
    savedProductsSelect.innerHTML = '<option value="">-- اختر منتجاً محفوظاً --</option>';
    for (let name in savedProducts) {
        let opt = document.createElement('option');
        opt.value = `${name}|${savedProducts[name]}`;
        opt.textContent = `${name} (${savedProducts[name]} ج.م)`;
        savedProductsSelect.appendChild(opt);
    }
}
loadSavedProductsOptions();

savedProductsSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const [name, price] = val.split('|');
    prodNameInput.value = name;
    prodPriceInput.value = price;
    prodQtyInput.value = '1';
    prodQtyInput.focus();
});

addProdBtn.addEventListener('click', () => {
    const name = prodNameInput.value.trim();
    const price = parseFloat(prodPriceInput.value);
    const qty = parseInt(prodQtyInput.value);

    if (!name || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
        alert('الرجاء إدخال اسم المنتج والسعر والكمية بشكل صحيح.');
        return;
    }

    let savedProducts = JSON.parse(localStorage.getItem('myProductsCatalog')) || {};
    savedProducts[name] = price;
    localStorage.setItem('myProductsCatalog', JSON.stringify(savedProducts));
    loadSavedProductsOptions();

    const newItem = { id: Date.now(), name, price, qty, total: price * qty };
    invoiceItems.push(newItem);
    renderTable();
    clearInputs();
});

function clearInputs() {
    prodNameInput.value = '';
    prodPriceInput.value = '';
    prodQtyInput.value = '1';
    savedProductsSelect.value = '';
    prodNameInput.focus();
}

function renderTable() {
    itemsTableBody.innerHTML = '';
    let grandTotal = 0;

    if (invoiceItems.length === 0) {
        itemsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-slate-500">لا توجد منتجات مضافة للفاتورة</td></tr>`;
        grandTotalEl.textContent = '0.00 ج.م';
        return;
    }

    invoiceItems.forEach((item) => {
        grandTotal += item.total;
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-900/40 transition";
        row.innerHTML = `
            <td class="p-2.5">${item.name}</td>
            <td class="p-2.5">${item.price}</td>
            <td class="p-2.5">${item.qty}</td>
            <td class="p-2.5 font-semibold text-emerald-400">${item.total}</td>
            <td class="p-2.5 text-center">
                <button onclick="deleteItem(${item.id})" class="text-red-400 font-bold hover:text-red-300 bg-red-950/40 px-2 py-0.5 rounded-lg">×</button>
            </td>
        `;
        itemsTableBody.appendChild(row);
    });

    grandTotalEl.textContent = grandTotal.toFixed(2) + ' ج.م';
}

window.deleteItem = function(id) {
    invoiceItems = invoiceItems.filter(item => item.id !== id);
    renderTable();
};

// تسجيل المعاملة في التقرير اليومي
function recordTransaction(clientName, grandTotal) {
    if (invoiceItems.length === 0) return;
    
    const now = new Date();
    const transaction = {
        date: now.toLocaleString('ar-EG'),
        dayCode: now.toISOString().slice(0, 10),
        client: clientName || 'عميل نقدي',
        itemsDetails: invoiceItems.map(i => `${i.name} (الكمية: ${i.qty} - السعر: ${i.price} - المجموع: ${i.total})`).join(' | '),
        total: grandTotal
    };
    
    dailyTransactions.push(transaction);
    localStorage.setItem('dailyTransactions', JSON.stringify(dailyTransactions));
    updateDailyReportUI();
}

// تحديث لوحة المبيعات اليومية التراكمية
function updateDailyReportUI() {
    const todayCode = new Date().toISOString().slice(0, 10);
    let todayTransactions = dailyTransactions.filter(t => t.dayCode === todayCode);
    let totalSalesToday = todayTransactions.reduce((sum, t) => sum + t.total, 0);

    document.getElementById('dailyTotalSales').textContent = totalSalesToday.toFixed(2) + ' ج.م';
    document.getElementById('dailyClientsCount').textContent = todayTransactions.length;
}
updateDailyReportUI();

// تجهيز قالب الطباعة العادية
function preparePrintTemplate(clientName, grandTotal) {
    document.getElementById('printStoreName').textContent = storeNameInput.value || 'متجري';
    document.getElementById('printDateTime').textContent = new Date().toLocaleString('ar-EG');
    document.getElementById('printClientName').textContent = clientName || 'عميل نقدي';
    
    let tbody = document.getElementById('printItemsBody');
    tbody.innerHTML = '';
    invoiceItems.forEach(item => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${item.name}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">${item.price} ج.م</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e1;">${item.qty}</td>
            <td style="padding: 10px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold;">${item.total} ج.م</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById('printGrandTotal').textContent = grandTotal.toFixed(2);
}

// إرسال واتساب
document.getElementById('sendWhatsappBtn').addEventListener('click', () => {
    if (invoiceItems.length === 0) {
        alert('الرجاء إضافة منتجات أولاً.');
        return;
    }

    const storeName = storeNameInput.value || 'متجري';
    const clientName = document.getElementById('clientName').value || 'العميل الكريم';
    let clientPhone = document.getElementById('clientPhone').value.trim();

    let message = `مرحباً *${clientName}* 👋\nشكراً لتعاملك مع *${storeName}* 🛍️\n\n📄 *تفاصيل الفاتورة:*\n`;
    let grandTotal = 0;

    invoiceItems.forEach((item, i) => {
        message += `------------------\n`;
        message += `${i + 1}. *${item.name}*\n   الكمية: ${item.qty} | السعر: ${item.price} ج.م\n   المجموع: *${item.total} ج.م*\n`;
        grandTotal += item.total;
    });

    message += `------------------\n`;
    message += `💰 *الإجمالي الكلي: ${grandTotal} ج.م*\n\nيسعدنا خدمتكم دائماً! ✨`;

    recordTransaction(clientName, grandTotal);

    const encodedMessage = encodeURIComponent(message);
    clientPhone = clientPhone.replace(/[^0-9]/g, '');
    let whatsappUrl = `https://wa.me/${clientPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
});

// طباعة الفاتورة (PDF)
document.getElementById('printPdfBtn').addEventListener('click', () => {
    if (invoiceItems.length === 0) {
        alert('الرجاء إضافة منتجات أولاً.');
        return;
    }
    let grandTotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);
    const clientName = document.getElementById('clientName').value || 'عميل';
    
    recordTransaction(clientName, grandTotal);
    preparePrintTemplate(clientName, grandTotal);
    window.print();
});

// ميزة الطباعة عبر الطابعة الحرارية للبلوتوث (Web Bluetooth API)
document.getElementById('printBluetoothBtn').addEventListener('click', async () => {
    if (invoiceItems.length === 0) {
        alert('الرجاء إضافة منتجات أولاً للطباعة.');
        return;
    }

    if (!navigator.bluetooth) {
        alert('متصفحك لا يدعم تقنية البلوتوث المباشر. يجدر استخدام متصفح Google Chrome على أندرويد.');
        return;
    }

    try {
        // البحث عن أجهزة البلوتوث القريبة (الطابعات الحرارية عادة تعلن عن خدمات عامة أو Serial)
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455']
        });

        const server = await device.gatt.connect();
        // محاولة جلب خصائص الإرسال للطابعة
        const services = await server.getPrimaryServices();
        let targetCharacteristic = null;

        for (let service of services) {
            const characteristics = await service.getCharacteristics();
            for (let char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                    targetCharacteristic = char;
                    break;
                }
            }
            if (targetCharacteristic) break;
        }

        if (!targetCharacteristic) {
            alert.call(null, 'لم يتم العثور على قناة كتابة متوافقة مع الطابعة.');
            return;
        }

        // بناء أوامر الطباعة بلغة ESC/POS المخصصة للطابعات الحرارية
        let encoder = new TextEncoder();
        let commands = [];

        // أوامر التهيئة وتوسيط المحاذاة
        commands.push(new Uint8Array([0x1B, 0x40])); // تهيئة الطابعة (ESC @)
        commands.push(new Uint8Array([0x1B, 0x61, 0x01])); // محاذاة في الوسط (Center)

        let storeName = storeNameInput.value || 'متجري';
        let clientName = document.getElementById('clientName').value || 'عميل نقدي';
        let grandTotal = invoiceItems.reduce((sum, i) => sum + i.total, 0);

        commands.push(encoder.encode(`\n${storeName}\n`));
        commands.push(encoder.encode(`--------------------------------\n`));
        commands.push(encoder.encode(`التاريخ: ${new Date().toLocaleString('ar-EG')}\n`));
        commands.push(encoder.encode(`العميل: ${clientName}\n`));
        commands.push(encoder.encode(`--------------------------------\n`));

        // محاذاة لليمين للمنتجات
        commands.push(new Uint8Array([0x1B, 0x61, 0x02])); 
        invoiceItems.forEach((item, idx) => {
            commands.push(encoder.encode(`${idx + 1}. ${item.name}\n`));
            commands.push(encoder.encode(`   الكمية: ${item.qty} | السعر: ${item.price} ج.م\n`));
            commands.push(encoder.encode(`   المجموع: ${item.total} ج.م\n`));
        });

        commands.push(encoder.encode(`--------------------------------\n`));
        // محاذاة للوسط للإجمالي
        commands.push(new Uint8Array([0x1B, 0x61, 0x01]));
        commands.push(encoder.encode(`الجمالي الكلي: ${grandTotal.toFixed(2)} ج.م\n\n`));
        commands.push(encoder.encode(`شكراً لتعاملك معنا!\n\n\n\n`)); // مسافات لقطع الورق

        // دمج الأوامر وإرسالها عبر البلوتوث
        for (let cmd of commands) {
            await targetCharacteristic.writeValue(cmd);
        }

        recordTransaction(clientName, grandTotal);
        alert('تمت الطباعة بنجاح عبر البلوتوث! 🖨️✨');

    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء الاتصال بالطابعة أو تم إلغاء العملية.');
    }
});

// زر زبون جديد
document.getElementById('resetClientBtn').addEventListener('click', () => {
    if (confirm('هل تريد مسح بيانات الزبون الحالي والبدء بزبون جديد؟')) {
        invoiceItems = [];
        document.getElementById('clientName').value = '';
        document.getElementById('clientPhone').value = '';
        renderTable();
    }
});

// تصدير ملف الإكسل
document.getElementById('exportExcelBtn').addEventListener('click', () => {
    const todayCode = new Date().toISOString().slice(0, 10);
    let todayTransactions = dailyTransactions.filter(t => t.dayCode === todayCode);

    if (todayTransactions.length === 0) {
        alert('لا توجد بيانات عملاء مسجلة اليوم لتصديرها.');
        return;
    }

    let csvContent = "\uFEFFالتاريخ والوقت,اسم العميل,تفاصيل البضاعة والمشتريات,إجمالي الفاتورة\n";
    todayTransactions.forEach(t => {
        let safeClient = t.client.replace(/"/g, '""');
        let safeDetails = t.itemsDetails.replace(/"/g, '""');
        csvContent += `"${t.date}","${safeClient}","${safeDetails}",${t.total}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Daily_Report_${todayCode}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 1000);
});

// زر تصفير تقرير اليوم
document.getElementById('clearDayBtn').addEventListener('click', () => {
    if (confirm('هل أنت متأكد من مسح جميع معاملات اليوم والبدء من الصفر؟')) {
        const todayCode = new Date().toISOString().slice(0, 10);
        dailyTransactions = dailyTransactions.filter(t => t.dayCode !== todayCode);
        localStorage.setItem('dailyTransactions', JSON.stringify(dailyTransactions));
        updateDailyReportUI();
        alert('تم تصفير تقرير اليوم بنجاح، يمكنك البدء بيوم جديد! 🚀');
    }
});

renderTable();

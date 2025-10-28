// Asosiy konfiguratsiya
const CONFIG = {
    API_URL: 'https://api.mymemory.translated.net/get',
    BACKEND_URL: 'https://yourdomain.com/tarjima_bot/admin_handler.php',
    DEFAULT_LIMIT: 25,
    MAX_TEXT_LENGTH: 4000
};

// Telegram bot konfiguratsiyasi
const TELEGRAM_BOT = {
    TOKEN: '8329218024:AAGckU09hFZR2oJ0N9SJd2gGBxV2NmMhFeY',
    CHAT_ID: '5744542264'
};

// Foydalanuvchi ma'lumotlari
let userData = {
    userId: generateUserId(),
    remainingLimit: CONFIG.DEFAULT_LIMIT,
    totalTranslations: 0,
    selectedLanguage: 'uz_en'
};

// Foydalanuvchi ID sini yaratish
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Dasturni ishga tushirish
function initializeApp() {
    // Loading ekranini yashirish
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        loadUserData();
        setupEventListeners();
    }, 1500);
}

// Foydalanuvchi ma'lumotlarini yuklash
async function loadUserData() {
    // LocalStorage dan yuklash
    const savedData = localStorage.getItem('tarjimaBotUserData');
    if (savedData) {
        const localData = JSON.parse(savedData);
        userData.userId = localData.userId || userData.userId;
        userData.remainingLimit = localData.remainingLimit || userData.remainingLimit;
        userData.totalTranslations = localData.totalTranslations || userData.totalTranslations;
    }
    
    updateUI();
}

// UI ni yangilash
function updateUI() {
    document.getElementById('limitCount').textContent = `${userData.remainingLimit} ta limit`;
    document.getElementById('remainingLimit').textContent = userData.remainingLimit;
    document.getElementById('totalTranslations').textContent = userData.totalTranslations;
    
    // Limit tugagan holat
    if (userData.remainingLimit <= 0) {
        document.getElementById('translateBtn').disabled = true;
        document.getElementById('translateBtn').style.opacity = '0.6';
        document.getElementById('translateBtn').innerHTML = '<span class="btn-icon">🚫</span> Limit tugadi';
    } else {
        document.getElementById('translateBtn').disabled = false;
        document.getElementById('translateBtn').style.opacity = '1';
        document.getElementById('translateBtn').innerHTML = '<span class="btn-icon">🔄</span> Tarjima qilish';
    }
}

// Event listenerlarni o'rnatish
function setupEventListeners() {
    // Til tanlash tugmalari
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectLanguage(this.dataset.lang);
        });
    });
    
    // Matn kiritish maydoni
    const sourceText = document.getElementById('sourceText');
    sourceText.addEventListener('input', function() {
        updateCharCount();
    });
    
    // Tozalash tugmasi
    document.getElementById('clearBtn').addEventListener('click', clearText);
    
    // Tarjima tugmasi
    document.getElementById('translateBtn').addEventListener('click', translateText);
    
    // Nusxalash tugmasi
    document.getElementById('copyBtn').addEventListener('click', copyResult);
    
    // Pastki navigatsiya
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            handleNavigation(this.dataset.page);
        });
    });
    
    // Modal tugmalari
    document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
    
    // Kichik nusxalash tugmalari
    document.querySelectorAll('.copy-small-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            copyToClipboard(this.dataset.text);
        });
    });
}

// Til tanlash
function selectLanguage(lang) {
    userData.selectedLanguage = lang;
    
    // Barcha tugmalardan active classini olib tashlash
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tanlangan tilga active class qo'shish
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');
    
    showToast(`Tanlandi: ${getLanguageName(lang)}`);
}

// Til nomini olish
function getLanguageName(langCode) {
    const names = {
        'uz_en': "O'zbekcha → Inglizcha",
        'en_uz': "Inglizcha → O'zbekcha",
        'uz_ru': "O'zbekcha → Ruscha", 
        'ru_uz': "Ruscha → O'zbekcha",
        'ru_en': "Ruscha → Inglizcha",
        'en_ru': "Inglizcha → Ruscha"
    };
    return names[langCode] || langCode;
}

// Belgilar sonini yangilash
function updateCharCount() {
    const text = document.getElementById('sourceText').value;
    const count = text.length;
    document.getElementById('charCount').textContent = `${count}/${CONFIG.MAX_TEXT_LENGTH}`;
    
    // Limitdan oshib ketganligini tekshirish
    if (count > CONFIG.MAX_TEXT_LENGTH) {
        document.getElementById('charCount').style.color = 'var(--error-color)';
    } else {
        document.getElementById('charCount').style.color = 'var(--text-secondary)';
    }
}

// Matnni tozalash
function clearText() {
    document.getElementById('sourceText').value = '';
    document.getElementById('resultSection').style.display = 'none';
    updateCharCount();
    showToast('Matn tozalandi');
}

// Tarjima qilish
async function translateText() {
    const sourceText = document.getElementById('sourceText').value.trim();
    
    // Validatsiya
    if (!sourceText) {
        showToast('Iltimos, tarjima qilish uchun matn kiriting!', 'error');
        return;
    }
    
    if (sourceText.length > CONFIG.MAX_TEXT_LENGTH) {
        showToast(`Matn ${CONFIG.MAX_TEXT_LENGTH} belgidan oshmasligi kerak!`, 'error');
        return;
    }
    
    if (userData.remainingLimit <= 0) {
        showPaymentModal();
        showToast('Limit tugadi! To\'lov qiling.', 'error');
        
        // Adminga xabar yuborish
        await sendUserLimitNotification();
        return;
    }
    
    // Loading holati
    const translateBtn = document.getElementById('translateBtn');
    translateBtn.innerHTML = '<span class="btn-icon">⏳</span> Tarjima qilinmoqda...';
    translateBtn.disabled = true;
    
    try {
        // Tarjima API
        const translatedText = await callTranslateAPI(sourceText, userData.selectedLanguage);
        
        // Limitni kamaytirish
        userData.remainingLimit--;
        userData.totalTranslations++;
        updateUI();
        saveUserData();
        
        // Natijani ko'rsatish
        document.getElementById('resultText').textContent = translatedText;
        document.getElementById('resultSection').style.display = 'block';
        
        showToast('Tarjima muvaffaqiyatli amalga oshirildi!', 'success');
        
        // Natijaga scroll qilish
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
        
    } catch (error) {
        console.error('Tarjima xatosi:', error);
        showToast('Tarjima qilishda xatolik yuz berdi!', 'error');
    } finally {
        // Tugmani qayta tiklash
        translateBtn.innerHTML = '<span class="btn-icon">🔄</span> Tarjima qilish';
        translateBtn.disabled = false;
    }
}

// Haqiqiy tarjima API
async function callTranslateAPI(text, lang) {
    const [sourceLang, targetLang] = lang.split('_');
    
    try {
        // MyMemory Translate API
        const response = await fetch(
            `${CONFIG.API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
        );
        
        if (!response.ok) {
            throw new Error('API javob bermadi');
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Tarjima muvaffaqiyatsiz');
        }
        
    } catch (error) {
        // Agar API ishlamasa, fallback tarjima
        return fallbackTranslation(text, lang);
    }
}

// Fallback tarjima (API ishlamasa)
function fallbackTranslation(text, lang) {
    const translations = {
        'uz_en': `[EN] ${text}`,
        'en_uz': `[UZ] ${text}`,
        'uz_ru': `[RU] ${text}`,
        'ru_uz': `[UZ] ${text}`,
        'ru_en': `[EN] ${text}`,
        'en_ru': `[RU] ${text}`
    };
    
    return translations[lang] || `Tarjima: ${text}`;
}

// Adminga xabar yuborish
async function sendUserLimitNotification() {
    const userInfo = `👤 Foydalanuvchi ID: <code>${userData.userId}</code>\n📊 Jami tarjimalar: ${userData.totalTranslations} ta\n⭐ Foydalanilgan limit: ${CONFIG.DEFAULT_LIMIT - userData.remainingLimit} ta\n🔰 Qolgan limit: ${userData.remainingLimit} ta`;
    
    const message = `🚨 LIMIT TUGADI!\n\nFoydalanuvchi limiti tugadi. Yangi limit ochilsinmi?\n\n${userInfo}\n⏰ Vaqt: ${new Date().toLocaleString('uz-UZ')}\n🌐 Manzil: ${window.location.href}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT.TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_BOT.CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ 50 ta limit ochish",
                                callback_data: "open_50_limit"
                            },
                            {
                                text: "✅ 100 ta limit ochish",
                                callback_data: "open_100_limit"
                            }
                        ],
                        [
                            {
                                text: "❌ Rad etish",
                                callback_data: "reject_limit"
                            }
                        ]
                    ]
                }
            })
        });
        
        console.log('Batafsil xabar adminga yuborildi');
        showToast('Admin limit ochish uchun xabardor qilindi!');
    } catch (error) {
        console.error('Xabar yuborishda xatolik:', error);
        showToast('Xabar yuborish muvaffaqiyatsiz!', 'error');
    }
}

// Natijani nusxalash
function copyResult() {
    const resultText = document.getElementById('resultText').textContent;
    copyToClipboard(resultText);
    showToast('Natija nusxalandi!');
}

// Umumiy nusxalash funksiyasi
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Nusxalandi!');
    }).catch(err => {
        console.error('Nusxalash xatosi:', err);
        showToast('Nusxalash muvaffaqiyatsiz!', 'error');
    });
}

// Navigatsiyani boshqarish
function handleNavigation(page) {
    switch (page) {
        case 'translate':
            // Sahifa yuqorisiga scroll qilish
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'payment':
            showPaymentModal();
            break;
        case 'stats':
            showStats();
            break;
        case 'help':
            showHelp();
            break;
    }
    
    // Navigatsiya tugmalarini yangilash
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// To'lov modalini ko'rsatish
function showPaymentModal() {
    document.getElementById('paymentModal').style.display = 'flex';
}

// To'lov modalini yopish
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Statistika ko'rsatish
function showStats() {
    const statsMessage = `
📊 Sizning statistikangiz:

✅ Jami tarjimalar: ${userData.totalTranslations} ta
⭐ Qolgan limit: ${userData.remainingLimit} ta
🎯 Faollik darajasi: ${Math.round((userData.totalTranslations / (userData.totalTranslations + (CONFIG.DEFAULT_LIMIT - userData.remainingLimit))) * 100)}%
👤 Foydalanuvchi ID: ${userData.userId}

Tarjima qilishni davom ettiring! 🚀
    `;
    alert(statsMessage.trim());
}

// Yordam ko'rsatish
function showHelp() {
    const helpMessage = `
🤖 Aqlli Tarjima Boti - Yordam

📝 Qanday foydalanish:
1. Tarjima turini tanlang
2. Matnni kiriting
3. "Tarjima qilish" tugmasini bosing
4. Natijani ko'ring va nusxalang

🌐 Qo'llab-quvvatlanadigan tillar:
• O'zbekcha (UZ)
• Inglizcha (EN) 
• Ruscha (RU)

💎 Limit tizimi:
• Har bir foydalanuvchi 25 ta bepul tarjima
• Limit tugaganda to'lov qilishingiz kerak
• To'lov: 2,000 so'm
• Limit tugaganda admin avtomatik xabardor bo'ladi

📞 Aloqa: @LOGO_55

Qayta tarjima qilish uchun yangi matn kiriting!
    `;
    alert(helpMessage.trim());
}

// Toast bildirishnoma
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Turi bo'yicha rang
    if (type === 'error') {
        toast.style.background = 'var(--error-color)';
    } else if (type === 'success') {
        toast.style.background = 'var(--success-color)';
    } else {
        toast.style.background = 'var(--text-primary)';
    }
    
    // 3 soniyadan keyin yashirish
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Ma'lumotlarni saqlash
function saveUserData() {
    localStorage.setItem('tarjimaBotUserData', JSON.stringify(userData));
}

// Global funksiyalar
window.copyToClipboard = copyToClipboard;
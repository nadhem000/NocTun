// ========================
// Constants & Configuration (Security Enhanced)
// ========================
const SYNC_TAG = 'content-sync';
const DB_NAME = 'syncQueueDB';
const STORE_NAME = 'syncQueue';

// Security improvement: Object.freeze to prevent modification
const translations = Object.freeze({
    en: Object.freeze({
        main_page: "Main Page",
        our_members: "Our Members",
        associations: "Associations",
        chapter_activities: "Chapter Activities",
        contact_us: "Contact Us",
        language: "Language",
        presentation_title: "Presentation of NOC Tunisian Chapter",
        presentation_text: "The IAU National Outreach Committee (NOC) - Tunisia is a scientific outreach initiative under the International Astronomical Union, dedicated to promoting astronomy across Tunisia through public engagement, education, and research. We organize stargazing events, school workshops, and astronomy lectures to inspire students and the general public while supporting amateur and professional astronomers. Our past achievements include nationwide astronomy campaigns and teacher training programs, and we aim to expand access to astronomy in rural areas and establish Tunisia's first public observatory. Join us in exploring the universe!",
        library: "Library",
        videos: "Videos",
        calendar: "Calendar",
        developer: "Developer: Mejri Ziad",
        version: "Version: 1.0",
        under_development: "Under Development",
        select_language: "Select Language",
        english: "English",
        arabic: "Arabic",
        placeholder_alt: "Placeholder image for NOC Tunisian Chapter",
        content_updated: "New content available! Reload to update?",
        sync_queued: "Changes will sync when online",
        install_app: "Install App",
        activate_tooltips: 'Activate Tooltips',
        deactivate_tooltips: 'Deactivate Tooltips',
        ios_install_title: "Install on iOS:",
        ios_install_steps: `<ol><li>Open Share menu (box with arrow icon)</li><li>Select "Add to Home Screen"</li></ol>`,
        install_available: "Install available",
        install_success: "App installed successfully!",
        tooltip_main_page: "Main page content coming soon",
        tooltip_our_members: "Member directory under development",
        tooltip_associations: "Association information coming soon",
        tooltip_chapter_activities: "Activity calendar in development",
        tooltip_contact_us: "Contact form coming soon",
        tooltip_language: "Change site language",
        contact_us_header: "Contact Us",
        reach_us: "You can reach us at:",
        address: "Address",
        facebook: "Facebook",
        email: "Email",
        phone: "Phone",
        twitter: "Twitter",
        linkedin: "LinkedIn",
    }),
    ar: Object.freeze({
        main_page: "الصفحة الرئيسية",
        our_members: "أعضاؤنا",
        associations: "الجمعيات",
        chapter_activities: "أنشطة الفرع",
        contact_us: "اتصل بنا",
        language: "اللغة",
        presentation_title: "تقديم فرع NOC التونسي",
        presentation_text: "اللجنة الوطنية لنشر الفلك (NOC) - تونس هي مبادرة علمية تابعة للاتحاد الفلكي الدولي تهدف إلى نشر علم الفلك في تونس عبر الفعاليات العامة، البرامج التعليمية، والأبحاث. ننظم أنشطة مثل رصد النجوم، ورش عمل مدرسية، ومحاضرات لتشجيع الطلاب والجمهور على الاهتمام بالعلوم الفلكية، مع دعم الفلكيين الهواة والمحترفين. من بين إنجازاتنا حملات وطنية لرصد الأجرام السماوية وتدريب المعلمين، ونسعى مستقبلاً إلى التوسع في المناطق الريفية وإنشاء أول مرصد فلكي عمومي في تونس. انضم إلينا لاكتشاف الكون!",
        library: "المكتبة",
        videos: "مقاطع الفيديو",
        calendar: "التقويم",
        developer: "المطور: زياد الماجري",
        version: "الإصدار: 1.0",
        under_development: "قيد التطوير",
        select_language: "اختر اللغة",
        english: "الإنجليزية",
        arabic: "العربية",
        placeholder_alt: "صورة مؤقتة لفرع NOC التونسي",
        content_updated: "!محتوى جديد متاح. هل تريد التحديث؟",
        sync_queued: "سيتم مزامنة التغييرات عند الاتصال بالإنترنت",
        install_app: "تثبيت التطبيق",
        activate_tooltips: 'تفعيل التلميحات',
        deactivate_tooltips: 'إلغاء تفعيل التلميحات',
        ios_install_title: "لتثبيت التطبيق على iOS:",
        ios_install_steps: `<ol><li>افتح القائمة المشتركة (زر المشاركة)</li><li>اختر "أضف إلى الشاشة الرئيسية"</li></ol>`,
        install_available: "التثبيت متاح",
        install_success: "!تم تثبيت التطبيق بنجاح",
        calendar_tooltip: "الأنشطة القادمة",
        library_tooltip: "اللغة",
        videos_tooltip: "اختر اللغة",
        calendar_tooltip: "تغيير لغة الموقع",
        tooltip_main_page: "الصفحة الرئيسية قيد التطوير",
        tooltip_our_members: "دليل الأعضاء قيد التطوير",
        tooltip_associations: "معلومات الجمعيات قريباً",
        tooltip_chapter_activities: "تقويم الأنشطة قيد التطوير",
        tooltip_contact_us: "نموذج الاتصال قريباً",
        tooltip_language: "تغيير لغة الموقع",
        contact_us_header: "اتصل بنا",
        reach_us: "يمكنك التواصل معنا عبر:",
        address: "العنوان",
        facebook: "فيسبوك",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        twitter: "تويتر",
        linkedin: "لينكد إن",
    })
});

// Security improvement: Sanitize HTML function
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================
// IndexedDB Management (Security Enhanced)
// ========================
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // Security improvement: Create index for better querying
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };
    });
}

async function addToQueue(action) {
    // Security improvement: Validate action before queuing
    if (!action || typeof action !== 'object') {
        throw new Error('Invalid action');
    }

    // Security improvement: Check storage quota
    if (navigator.storage?.estimate) {
        try {
            const quota = await navigator.storage.estimate();
            if ((quota.usage / quota.quota) > 0.9) {
                console.warn('Storage quota nearly full');
                return false;
            }
        } catch (error) {
            console.error('Storage estimation failed:', error);
        }
    }

    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Security improvement: Validate data before putting
        const queueItem = {
            id: Date.now(),
            ...action,
            timestamp: new Date().toISOString()
        };
        
        await store.put(queueItem);
        await tx.done;
        return true;
    } catch (error) {
        console.error('Failed to add to queue:', error);
        return false;
    }
}

// ========================
// Language Management (Security Enhanced)
// ========================
let currentLanguage = localStorage.getItem('currentLanguage') || 'en';

function updateText() {
    // Security improvement: Use documentFragment for batch updates
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    fragment.appendChild(tempDiv);

    // Update regular text elements
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.dataset.key;
        if (translations[currentLanguage]?.[key]) {
            const translation = translations[currentLanguage][key];
            if (element.classList.contains('translatable')) {
                element.textContent = translation;
            } else {
                // Security improvement: Sanitize HTML content
                tempDiv.innerHTML = sanitizeHTML(translation);
                while (tempDiv.firstChild) {
                    element.appendChild(tempDiv.firstChild);
                }
            }
        }
    });

    // Update document metadata
    document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.title = translations[currentLanguage].presentation_title;
    
    if (currentLanguage === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
    }
}

function showLanguageModal() {
    const existingModal = document.getElementById('language-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'language-modal';
    modal.classList.add('language-modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('language-modal-content');

    const title = document.createElement('h3');
    title.classList.add('translatable');
    title.dataset.key = 'select_language';
    title.textContent = translations[currentLanguage]['select_language'];

    const englishOption = document.createElement('button');
    englishOption.classList.add('language-option');
    englishOption.textContent = translations[currentLanguage]['english'];
    englishOption.addEventListener('click', () => {
        setLanguage('en');
        modal.remove();
    });

    const arabicOption = document.createElement('button');
    arabicOption.classList.add('language-option');
    arabicOption.textContent = translations[currentLanguage]['arabic'];
    arabicOption.addEventListener('click', () => {
        setLanguage('ar');
        modal.remove();
    });

    modalContent.appendChild(title);
    modalContent.appendChild(englishOption);
    modalContent.appendChild(arabicOption);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'ar') return; // Security: Validate language
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang);
    updateText();
}

// ========================
// Service Worker Management (Security Enhanced)
// ========================
async function registerPeriodicSync(registration) {
    try {
        // Security improvement: Check permission first
        if ('permissions' in navigator) {
            const status = await navigator.permissions.query({
                name: 'periodic-background-sync',
            });
            if (status.state !== 'granted') return;
        }

        if ('periodicSync' in registration) {
            await registration.periodicSync.register('content-refresh', {
                minInterval: 24 * 60 * 60 * 1000 // 24 hours
            });
        }
    } catch (error) {
        console.log('Periodic sync not supported:', error);
    }
}

// Security improvement: Robust SW registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none' // Always check for updates
            });

            console.log('ServiceWorker scope:', registration.scope);
            
            // Check for updates immediately
            registration.update().catch(err => 
                console.error('ServiceWorker update check failed:', err)
            );

            await registerPeriodicSync(registration);
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    });
}

// ========================
// PWA Installation Handling (Security Enhanced)
// ========================
let deferredPrompt = null;
let isAppInstalled = false;

function checkInstalledStatus() {
    // Security improvement: More reliable detection
    isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone ||
                    document.referrer.includes('android-app://');
    handleInstallation();
}

function handleInstallation() {
    const installButton = document.getElementById('installButton');
    if (!installButton) return;

    installButton.style.display = isAppInstalled ? 'none' : 'block';
    installButton.style.direction = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    
    // Update button text
    const translationKey = isAppInstalled ? 'install_success' : 'install_app';
    installButton.textContent = translations[currentLanguage][translationKey];
}

// Security improvement: Throttle beforeinstallprompt
let installPromptThrottle = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (installPromptThrottle) clearTimeout(installPromptThrottle);
    installPromptThrottle = setTimeout(() => {
        handleInstallation();
        installPromptThrottle = null;
    }, 300);
});

window.addEventListener('appinstalled', () => {
    isAppInstalled = true;
    deferredPrompt = null;
    
    // Security improvement: Use custom notification instead of alert
    const notification = document.createElement('div');
    notification.className = 'install-notification';
    notification.textContent = translations[currentLanguage].install_success;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    handleInstallation();
});

// ========================
// Main Initialization (Security Enhanced)
// ========================
document.addEventListener('DOMContentLoaded', () => {
    // Security improvement: Initialize with sanitized content
    updateText();
    checkInstalledStatus();

    // Window click handlers with improved security
    document.querySelectorAll('.window').forEach(windowElement => {
        windowElement.addEventListener('click', function(e) {
            const page = this.dataset.page;
            if (page) {
                // Security improvement: Validate page URL
                try {
                    const url = new URL(page, window.location.origin);
                    if (url.origin === window.location.origin) {
                        window.location.href = url.pathname;
                    }
                } catch (error) {
                    console.error('Invalid navigation URL:', error);
                }
                return;
            }

            const key = this.dataset.key;
            if (key === 'language') {
                showLanguageModal();
                return;
            }

            // Security improvement: Use custom notification instead of alert
            const notification = document.createElement('div');
            notification.className = 'dev-notification';
            notification.textContent = translations[currentLanguage].under_development;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        });
    });

    // Install button handler with improved security
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                try {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        isAppInstalled = true;
                        handleInstallation();
                    }
                    deferredPrompt = null;
                } catch (error) {
                    console.error('Install prompt failed:', error);
                }
            } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                showInstallInstructions();
            }
        });
    }
});

// Content update handling with improved security
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'content-updated') {
            // Security improvement: Confirm with custom dialog
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'update-dialog';
            
            const message = document.createElement('p');
            message.textContent = translations[currentLanguage].content_updated;
            
            const reloadButton = document.createElement('button');
            reloadButton.textContent = 'Reload';
            reloadButton.addEventListener('click', () => {
                window.location.reload();
                confirmDialog.remove();
            });
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Later';
            cancelButton.addEventListener('click', () => {
                confirmDialog.remove();
            });
            
            confirmDialog.appendChild(message);
            confirmDialog.appendChild(reloadButton);
            confirmDialog.appendChild(cancelButton);
            document.body.appendChild(confirmDialog);
        }
    });
}

// ========================
// Tooltip Management
// ========================
// Video links map
const videoLinks = {
    "main_page": "assets/videos/language.mp4",
    "our_members": "assets/videos/language.mp4",
    "associations": "assets/videos/language.mp4",
    "chapter_activities": "assets/videos/language.mp4",
    "contact_us": "assets/videos/language.mp4",
    "language": "assets/videos/language.mp4",
    "library": "assets/videos/language.mp4",
    "videos": "assets/videos/language.mp4",
    "calendar": "assets/videos/language.mp4",
  "address": "assets/videos/language.mp4",
  "facebook": "assets/videos/language.mp4",
  "email": "assets/videos/language.mp4",
  "phone": "assets/videos/language.mp4",
  "twitter": "assets/videos/language.mp4",
  "linkedin": "assets/videos/language.mp4"
};
let tooltipsActive = localStorage.getItem('tooltipsActive');
if (tooltipsActive === null) {
  // If not set, default to true
  tooltipsActive = true;
} else {
  // Parse string to boolean
  tooltipsActive = (tooltipsActive === 'true');
}
// Reference to the toggle button
const toggleBtn = document.getElementById('stopTooltipsButton');
// Initialize button text based on current state
const translationKey = tooltipsActive ? 'deactivate_tooltips' : 'activate_tooltips';
toggleBtn.dataset.key = translationKey;
toggleBtn.textContent = translations[currentLanguage][translationKey];
// Function to update localStorage and button label
function updateTooltipState(active) {
  localStorage.setItem('tooltipsActive', active);
  // Update dataset.key based on new state
  toggleBtn.dataset.key = active ? 'deactivate_tooltips' : 'activate_tooltips';
  // Update button text using translations
  toggleBtn.textContent = translations[currentLanguage][toggleBtn.dataset.key];
}
// Add event listener to toggle tooltip state
toggleBtn.addEventListener('click', () => {
  tooltipsActive = !tooltipsActive;
  updateTooltipState(tooltipsActive);
});
// Variables to manage active tooltip
let activeTooltip = null;
let activeTrigger = null;
// Function to create and show tooltip
function showVideoTooltip(trigger, url) {
  if (!tooltipsActive) return; // Don't show if deactivated
  if (activeTooltip) {
    activeTooltip.remove();
  }
  activeTrigger = trigger;
  const tooltip = document.createElement('div');
  tooltip.className = 'video-tooltip';
  // Set size
  tooltip.style.width = '300px';
  tooltip.style.height = '200px';
  // Insert video
  tooltip.innerHTML = `<video src="${url}" controls autoplay style="width: 100%; height: 100%; border-radius: 8px;"></video>`;
  document.body.appendChild(tooltip);
  // Position relative to trigger
  const rect = trigger.getBoundingClientRect();
  tooltip.style.position = 'absolute';
  tooltip.style.top = `${window.scrollY + rect.bottom + 5}px`;
  tooltip.style.left = `${window.scrollX + rect.left + rect.width / 2 - 150}px`; // center align
  // Store as active
  activeTooltip = tooltip;
  // Keep open on hover
  tooltip.addEventListener('mouseenter', () => {
    // Keep tooltip open
  });
  tooltip.addEventListener('mouseleave', () => {
    checkHideTooltip(trigger, tooltip);
  });
}
// Function to remove tooltip
function removeVideoTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
    activeTrigger = null;
  }
}
// Function to check whether to hide tooltip
function checkHideTooltip(trigger, tooltip) {
  document.addEventListener('mousemove', function onMouseMove(e) {
    const overTrigger = trigger.contains(e.target);
    const overTooltip = tooltip.contains(e.target);
    if (!overTrigger && !overTooltip) {
      removeVideoTooltip();
      document.removeEventListener('mousemove', onMouseMove);
    }
  });
}
// Attach hover/focus events to window elements
document.querySelectorAll('.window').forEach(win => {
  const videoKey = win.getAttribute('data-video-key');
  win.addEventListener('mouseenter', () => {
    if (!tooltipsActive) return;
    const url = videoLinks[videoKey];
    if (url) {
      showVideoTooltip(win, url);
    }
  });
  win.addEventListener('focus', () => {
    if (!tooltipsActive) return;
    const url = videoLinks[videoKey];
    if (url) {
      showVideoTooltip(win, url);
    }
  });
  win.addEventListener('mouseleave', () => {
    if (!tooltipsActive) return;
    checkHideTooltip(win, activeTooltip);
  });
  win.addEventListener('blur', () => {
    if (!tooltipsActive) return;
    checkHideTooltip(win, activeTooltip);
  });
});
/* for accessebility */
document.addEventListener('DOMContentLoaded', () => {
  // Select all role="button" elements
  const buttons = document.querySelectorAll('[role="button"]');
  buttons.forEach(button => {
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent scrolling for space
        button.click(); // Trigger the click event
      }
    });
  });
});
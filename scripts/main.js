const translations = {
    en: {
        main_page: "Main Page",
        our_members: "Our Members",
        associations: "Associations",
        chapter_activities: "Chapter Activities",
        contact_us: "Contact Us",
        language: "Language",
        presentation_title: "Presentation of NOC Tunisian Chapter",
        presentation_text: "The IAU National Outreach Committee (NOC) - Tunisia is a scientific outreach initiative under the International Astronomical Union, dedicated to promoting astronomy across Tunisia through public engagement, education, and research. We organize stargazing events, school workshops, and astronomy lectures to inspire students and the general public while supporting amateur and professional astronomers. Our past achievements include nationwide astronomy campaigns and teacher training programs, and we aim to expand access to astronomy in rural areas and establish Tunisia’s first public observatory. Join us in exploring the universe!",
        library: "Library",
        videos: "Videos",
        calendar: "Calendar",
        developer: "Developer: Mejri Ziad",
        version: "Version: 1.0",
        under_development: "Under Development",
        select_language: "Select Language",
        english: "English",
        arabic: "Arabic",
        placeholder_alt: "Placeholder image for NOC Tunisian Chapter"
    },
    ar: {
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
        placeholder_alt: "صورة مؤقتة لفرع NOC التونسي"
    }
};
let currentLanguage = localStorage.getItem('currentLanguage') || 'en'; // Get language from local storage, default to 'en'
// Function to update the text based on the current language
function updateText() {
    // Update all translatable elements
    document.querySelectorAll('.translatable').forEach(element => {
        const key = element.dataset.key;
        if (key && translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    // Update body direction based on language
    document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    // Update title tag
    document.title = currentLanguage === 'ar' ? 
        "فرع NOC التونسي" : 
        "NOC Tunisian Chapter";
}
// Function to create and display the language selection modal
function showLanguageModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('language-modal');
    if (existingModal) {
        existingModal.remove();
    }
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
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
// Function to set the language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('currentLanguage', lang); // Save language preference
    updateText();
}
// Add click event listeners to the windows
document.querySelectorAll('.window').forEach(windowElement => {
    windowElement.addEventListener('click', function(event) {
        const key = this.dataset.key; // Gets from parent div
        if (key === 'language') {
            showLanguageModal();
            return;
        }
        alert(translations[currentLanguage]['under_development']);
        event.preventDefault();
    });
});
// Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateText(); // Update text based on potentially loaded language
});
// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
async function registerPeriodicSync() {
    if ('periodicSync' in registration) {
        try {
            await registration.periodicSync.register('content-refresh', {
                minInterval: 24 * 60 * 60 * 1000 // 24 hours
            });
        } catch (error) {
            console.log('Periodic sync registration failed:', error);
        }
    }
}
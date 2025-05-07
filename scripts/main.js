
const translations = {
    en: {
        main_page: "Main Page",
        our_members: "Our Members",
        associations: "Associations",
        chapter_activities: "Chapter Activities",
        contact_us: "Contact Us",
        language: "Language",
        presentation_title: "Presentation of NOC Tunisian Chapter",
        presentation_text: "This is a placeholder for the presentation of the NOC Tunisian Chapter. You can add information here about the chapter's mission, goals, activities, etc.",
        library: "Library",
        videos: "Videos",
        calendar: "Calendar",
        developer: "Developer: [Name/Organization]",
        version: "Version: 1.0",
        under_development: "Under Development",
        select_language: "Select Language",
        english: "English",
        arabic: "Arabic"
    },
    ar: {
        main_page: "الصفحة الرئيسية",
        our_members: "أعضاؤنا",
        associations: "الجمعيات",
        chapter_activities: "أنشطة الفرع",
        contact_us: "اتصل بنا",
        language: "اللغة",
        presentation_title: "تقديم فرع NOC التونسي",
        presentation_text: "هذا مكان لوصف تقديم فرع NOC التونسي. يمكنك إضافة معلومات هنا حول مهمة الفرع وأهدافه وأنشطته وما إلى ذلك.",
        library: "المكتبة",
        videos: "مقاطع الفيديو",
        calendar: "التقويم",
        developer: "المطور: [اسمك/منظمتك]",
        version: "الإصدار: 1.0",
        under_development: "قيد التطوير",
        select_language: "اختر اللغة",
        english: "الإنجليزية",
        arabic: "العربية"
    }
};

let currentLanguage = localStorage.getItem('currentLanguage') || 'en'; // Get language from local storage, default to 'en'

// Function to update the text based on the current language
function updateText() {
    document.querySelectorAll('.translatable').forEach(element => {
        const key = element.dataset.key;
        if (key && translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });

    // Update body direction based on language
    document.body.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
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
    // Set the text for the title directly based on the current language
    title.textContent = translations[currentLanguage]['select_language'];

    const englishOption = document.createElement('button');
    englishOption.classList.add('language-option');
    // Set the text for English option directly based on the current language
    englishOption.textContent = translations[currentLanguage]['english'];
    englishOption.addEventListener('click', () => {
        setLanguage('en');
        modal.remove();
    });

    const arabicOption = document.createElement('button');
    arabicOption.classList.add('language-option');
    // Set the text for Arabic option directly based on the current language
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
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
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
    windowElement.addEventListener('click', (event) => {
        const key = windowElement.dataset.key;
        if (key === 'language') {
            showLanguageModal();
        } else {
            // Show "Under Development" for other windows
            alert(translations[currentLanguage]['under_development']);
        }
        event.preventDefault();
    });
});

// Initial setup when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateText(); // Update text based on potentially loaded language
});

// Service Worker registration (keep this)
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
// This object will hold the translations
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
        under_development: "Under Development"
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
        under_development: "قيد التطوير"
    }
};

let currentLanguage = 'en'; // Default language

// Function to update the text based on the current language
function updateText() {
    document.querySelectorAll('.translatable').forEach(element => {
        const key = element.dataset.key; // Use data-key directly
        if (key && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Add click event listeners to the windows
document.querySelectorAll('.window').forEach(windowElement => {
    windowElement.addEventListener('click', (event) => {
        const key = windowElement.dataset.key;
        if (key === 'language') {
            // Handle language switching
            currentLanguage = currentLanguage === 'en' ? 'ar' : 'en';
            updateText();
        } else {
            // Show "Under Development" for other windows
            alert(translations[currentLanguage]['under_development']);
        }
        // Prevent default link behavior if the windows were links (they are divs here)
        event.preventDefault();
    });
});


// Initial text update when the page loads
document.addEventListener('DOMContentLoaded', updateText);
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
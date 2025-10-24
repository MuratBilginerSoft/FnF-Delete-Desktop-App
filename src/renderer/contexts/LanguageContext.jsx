import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Translations
const translations = {
  tr: {
    // Splash Screen
    'splash.loading': 'Yükleniyor...',
    'splash.appName': 'FnF Delete',
    'splash.tagline': 'Dosya & Klasör Silme Yöneticisi',

    // Profile Selection
    'profile.select': 'Profil Seçin',
    'profile.create': 'Yeni Profil Oluştur',
    'profile.createNew': 'Profil Oluştur',
    'profile.createSubtitle': 'Yeni bir profil oluşturun ve dosya silme işlemlerinizi takip edin',
    'profile.name': 'Profil Adı',
    'profile.namePlaceholder': 'Profil adını girin',
    'profile.color': 'Avatar Rengi',
    'profile.cancel': 'İptal',
    'profile.save': 'Kaydet',
    'profile.delete': 'Profili Sil',
    'profile.deleteConfirm': 'Bu profili silmek istediğinizden emin misiniz? Tüm istatistikler de silinecek.',
    'profile.deleteWarning': 'Bu işlem geri alınamaz! Tüm istatistikler ve veriler kalıcı olarak silinecektir.',
    'profile.lastUsed': 'Son kullanım:',
    'profile.noProfiles': 'Henüz profil oluşturulmamış',
    'profile.createFirst': 'Başlamak için bir profil oluşturun',
    'profile.chooseOrCreate': 'Bir profil seçin veya yeni profil oluşturun',

    // Main Dashboard
    'dashboard.title': 'Kontrol Paneli',
    'dashboard.welcome': 'Hoş geldiniz',
    'dashboard.stats.operations': 'Toplam İşlem',
    'dashboard.stats.filesDeleted': 'Silinen Dosya',
    'dashboard.stats.sizeDeleted': 'Silinen Boyut',
    'dashboard.stats.extensions': 'Farklı Uzantı',

    // File Deletion
    'delete.title': 'Dosya Silme',
    'delete.selectPath': 'Klasör Seç',
    'delete.scanPath': 'Taranacak Klasör',
    'delete.pathPlaceholder': 'Taramak için bir klasör seçin...',
    'delete.browse': 'Gözat',
    'delete.pasteFromClipboard': 'Panodan Yapıştır',
    'delete.clearPath': 'Temizle',
    'delete.extensions': 'Dosya Uzantıları',
    'delete.extensionsPlaceholder': 'mp3, mp4, jpg (virgülle ayırın)',
    'delete.extensionsHelp': 'Aşağıdaki uzantılara tıklayarak hızlıca ekleyebilir veya kendiniz manuel olarak yazabilirsiniz',
    'delete.addAll': 'Tümünü Ekle',
    'delete.mode': 'Silme Modu',
    'delete.modeInclude': 'Sadece Bu Uzantıları Sil',
    'delete.modeIncludeDesc': 'Belirttiğiniz uzantılara sahip dosyalar silinir. Örnek: mp3,mp4,jpg',
    'delete.modeExclude': 'Bu Uzantılar Hariç Tümünü Sil',
    'delete.modeExcludeDesc': 'Belirttiğiniz uzantılar hariç tüm dosyalar silinir. Dikkatli kullanın!',
    'delete.mediaFiles': 'Medya',
    'delete.imageFiles': 'Resim',
    'delete.documentFiles': 'Doküman',
    'delete.archiveFiles': 'Arşiv',
    'delete.scan': 'Tara',
    'delete.scanning': 'Taranıyor...',
    'delete.preview': 'Önizleme',
    'delete.includeMode': 'Sadece Seçili Uzantılar',
    'delete.excludeMode': 'Seçili Uzantılar Hariç',
    'delete.filesFound': 'dosya bulundu',
    'delete.totalSize': 'Toplam Boyut',
    'delete.fileCount': 'Dosya Sayısı',
    'delete.moveToTrash': 'Çöp Kutusuna Taşı',
    'delete.confirmTitle': 'Dosyaları Çöp Kutusuna Taşı',
    'delete.confirmDelete': 'Çöp Kutusuna Taşı',
    'delete.confirmMessage': 'Seçilen dosyalar çöp kutusuna taşınacak. İsterseniz çöp kutusundan geri getirebilir veya kalıcı olarak silebilirsiniz.',
    'delete.deleting': 'Taşınıyor...',
    'delete.delete': 'Sil',
    'delete.success': 'Dosyalar başarıyla silindi!',
    'delete.successMessage': 'Dosyalar başarıyla çöp kutusuna taşındı!',
    'delete.error': 'Hata oluştu',
    'delete.noFiles': 'Dosya bulunamadı',

    // Statistics
    'stats.title': 'İstatistikler',
    'stats.byExtension': 'Uzantıya Göre',
    'stats.byDate': 'Tarihe Göre',
    'stats.recentOperations': 'Son İşlemler',
    'stats.noData': 'Henüz veri yok',
    'stats.files': 'dosya',
    'stats.date': 'Tarih',
    'stats.count': 'Adet',
    'stats.size': 'Boyut',

    // Navigation
    'nav.dashboard': 'Kontrol Paneli',
    'nav.delete': 'Dosya Sil',
    'nav.statistics': 'İstatistikler',
    'nav.changelog': 'Değişiklik Günlüğü',
    'nav.settings': 'Ayarlar',
    'nav.profile': 'Profil',

    // Settings
    'settings.title': 'Ayarlar',
    'settings.theme': 'Tema',
    'settings.language': 'Dil',
    'settings.dark': 'Koyu',
    'settings.light': 'Açık',

    // Changelog
    'changelog.title': 'Değişiklik Günlüğü',
    'changelog.subtitle': 'Uygulamada yapılan güncellemeleri ve değişiklikleri takip edin',
    'changelog.category.feature': 'Yeni Özellikler',
    'changelog.category.improvement': 'İyileştirmeler',
    'changelog.category.fix': 'Hata Düzeltmeleri',

    // v1.0.0 Changelog
    'changelog.v1.profile.management': 'Çoklu profil yönetimi sistemi',
    'changelog.v1.profile.custom': 'Özelleştirilebilir profil renkleri ve avatarları',
    'changelog.v1.profile.delete': 'Profil silme özelliği ve onay modalları',
    'changelog.v1.deletion.modes': 'İki silme modu: Sadece seçili uzantılar & Hariç tüm dosyalar',
    'changelog.v1.deletion.preview': 'Silme öncesi dosya önizleme ve detaylı analiz',
    'changelog.v1.deletion.batch': 'Toplu dosya silme işlemleri',
    'changelog.v1.stats.charts': 'Gelişmiş istatistik grafikleri (Pasta, Çizgi, Bar)',
    'changelog.v1.stats.timeline': 'Tarih bazlı silme işlemi takibi',
    'changelog.v1.stats.extension': 'Dosya uzantısına göre detaylı analiz',
    'changelog.v1.ui.modern': 'Modern ve şık kullanıcı arayüzü',
    'changelog.v1.ui.theme': 'Koyu ve açık tema desteği',
    'changelog.v1.ui.animations': 'Akıcı animasyonlar ve geçişler',
    'changelog.v1.ui.responsive': 'Responsive tasarım desteği',
    'changelog.v1.system.sqlite': 'SQLite veritabanı entegrasyonu',
    'changelog.v1.system.multilang': 'Çoklu dil desteği (Türkçe & İngilizce)',
    'changelog.v1.system.electron': 'Electron.js tabanlı masaüstü uygulama',

    // Common
    'common.close': 'Kapat',
    'common.confirm': 'Onayla',
    'common.cancel': 'İptal',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    'common.yes': 'Evet',
    'common.back': 'Geri',
    'common.no': 'Hayır',
    'common.about': 'Hakkında',

    // About page
    'about.subtitle': 'Dosya ve Klasör Silme Yöneticisi',
    'about.description': 'Uygulama Hakkında',
    'about.descriptionText': 'FnF Delete, dosya ve klasörlerinizi güvenli bir şekilde yönetmenize ve silmenize yardımcı olan profesyonel bir masaüstü uygulamasıdır. Gelişmiş tarama özellikleri ve detaylı istatistiklerle dosya silme işlemlerinizi kolayca takip edebilirsiniz.',
    'about.features.title': 'Özellikler',
    'about.features.scanning': 'Gelişmiş Tarama',
    'about.features.scanningDesc': 'Dosya uzantılarına göre hızlı ve etkili tarama yapın',
    'about.features.statistics': 'Detaylı İstatistikler',
    'about.features.statisticsDesc': 'Silme işlemlerinizi takip edin ve analiz edin',
    'about.features.profiles': 'Çoklu Profil',
    'about.features.profilesDesc': 'Farklı kullanıcılar için ayrı profiller oluşturun',
    'about.features.themes': 'Tema Desteği',
    'about.features.themesDesc': 'Koyu ve açık tema seçenekleri ile rahat kullanım',
    'about.company': 'Brainy Tech tarafından geliştirilmiştir. Profesyonel yazılım çözümleri sunuyoruz.',
    'about.copyrightText': 'Tüm hakları saklıdır.',
  },
  en: {
    // Splash Screen
    'splash.loading': 'Loading...',
    'splash.appName': 'FnF Delete',
    'splash.tagline': 'File & Folder Deletion Manager',

    // Profile Selection
    'profile.select': 'Select Profile',
    'profile.create': 'Create New Profile',
    'profile.createNew': 'Create Profile',
    'profile.createSubtitle': 'Create a new profile and track your file deletion operations',
    'profile.name': 'Profile Name',
    'profile.namePlaceholder': 'Enter profile name',
    'profile.color': 'Avatar Color',
    'profile.cancel': 'Cancel',
    'profile.save': 'Save',
    'profile.delete': 'Delete Profile',
    'profile.deleteConfirm': 'Are you sure you want to delete this profile? All statistics will be deleted.',
    'profile.deleteWarning': 'This action cannot be undone! All statistics and data will be permanently deleted.',
    'profile.lastUsed': 'Last used:',
    'profile.noProfiles': 'No profiles created yet',
    'profile.createFirst': 'Create a profile to get started',
    'profile.chooseOrCreate': 'Choose a profile or create a new one',

    // Main Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.stats.operations': 'Total Operations',
    'dashboard.stats.filesDeleted': 'Files Deleted',
    'dashboard.stats.sizeDeleted': 'Size Deleted',
    'dashboard.stats.extensions': 'Unique Extensions',

    // File Deletion
    'delete.title': 'File Deletion',
    'delete.selectPath': 'Select Folder',
    'delete.scanPath': 'Folder to Scan',
    'delete.pathPlaceholder': 'Select a folder to scan...',
    'delete.browse': 'Browse',
    'delete.pasteFromClipboard': 'Paste from Clipboard',
    'delete.clearPath': 'Clear',
    'delete.extensions': 'File Extensions',
    'delete.extensionsPlaceholder': 'mp3, mp4, jpg (comma-separated)',
    'delete.extensionsHelp': 'Click on extensions below to quickly add them or type manually',
    'delete.addAll': 'Add All',
    'delete.mode': 'Deletion Mode',
    'delete.modeInclude': 'Delete Only These Extensions',
    'delete.modeIncludeDesc': 'Only files with specified extensions will be deleted. Example: mp3,mp4,jpg',
    'delete.modeExclude': 'Delete All Except These',
    'delete.modeExcludeDesc': 'All files except specified extensions will be deleted. Use with caution!',
    'delete.mediaFiles': 'Media',
    'delete.imageFiles': 'Images',
    'delete.documentFiles': 'Documents',
    'delete.archiveFiles': 'Archives',
    'delete.scan': 'Scan',
    'delete.scanning': 'Scanning...',
    'delete.preview': 'Preview',
    'delete.includeMode': 'Only Selected Extensions',
    'delete.excludeMode': 'Except Selected Extensions',
    'delete.filesFound': 'files found',
    'delete.totalSize': 'Total Size',
    'delete.fileCount': 'File Count',
    'delete.moveToTrash': 'Move to Trash',
    'delete.confirmTitle': 'Move Files to Trash',
    'delete.confirmDelete': 'Move to Trash',
    'delete.confirmMessage': 'Selected files will be moved to trash. You can restore them from trash or permanently delete them later.',
    'delete.deleting': 'Moving...',
    'delete.delete': 'Delete',
    'delete.success': 'Files deleted successfully!',
    'delete.successMessage': 'Files successfully moved to trash!',
    'delete.error': 'An error occurred',
    'delete.noFiles': 'No files found',

    // Statistics
    'stats.title': 'Statistics',
    'stats.byExtension': 'By Extension',
    'stats.byDate': 'By Date',
    'stats.recentOperations': 'Recent Operations',
    'stats.noData': 'No data yet',
    'stats.files': 'files',
    'stats.date': 'Date',
    'stats.count': 'Count',
    'stats.size': 'Size',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.delete': 'Delete Files',
    'nav.statistics': 'Statistics',
    'nav.changelog': 'Changelog',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.dark': 'Dark',
    'settings.light': 'Light',

    // Changelog
    'changelog.title': 'Changelog',
    'changelog.subtitle': 'Track updates and changes made to the application',
    'changelog.category.feature': 'New Features',
    'changelog.category.improvement': 'Improvements',
    'changelog.category.fix': 'Bug Fixes',

    // v1.0.0 Changelog
    'changelog.v1.profile.management': 'Multi-profile management system',
    'changelog.v1.profile.custom': 'Customizable profile colors and avatars',
    'changelog.v1.profile.delete': 'Profile deletion feature with confirmation modals',
    'changelog.v1.deletion.modes': 'Two deletion modes: Include only & Exclude all',
    'changelog.v1.deletion.preview': 'Pre-deletion file preview and detailed analysis',
    'changelog.v1.deletion.batch': 'Batch file deletion operations',
    'changelog.v1.stats.charts': 'Advanced statistics charts (Pie, Line, Bar)',
    'changelog.v1.stats.timeline': 'Date-based deletion operation tracking',
    'changelog.v1.stats.extension': 'Detailed analysis by file extension',
    'changelog.v1.ui.modern': 'Modern and elegant user interface',
    'changelog.v1.ui.theme': 'Dark and light theme support',
    'changelog.v1.ui.animations': 'Smooth animations and transitions',
    'changelog.v1.ui.responsive': 'Responsive design support',
    'changelog.v1.system.sqlite': 'SQLite database integration',
    'changelog.v1.system.multilang': 'Multi-language support (Turkish & English)',
    'changelog.v1.system.electron': 'Electron.js based desktop application',

    // Common
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.about': 'About',

    // About page
    'about.subtitle': 'File & Folder Deletion Manager',
    'about.description': 'About the Application',
    'about.descriptionText': 'FnF Delete is a professional desktop application that helps you safely manage and delete your files and folders. With advanced scanning features and detailed statistics, you can easily track your file deletion operations.',
    'about.features.title': 'Features',
    'about.features.scanning': 'Advanced Scanning',
    'about.features.scanningDesc': 'Fast and efficient scanning based on file extensions',
    'about.features.statistics': 'Detailed Statistics',
    'about.features.statisticsDesc': 'Track and analyze your deletion operations',
    'about.features.profiles': 'Multiple Profiles',
    'about.features.profilesDesc': 'Create separate profiles for different users',
    'about.features.themes': 'Theme Support',
    'about.features.themesDesc': 'Dark and light theme options for comfortable usage',
    'about.company': 'Developed by Brainy Tech. We provide professional software solutions.',
    'about.copyrightText': 'All rights reserved.',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

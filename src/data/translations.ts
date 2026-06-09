import type { Language } from '../types';

type TranslationKey =
  | 'streak'
  | 'quiz_nativeToDutch'
  | 'quiz_dutchToNative'
  | 'quiz_article'
  | 'quiz_nativeToDutch_desc'
  | 'quiz_dutchToNative_desc'
  | 'quiz_article_desc'
  | 'selectQuizType'
  | 'back'
  | 'whatIsDutch'
  | 'whatIsArticle'
  | 'correct'
  | 'incorrect'
  | 'todayPracticed'
  | 'unseen'
  | 'learning'
  | 'mastered'
  | 'difficult'
  | 'todayProgress'
  | 'words'
  | 'accuracy'
  | 'daySeries'
  | 'unseenWords'
  | 'learningWords'
  | 'masteredWords'
  | 'difficultWords'
  | 'emptyCategory'
  | 'wordPool'
  | 'wordPoolDesc'
  | 'wordsSelected'
  | 'pack'
  | 'type_noun'
  | 'type_verb'
  | 'type_adj'
  | 'type_adv'
  | 'type_prep'
  | 'type_conj'
  | 'type_phrase'
  | 'type_num'
  | 'type_pron'
  | 'pinnedWords'
  | 'pinnedWordsDesc'
  | 'pinnedWordsDisabled'
  | 'quiz_nativeToDutch_write'
  | 'quiz_nativeToDutch_write_desc'
  | 'quiz_verbForms'
  | 'quiz_verbForms_desc'
  | 'writeTheDutch'
  | 'writeTheInfinitief'
  | 'writeThePerfectum'
  | 'writeTheImperfectum'
  | 'skip'
  | 'correctAnswer'
  | 'update'
  | 'updateAvailable'
  | 'lb_today'
  | 'lb_7days'
  | 'lb_30days'
  | 'lb_loading'
  | 'lb_empty'
  | 'lb_update_note'
  | 'lb_gate_text'
  | 'lb_signin_google'
  | 'profile_account'
  | 'profile_signin_reason1'
  | 'profile_signin_reason2'
  | 'profile_username'
  | 'profile_username_placeholder'
  | 'profile_username_taken'
  | 'profile_avatar_change'
  | 'profile_avatar_close'
  | 'profile_save'
  | 'profile_saving'
  | 'profile_saved'
  | 'profile_error'
  | 'profile_last_sync'
  | 'profile_next_action'
  | 'profile_sync_data'
  | 'profile_sync_desc'
  | 'profile_get_data'
  | 'profile_get_desc'
  | 'profile_upload_data'
  | 'profile_upload_desc'
  | 'profile_processing'
  | 'profile_done'
  | 'profile_action_error'
  | 'profile_delete_all'
  | 'profile_delete_desc'
  | 'profile_delete_confirm'
  | 'profile_signout'
  | 'settings_theme'
  | 'settings_light'
  | 'settings_dark'
  | 'settings_data'
  | 'settings_export'
  | 'settings_import'
  | 'settings_visitor'
  | 'settings_visitors'
  | 'tab_leaderboard'
  | 'tab_profile'
  | 'tab_settings'
  | 'alert_leaderboard_promo'
  | 'alert_action_goToProfile'
  | 'alert_action_signIn'
  | 'alert_dismiss';

type Translations = Record<Language, Record<TranslationKey, string>>;

export const translations: Translations = {
  tr: {
    streak: 'Günlük seri',
    selectQuizType: 'Test Türü Seç',
    quiz_nativeToDutch: 'Türkçe → Hollandaca',
    quiz_dutchToNative: 'Hollandaca → Türkçe',
    quiz_article: 'Artikel Testi',
    quiz_nativeToDutch_desc: 'Kelimenin Hollandaca karşılığını seç',
    quiz_dutchToNative_desc: 'Hollandaca kelimenin anlamını seç',
    quiz_article_desc: "Kelimenin artikel'ini seç (de/het)",
    back: 'Geri',
    whatIsDutch: "Hollandaca'da ne demek?",
    whatIsArticle: "Bu kelimenin artikel'i nedir?",
    correct: 'Doğru!',
    incorrect: 'Yanlış',
    todayPracticed: 'Bugün: {count} kelime',
    unseen: 'Yeni',
    learning: 'Öğreniliyor',
    mastered: 'Öğrenildi',
    difficult: 'Zor',
    todayProgress: 'Bugünkü İlerleme',
    words: 'kelime',
    accuracy: 'doğruluk',
    daySeries: 'gün seri',
    unseenWords: 'Yeni Kelimeler',
    learningWords: 'Öğrenilen Kelimeler',
    masteredWords: 'Bilinen Kelimeler',
    difficultWords: 'Zor Kelimeler',
    emptyCategory: 'Bu kategoride kelime yok',
    wordPool: 'Kelime Havuzu',
    wordPoolDesc: '{count} kelime secili',
    wordsSelected: '{count} kelime',
    pack: 'Paket {num}',
    type_noun: 'isim',
    type_verb: 'fiil',
    type_adj: 'sıfat',
    type_adv: 'zarf',
    type_prep: 'edat',
    type_conj: 'bağlaç',
    type_phrase: 'deyim',
    type_num: 'sayı',
    type_pron: 'zamir',
    pinnedWords: 'Pinli Kelimeler',
    pinnedWordsDesc: '{count} kelime pinli',
    pinnedWordsDisabled: 'Kilidini açmak için {count} kelime pinleyin',
    quiz_nativeToDutch_write: 'Yazma Testi',
    quiz_nativeToDutch_write_desc: 'Hollandaca karşılığını yaz',
    quiz_verbForms: 'Fiil Formları',
    quiz_verbForms_desc: 'Perfectum veya imperfectum yaz',
    writeTheDutch: 'Hollandaca karşılığını yazın',
    writeTheInfinitief: 'Infinitief halini yazın',
    writeThePerfectum: 'Perfectum halini yazın',
    writeTheImperfectum: 'Imperfectum halini yazın',
    skip: 'Geç',
    correctAnswer: 'Doğrusu: {answer}',
    update: 'Güncelle',
    updateAvailable: 'Yeni versiyon mevcut',
    lb_today: 'Bugün',
    lb_7days: '7 Gün',
    lb_30days: '30 Gün',
    lb_loading: 'Yükleniyor...',
    lb_empty: 'Henüz veri yok.',
    lb_update_note: 'Saat başı +5 dk. güncellenir · Sonraki: {time}',
    lb_gate_text: 'Sıralamayı görmek için giriş yapın',
    lb_signin_google: 'Google ile giriş yap',
    profile_account: 'Hesap',
    profile_signin_reason1: 'Verilerinizi online yedeklemek için',
    profile_signin_reason2: "Leaderboard'da yerinizi görmek için",
    profile_username: 'Kullanıcı Adı',
    profile_username_placeholder: 'Kullanıcı adınız',
    profile_username_taken: 'Bu kullanıcı adı zaten alınmış.',
    profile_avatar_change: 'Değiştir',
    profile_avatar_close: 'Kapat',
    profile_save: 'Kaydet',
    profile_saving: 'Kaydediliyor...',
    profile_saved: 'Kaydedildi',
    profile_error: 'Bir hata oluştu',
    profile_last_sync: 'Son yedek: {date}',
    profile_next_action: 'Sonraki işlem için: {time}',
    profile_sync_data: 'Sync Data',
    profile_sync_desc: 'Sunucudaki veriyi çeker, yerel veriyle birleştirir ve tekrar yükler. Her iki taraf da aynı veriye sahip olur.',
    profile_get_data: 'Get Data',
    profile_get_desc: 'Sunucudaki veriyi çeker ve yerel verinin üzerine yazar. Yerel değişiklikler kaybolur.',
    profile_upload_data: 'Upload Data',
    profile_upload_desc: 'Yerel veriyi sunucuya yükler ve sunucudaki verinin üzerine yazar.',
    profile_processing: 'İşleniyor...',
    profile_done: 'Tamamlandı',
    profile_action_error: 'Hata oluştu',
    profile_delete_all: 'Tüm İlerlemeyi Sil',
    profile_delete_desc: 'Tüm kelime ilerlemesi, istatistikler ve seri bilgisi silinir. Bu işlem geri alınamaz.',
    profile_delete_confirm: 'Tüm ilerleme silinecek. Emin misiniz?',
    profile_signout: 'Çıkış yap',
    settings_theme: 'Tema',
    settings_light: 'Açık',
    settings_dark: 'Koyu',
    settings_data: 'Veri',
    settings_export: 'Dışa Aktar',
    settings_import: 'İçe Aktar',
    settings_visitor: 'ziyaretçi',
    settings_visitors: 'ziyaretçi',
    tab_leaderboard: 'Sıralama',
    tab_profile: 'Profil',
    tab_settings: 'Ayarlar',
    alert_leaderboard_promo: 'Giriş yap ve diğer kullanıcılarla skor tablosunda yarış!',
    alert_action_goToProfile: 'Profil',
    alert_action_signIn: 'Giriş yap',
    alert_dismiss: 'Anladım',
  },

  en: {
    streak: 'Daily streak',
    selectQuizType: 'Select Quiz Type',
    quiz_nativeToDutch: 'English → Dutch',
    quiz_dutchToNative: 'Dutch → English',
    quiz_article: 'Article Test',
    quiz_nativeToDutch_desc: 'Select the Dutch translation',
    quiz_dutchToNative_desc: 'Select the meaning of the Dutch word',
    quiz_article_desc: 'Select the article (de/het)',
    back: 'Back',
    whatIsDutch: 'What is it in Dutch?',
    whatIsArticle: 'What is the article?',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    todayPracticed: 'Today: {count} words',
    unseen: 'New',
    learning: 'Learning',
    mastered: 'Mastered',
    difficult: 'Difficult',
    todayProgress: "Today's Progress",
    words: 'words',
    accuracy: 'accuracy',
    daySeries: 'day streak',
    unseenWords: 'New Words',
    learningWords: 'Learning Words',
    masteredWords: 'Mastered Words',
    difficultWords: 'Difficult Words',
    emptyCategory: 'No words in this category',
    wordPool: 'Word Pool',
    wordPoolDesc: '{count} words selected',
    wordsSelected: '{count} words',
    pack: 'Pack {num}',
    type_noun: 'noun',
    type_verb: 'verb',
    type_adj: 'adjective',
    type_adv: 'adverb',
    type_prep: 'preposition',
    type_conj: 'conjunction',
    type_phrase: 'phrase',
    type_num: 'number',
    type_pron: 'pronoun',
    pinnedWords: 'Pinned Words',
    pinnedWordsDesc: '{count} words pinned',
    pinnedWordsDisabled: 'Pin {count} words to unlock',
    quiz_nativeToDutch_write: 'Writing Test',
    quiz_nativeToDutch_write_desc: 'Write the Dutch translation',
    quiz_verbForms: 'Verb Forms',
    quiz_verbForms_desc: 'Write perfectum or imperfectum',
    writeTheDutch: 'Write the Dutch word',
    writeTheInfinitief: 'Write the infinitive form',
    writeThePerfectum: 'Write the perfectum form',
    writeTheImperfectum: 'Write the imperfectum form',
    skip: 'Skip',
    correctAnswer: 'Correct: {answer}',
    update: 'Update',
    updateAvailable: 'New version available',
    lb_today: 'Today',
    lb_7days: '7 Days',
    lb_30days: '30 Days',
    lb_loading: 'Loading...',
    lb_empty: 'No data yet.',
    lb_update_note: 'Updates every hour +5 min · Next: {time}',
    lb_gate_text: 'Sign in to see the rankings',
    lb_signin_google: 'Sign in with Google',
    profile_account: 'Account',
    profile_signin_reason1: 'To back up your data online',
    profile_signin_reason2: 'To appear on the leaderboard',
    profile_username: 'Username',
    profile_username_placeholder: 'Your username',
    profile_username_taken: 'This username is already taken.',
    profile_avatar_change: 'Change',
    profile_avatar_close: 'Close',
    profile_save: 'Save',
    profile_saving: 'Saving...',
    profile_saved: 'Saved',
    profile_error: 'An error occurred',
    profile_last_sync: 'Last backup: {date}',
    profile_next_action: 'Next action in: {time}',
    profile_sync_data: 'Sync Data',
    profile_sync_desc: 'Fetches server data, merges with local, and uploads. Both sides end up with the same data.',
    profile_get_data: 'Get Data',
    profile_get_desc: 'Fetches server data and overwrites local. Local changes will be lost.',
    profile_upload_data: 'Upload Data',
    profile_upload_desc: 'Uploads local data to the server and overwrites the server copy.',
    profile_processing: 'Processing...',
    profile_done: 'Done',
    profile_action_error: 'Error occurred',
    profile_delete_all: 'Delete All Progress',
    profile_delete_desc: 'All word progress, statistics, and streak data will be deleted. This cannot be undone.',
    profile_delete_confirm: 'All progress will be deleted. Are you sure?',
    profile_signout: 'Sign out',
    settings_theme: 'Theme',
    settings_light: 'Light',
    settings_dark: 'Dark',
    settings_data: 'Data',
    settings_export: 'Export',
    settings_import: 'Import',
    settings_visitor: 'visitor',
    settings_visitors: 'visitors',
    tab_leaderboard: 'Leaderboard',
    tab_profile: 'Profile',
    tab_settings: 'Settings',
    alert_leaderboard_promo: 'Sign in and compete with others on the leaderboard!',
    alert_action_goToProfile: 'Profile',
    alert_action_signIn: 'Sign in',
    alert_dismiss: 'Got it',
  },

  ar: {
    streak: 'السلسلة اليومية',
    selectQuizType: 'اختر نوع الاختبار',
    quiz_nativeToDutch: 'عربي ← هولندي',
    quiz_dutchToNative: 'هولندي ← عربي',
    quiz_article: 'اختبار الأداة',
    quiz_nativeToDutch_desc: 'اختر الترجمة الهولندية',
    quiz_dutchToNative_desc: 'اختر معنى الكلمة الهولندية',
    quiz_article_desc: '(de/het) اختر الأداة',
    back: 'رجوع',
    whatIsDutch: 'ما هي بالهولندية؟',
    whatIsArticle: 'ما هي أداة هذه الكلمة؟',
    correct: '!صحيح',
    incorrect: 'خطأ',
    todayPracticed: 'اليوم: {count} كلمة',
    unseen: 'جديد',
    learning: 'قيد التعلم',
    mastered: 'تم إتقانها',
    difficult: 'صعب',
    todayProgress: 'تقدم اليوم',
    words: 'كلمات',
    accuracy: 'دقة',
    daySeries: 'يوم متتالي',
    unseenWords: 'كلمات جديدة',
    learningWords: 'كلمات قيد التعلم',
    masteredWords: 'كلمات متقنة',
    difficultWords: 'كلمات صعبة',
    emptyCategory: 'لا توجد كلمات في هذه الفئة',
    wordPool: 'مجموعة الكلمات',
    wordPoolDesc: '{count} كلمة مختارة',
    wordsSelected: '{count} كلمة',
    pack: 'حزمة {num}',
    type_noun: 'اسم',
    type_verb: 'فعل',
    type_adj: 'صفة',
    type_adv: 'ظرف',
    type_prep: 'حرف جر',
    type_conj: 'حرف عطف',
    type_phrase: 'عبارة',
    type_num: 'رقم',
    type_pron: 'ضمير',
    pinnedWords: 'كلمات مثبتة',
    pinnedWordsDesc: '{count} كلمة مثبتة',
    pinnedWordsDisabled: 'ثبّت {count} كلمة لفتح هذا الاختبار',
    quiz_nativeToDutch_write: 'اختبار الكتابة',
    quiz_nativeToDutch_write_desc: 'اكتب الترجمة الهولندية',
    quiz_verbForms: 'صيغ الفعل',
    quiz_verbForms_desc: 'اكتب الماضي أو الماضي التام',
    writeTheDutch: 'اكتب الكلمة بالهولندية',
    writeTheInfinitief: 'اكتب صيغة المصدر',
    writeThePerfectum: 'اكتب صيغة الماضي التام',
    writeTheImperfectum: 'اكتب صيغة الماضي',
    skip: 'تخطي',
    correctAnswer: 'الصحيح: {answer}',
    update: 'تحديث',
    updateAvailable: 'يتوفر إصدار جديد',
    lb_today: 'اليوم',
    lb_7days: '٧ أيام',
    lb_30days: '٣٠ يوماً',
    lb_loading: 'جارٍ التحميل...',
    lb_empty: 'لا توجد بيانات بعد.',
    lb_update_note: 'يتحدث كل ساعة +٥ دقائق · التالي: {time}',
    lb_gate_text: 'سجّل الدخول لرؤية الترتيب',
    lb_signin_google: 'تسجيل الدخول بـ Google',
    profile_account: 'الحساب',
    profile_signin_reason1: 'لنسخ بياناتك احتياطياً عبر الإنترنت',
    profile_signin_reason2: 'للظهور في قائمة المتصدرين',
    profile_username: 'اسم المستخدم',
    profile_username_placeholder: 'اسم المستخدم',
    profile_username_taken: 'اسم المستخدم هذا مأخوذ بالفعل.',
    profile_avatar_change: 'تغيير',
    profile_avatar_close: 'إغلاق',
    profile_save: 'حفظ',
    profile_saving: 'جارٍ الحفظ...',
    profile_saved: 'تم الحفظ',
    profile_error: 'حدث خطأ',
    profile_last_sync: 'آخر نسخة احتياطية: {date}',
    profile_next_action: 'الإجراء التالي خلال: {time}',
    profile_sync_data: 'مزامنة البيانات',
    profile_sync_desc: 'يجلب بيانات الخادم ويدمجها مع المحلية ثم يرفعها. كلا الطرفين سيملكان نفس البيانات.',
    profile_get_data: 'جلب البيانات',
    profile_get_desc: 'يجلب بيانات الخادم ويستبدل المحلية. ستُفقد التغييرات المحلية.',
    profile_upload_data: 'رفع البيانات',
    profile_upload_desc: 'يرفع البيانات المحلية إلى الخادم ويستبدل النسخة الموجودة.',
    profile_processing: 'جارٍ المعالجة...',
    profile_done: 'تم',
    profile_action_error: 'حدث خطأ',
    profile_delete_all: 'حذف كل التقدم',
    profile_delete_desc: 'سيتم حذف كل تقدم الكلمات والإحصائيات وبيانات السلسلة. لا يمكن التراجع عن هذا.',
    profile_delete_confirm: 'سيتم حذف كل التقدم. هل أنت متأكد؟',
    profile_signout: 'تسجيل الخروج',
    settings_theme: 'المظهر',
    settings_light: 'فاتح',
    settings_dark: 'داكن',
    settings_data: 'البيانات',
    settings_export: 'تصدير',
    settings_import: 'استيراد',
    settings_visitor: 'زائر',
    settings_visitors: 'زوار',
    tab_leaderboard: 'الترتيب',
    tab_profile: 'الملف',
    tab_settings: 'الإعدادات',
    alert_leaderboard_promo: 'سجّل الدخول وتنافس مع المستخدمين الآخرين في قائمة المتصدرين!',
    alert_action_goToProfile: 'الملف',
    alert_action_signIn: 'تسجيل الدخول',
    alert_dismiss: 'فهمت',
  },

  fr: {
    streak: 'Série quotidienne',
    selectQuizType: 'Choisir le type de quiz',
    quiz_nativeToDutch: 'Français → Néerlandais',
    quiz_dutchToNative: 'Néerlandais → Français',
    quiz_article: "Test d'article",
    quiz_nativeToDutch_desc: 'Choisissez la traduction néerlandaise',
    quiz_dutchToNative_desc: 'Choisissez la signification du mot',
    quiz_article_desc: "Choisissez l'article (de/het)",
    back: 'Retour',
    whatIsDutch: 'Comment dit-on en néerlandais ?',
    whatIsArticle: "Quel est l'article ?",
    correct: 'Correct !',
    incorrect: 'Incorrect',
    todayPracticed: "Aujourd'hui : {count} mots",
    unseen: 'Nouveau',
    learning: 'En cours',
    mastered: 'Maîtrisé',
    difficult: 'Difficile',
    todayProgress: 'Progrès du jour',
    words: 'mots',
    accuracy: 'précision',
    daySeries: 'jours de suite',
    unseenWords: 'Nouveaux mots',
    learningWords: 'Mots en apprentissage',
    masteredWords: 'Mots maîtrisés',
    difficultWords: 'Mots difficiles',
    emptyCategory: 'Aucun mot dans cette catégorie',
    wordPool: 'Groupe de mots',
    wordPoolDesc: '{count} mots selectionnes',
    wordsSelected: '{count} mots',
    pack: 'Pack {num}',
    type_noun: 'nom',
    type_verb: 'verbe',
    type_adj: 'adjectif',
    type_adv: 'adverbe',
    type_prep: 'préposition',
    type_conj: 'conjonction',
    type_phrase: 'expression',
    type_num: 'nombre',
    type_pron: 'pronom',
    pinnedWords: 'Mots épinglés',
    pinnedWordsDesc: '{count} mots épinglés',
    pinnedWordsDisabled: 'Épinglez {count} mots pour déverrouiller',
    quiz_nativeToDutch_write: 'Test d\'écriture',
    quiz_nativeToDutch_write_desc: 'Écrivez la traduction néerlandaise',
    quiz_verbForms: 'Formes verbales',
    quiz_verbForms_desc: 'Écrivez le perfectum ou imperfectum',
    writeTheDutch: 'Écrivez le mot en néerlandais',
    writeTheInfinitief: 'Écrivez la forme infinitive',
    writeThePerfectum: 'Écrivez la forme perfectum',
    writeTheImperfectum: 'Écrivez la forme imperfectum',
    skip: 'Passer',
    correctAnswer: 'Correct: {answer}',
    update: 'Mettre à jour',
    updateAvailable: 'Nouvelle version disponible',
    lb_today: "Aujourd'hui",
    lb_7days: '7 Jours',
    lb_30days: '30 Jours',
    lb_loading: 'Chargement...',
    lb_empty: 'Pas encore de données.',
    lb_update_note: 'Mise à jour toutes les heures +5 min · Prochain: {time}',
    lb_gate_text: 'Connectez-vous pour voir le classement',
    lb_signin_google: 'Se connecter avec Google',
    profile_account: 'Compte',
    profile_signin_reason1: 'Pour sauvegarder vos données en ligne',
    profile_signin_reason2: 'Pour apparaître dans le classement',
    profile_username: "Nom d'utilisateur",
    profile_username_placeholder: "Votre nom d'utilisateur",
    profile_username_taken: "Ce nom d'utilisateur est déjà pris.",
    profile_avatar_change: 'Changer',
    profile_avatar_close: 'Fermer',
    profile_save: 'Enregistrer',
    profile_saving: 'Enregistrement...',
    profile_saved: 'Enregistré',
    profile_error: 'Une erreur est survenue',
    profile_last_sync: 'Dernière sauvegarde: {date}',
    profile_next_action: 'Prochaine action dans: {time}',
    profile_sync_data: 'Synchroniser',
    profile_sync_desc: 'Récupère les données du serveur, les fusionne avec les données locales et les remet en ligne.',
    profile_get_data: 'Récupérer',
    profile_get_desc: 'Récupère les données du serveur et écrase les données locales. Les modifications locales seront perdues.',
    profile_upload_data: 'Envoyer',
    profile_upload_desc: 'Envoie les données locales au serveur et écrase la copie existante.',
    profile_processing: 'Traitement...',
    profile_done: 'Terminé',
    profile_action_error: 'Erreur survenue',
    profile_delete_all: 'Supprimer tout',
    profile_delete_desc: 'Toute la progression, les statistiques et les données de série seront supprimées. Cela ne peut pas être annulé.',
    profile_delete_confirm: 'Toute la progression sera supprimée. Êtes-vous sûr ?',
    profile_signout: 'Se déconnecter',
    settings_theme: 'Thème',
    settings_light: 'Clair',
    settings_dark: 'Sombre',
    settings_data: 'Données',
    settings_export: 'Exporter',
    settings_import: 'Importer',
    settings_visitor: 'visiteur',
    settings_visitors: 'visiteurs',
    tab_leaderboard: 'Classement',
    tab_profile: 'Profil',
    tab_settings: 'Paramètres',
    alert_leaderboard_promo: 'Connectez-vous et affrontez les autres dans le classement !',
    alert_action_goToProfile: 'Profil',
    alert_action_signIn: 'Se connecter',
    alert_dismiss: 'Compris',
  },
};

export function t(
  key: string,
  lang: Language,
  replacements: Record<string, string | number> = {}
): string {
  let text = translations[lang]?.[key as TranslationKey] || translations['en'][key as TranslationKey] || key;

  Object.keys(replacements).forEach((placeholder) => {
    text = text.replace(`{${placeholder}}`, String(replacements[placeholder]));
  });

  return text;
}

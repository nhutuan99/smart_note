export default {
  // ── Common ──
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    add: 'Add',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    saving: 'Saving...',
    today: 'Today',
    yesterday: 'Yesterday',
    all: 'All',
    menu: 'MENU',
    preview: 'Preview',
    copyLink: 'Copy Link',
    export: 'Export',
    version: 'Smart Note v1.0.0',
    copy: 'Copy',
    copied: 'Copied!'
  },

  // ── Time ──
  time: {
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
    mAgo: '{n}m ago',
    hAgo: '{n}h ago',
    dAgo: '{n}d ago'
  },

  // ── Days ──
  days: {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sun', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },

  // ── Months ──
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  // ── Navigation ──
  nav: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    wallets: 'Wallets',
    notes: 'Notes',
    settings: 'Settings',
    addTransaction: 'Add Transaction',
    walletSection: 'WALLETS',
    totalBalance: 'Total Balance',
    autoSync: 'Auto Sync'
  },

  // ── Notifications ──
  notifications: {
    title: 'Notifications',
    new: '{n} new',
    readAll: 'Read all',
    deleteAll: 'Delete',
    tabAll: 'All',
    tabUnread: 'Unread',
    emptyUnread: 'No unread notifications',
    empty: 'No notifications yet',
    emptyHint: 'Connect your bank to receive automatic notifications'
  },

  // ── Dashboard ──
  dashboard: {
    totalBalance: 'Total Balance',
    monthIncome: 'Monthly Income',
    monthExpense: 'Monthly Expense',
    myWallets: 'My Wallets',
    manage: 'Manage',
    weeklyChart: '7-Day Summary',
    income: 'Income',
    expense: 'Expense',
    categoryBreakdown: 'Expense by Category',
    noDataThisMonth: 'No data this month',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View all',
    noTransactions: 'No transactions yet',
    noTransactionsHint: 'Add your first transaction or chat on Telegram',
    addTransaction: 'Add Transaction'
  },

  // ── Transactions ──
  transactions: {
    title: 'Transactions',
    count: '{n} transactions',
    add: 'Add',
    filterAll: 'All',
    filterExpense: 'Expense',
    filterIncome: 'Income',
    allWallets: 'All wallets',
    deleteTitle: 'Delete Transaction',
    deleteMessage: 'This transaction will be removed.\nThis action cannot be undone.',
    deleteConfirm: 'Delete Transaction',
    empty: 'No transactions yet',
    emptyHint: 'Add a transaction manually or chat via Telegram',
    addTransaction: 'Add Transaction'
  },

  // ── Add Transaction ──
  addTx: {
    title: 'Add Transaction',
    expense: 'Expense',
    income: 'Income',
    amount: 'Amount',
    category: 'Category',
    wallet: 'Wallet',
    addWallet: 'Add Wallet',
    note: 'Note',
    notePlaceholder: 'e.g. Breakfast, Grab, ...',
    date: 'Date',
    submitExpense: 'Record Expense',
    submitIncome: 'Record Income'
  },

  // ── Wallets ──
  wallets: {
    title: 'My Wallets',
    addWallet: 'Add Wallet',
    addNew: 'Add New Wallet',
    walletName: 'Wallet name (e.g. Vietcombank, MoMo, Cash...)',
    popularBanks: 'Popular Banks & Wallets',
    colorCustom: 'Color (for custom wallets)',
    totalAll: 'Total All Wallets',
    editBalance: 'Edit balance',
    deleteWallet: 'Delete wallet',
    deleteTitle: 'Delete Wallet',
    deleteMessage: 'Are you sure you want to delete this wallet?\nExisting transactions will not be removed.',
    deleteConfirm: 'Yes, Delete',
    cannotSaveOrder: 'Cannot save wallet order',
    pinDeleteTitle: 'Confirm Wallet Deletion',
    pinDeleteMessage: 'Enter your PIN to delete this wallet'
  },

  // ── Notes ──
  notes: {
    title: 'Notes',
    count: '{n} notes',
    newNote: 'New Note',
    searchPlaceholder: 'Search notes by title, content, or tag...',
    filterAll: 'All',
    filterPinned: 'Pinned',
    filterRecent: 'Recent',
    noContent: 'No content...',
    deleteNote: 'Delete this note?',
    noteDeleted: 'Note deleted',
    noResults: 'No results found',
    noNotes: 'No notes yet',
    tryDifferent: 'Try a different search term',
    createFirst: 'Create your first note to get started',
    createNote: 'Create Note',
    ai: {
      assistant: 'AI Assistant',
      summarize: 'Summarize',
      continue: 'Continue writing',
      improve: 'Improve',
      tags: 'Suggest tags',
      ask: 'Ask AI about note content...',
      processing: 'Processing...',
      suggestedTags: 'Suggested tags:',
      applyTags: 'Apply tags',
      result: 'Result:',
      insert: 'Insert to note'
    }
  },

  // ── Settings ──
  settings: {
    title: 'Settings',
    // Language
    language: 'Language',
    languageDesc: 'Choose display language',
    // Profile
    profile: 'Profile',
    editProfile: 'Edit Profile',
    displayName: 'Display Name',
    avatarUrl: 'Avatar URL',
    avatarHint: 'Paste a public image URL for your avatar.',
    removeAvatar: 'Remove Avatar',
    saveChanges: 'Save Changes',
    profileUpdated: 'Profile updated successfully',
    profileFailed: 'Failed to update profile',
    // Storage
    storage: 'Storage',
    localStorageUsed: 'Local Storage Used',
    totalNotes: 'Total Notes',
    r2Limit: 'R2 Free Tier Limit',
    // Export
    dataManagement: 'Data Management',
    exportNotes: 'Export Notes',
    exportDesc: 'Download all your notes as a JSON file',
    exportSuccess: 'Notes exported successfully',
    // PIN
    pinSecurity: 'PIN Security',
    changePin: 'Change PIN',
    setupPin: 'Setup PIN',
    pinEnabled: 'PIN is active. Important actions will require PIN verification.',
    pinDisabled: 'Protect important actions with a PIN code.',
    pinActive: 'Active',
    currentPin: 'Current PIN',
    currentPinPlaceholder: 'Enter current PIN',
    newPin: 'New PIN (4-6 digits)',
    newPinPlaceholder: 'Enter new PIN',
    confirmPin: 'Confirm PIN',
    confirmPinPlaceholder: 'Re-enter PIN',
    savePin: 'Save PIN',
    savingPin: 'Saving...',
    pinLengthError: 'PIN must be 4-6 digits',
    pinDigitsOnly: 'PIN must contain only numbers',
    pinMismatch: 'PIN confirmation does not match',
    pinSuccess: 'PIN has been set successfully!',
    pinFailed: 'Failed to set PIN',
    // Account
    account: 'Account',
    signOut: 'Sign Out',
    signOutDesc: 'Log out of your account',
    deleteAccount: 'Delete Account',
    deleteAccountDesc: 'Permanently delete your account and all data',
    deleteAccountTitle: 'Delete Account',
    deleteAccountWarning: 'This action <strong>cannot be undone</strong>. All data (wallets, transactions, notes) will be permanently deleted.',
    confirmPassword: 'Confirm Password',
    passwordPlaceholder: 'Enter your password',
    deleteForever: 'Delete Forever',
    passwordRequired: 'Please enter your password',
    accountDeleted: 'Account has been permanently deleted',
    wrongPassword: 'Incorrect password'
  },

  // ── Login ──
  login: {
    tagline: 'Your personal knowledge hub',
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
    signInDesc: 'Sign in to continue',
    signUpDesc: 'Start organizing your thoughts',
    name: 'Name',
    namePlaceholder: 'Your full name',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Sign up',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?'
  },

  // ── AutoSync ──
  autoSync: {
    title: 'Auto Sync (iOS)',
    desc: 'Automatically record bank transactions to Smart Note securely via iOS Shortcuts.',
    whyTitle: 'Why use SMS Shortcuts?',
    security: '<strong>100% Secure:</strong> No bank login credentials required.',
    native: '<strong>Apple Native:</strong> Uses the built-in Shortcuts app on iPhone.',
    free: '<strong>Free:</strong> No third-party intermediaries needed.',
    instant: '<strong>Instant:</strong> SMS balance notifications appear in Smart Note immediately.',
    step1Title: '1. Your Webhook URL',
    step1Desc: 'This URL contains your unique identifier. Do not share it with anyone.',
    step2Title: '2. Setup Guide for iPhone',
    s1Title: 'Create a New Automation',
    s1Desc: 'Open the <strong>Shortcuts</strong> app on your iPhone. Switch to the <strong>Automation</strong> tab at the bottom and tap <strong>+</strong> in the top right corner.',
    s2Title: 'Set the Trigger',
    s2Desc: 'Scroll down and select <strong>Message</strong>.',
    s2Li1: 'In the <strong>Sender</strong> field, enter the bank name (e.g. <code>Techcombank</code>, <code>TPBank</code>).',
    s2Li2: 'Select <strong>Run Immediately</strong> to run automatically in the background.',
    s2Next: 'Tap <strong>Next</strong> → select <strong>New Blank Automation</strong>.',
    s3Title: 'Add the Webhook URL',
    s3Desc: 'Tap <strong>Add Action</strong>, search for <strong>"URL"</strong> and select <strong>Get Contents of URL</strong>. Paste the Webhook URL from Step 1 into the URL field.',
    s4Title: 'Configure the Request',
    s4Desc: 'Tap the small arrow (Show More) on the action you just added:',
    s4Li1: 'Change Method to <strong>POST</strong>.',
    s4Li2: 'Scroll down to <strong>Request Body</strong> (Add new field as Text).',
    s4Li3: 'Enter Key as <kbd>text</kbd>',
    s4Li4: 'For Value, select <strong>Shortcut Input</strong>.',
    s4Done: 'Tap <strong>Done</strong> to save. Transactions will automatically sync from the next SMS!',
    copySuccess: 'URL copied to clipboard!',
    copyFailed: 'Failed to copy. Please try again.'
  },

  // ── PinDialog ──
  pin: {
    title: 'Confirm with PIN',
    message: 'Enter your PIN to continue',
    fillAll: 'Please enter your full PIN',
    wrong: 'Incorrect PIN',
    confirm: 'Confirm',
    requireTitle: 'PIN Required',
    requireMessage: 'To protect your data, you need to set up a PIN before performing important actions.',
    setupNow: 'Setup PIN Now'
  },

  // ── Categories ──
  categories: {
    food: 'Food & Drinks',
    transport: 'Transport',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills',
    health: 'Health',
    education: 'Education',
    rent: 'Rent/Housing',
    gift: 'Gifts',
    other_expense: 'Other',
    salary: 'Salary',
    freelance: 'Freelance',
    investment: 'Investment',
    bonus: 'Bonus',
    refund: 'Refund',
    other_income: 'Other Income'
  }
}

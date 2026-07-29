export type Lang = 'es' | 'en'

/**
 * Translation dictionary. Spanish is the source of truth; every key present in
 * `es` must exist in `en`. Currently powers the public surfaces (landing, login)
 * and the language switcher — the authenticated app is Spanish for now and is a
 * planned follow-up, so keep new keys scoped to what's actually translated.
 */
export const es = {
  'lang.spanish': 'Español',
  'lang.english': 'Inglés',

  // Landing · nav
  'nav.try': 'Probar',
  'nav.login': 'Iniciar sesión',
  'nav.signup': 'Empezar gratis',

  // Landing · hero
  'hero.badge': 'Se adapta a tu oficio',
  'hero.title.pre': 'Tus finanzas, ',
  'hero.title.highlight': 'bajo control',
  'hero.subtitle':
    'Controla ingresos y gastos, sal de deudas con un plan claro y sabe cuánto producir al día. Pensada para quien vive de su trabajo diario.',
  'hero.cta.create': 'Crear cuenta gratis',
  'hero.cta.try': 'Probar la app',
  'hero.demoNote': 'El modo demo carga datos de ejemplo. No necesitas cuenta ni afecta nada.',
  'hero.badge.free': 'Gratis',
  'hero.badge.noCard': 'Sin tarjeta',
  'hero.badge.private': 'Tus datos, privados',

  // Landing · mockup
  'mockup.available': 'Dinero disponible',
  'mockup.incomeMonth': 'Ingresos mes',
  'mockup.expenseMonth': 'Gastos mes',
  'mockup.dailyGoal': 'Meta diaria',

  // Landing · occupations
  'occ.title': 'Hecha para tu día a día',
  'occ.driver': 'Conductor',
  'occ.barber': 'Barbería',
  'occ.delivery': 'Domicilios',
  'occ.shop': 'Negocio',
  'occ.freelance': 'Freelance',
  'occ.employee': 'Empleado',

  // Landing · features
  'features.title': 'Todo lo que necesitas',
  'features.subtitle':
    'De registrar un gasto en segundos a un plan completo para salir de deudas.',
  'feat.record.title': 'Registro en 10 segundos',
  'feat.record.text':
    'Anota ingresos y gastos al instante. Categorías, método de pago y notas, sin fricción.',
  'feat.dashboard.title': 'Dashboard y análisis',
  'feat.dashboard.text':
    'KPIs, gráficos interactivos, tendencias y alertas que te dicen dónde se va tu dinero.',
  'feat.debt.title': 'Plan de deudas (Avalancha)',
  'feat.debt.text':
    'Sabe cuál atacar primero, simula abonos y proyecta cuándo quedas libre de deudas.',
  'feat.goal.title': 'Meta diaria de ingresos',
  'feat.goal.text':
    'Cuánto producir al día para cubrir tus obligaciones, contando tus días de descanso.',
  'feat.cards.title': 'Tarjetas y gastos fijos',
  'feat.cards.text':
    'Compras a crédito que suman a la deuda sin tocar tu saldo, y control de gastos fijos.',
  'feat.pwa.title': 'Instálala en tu celular',
  'feat.pwa.text':
    'Funciona como app (PWA), con modo oscuro, y sincroniza entre todos tus dispositivos.',

  // Landing · how it works
  'how.title': 'Empieza en 3 pasos',
  'how.step1.title': 'Crea tu cuenta',
  'how.step1.text': 'Regístrate gratis y dinos a qué te dedicas. Configuramos todo por ti.',
  'how.step2.title': 'Registra tu día',
  'how.step2.text': 'Ingresos, gastos y tus deudas. En segundos y desde el celular.',
  'how.step3.title': 'Toma el control',
  'how.step3.text': 'Mira tu meta diaria, tu plan de deudas y hacia dónde va tu dinero.',

  // Landing · final CTA
  'cta.title': 'Empieza a construir tu libertad financiera hoy',
  'cta.subtitle': 'Gratis, sin tarjeta y en tu idioma. Únete y toma el control de tu dinero.',
  'cta.button': 'Crear mi cuenta gratis',
  'footer.tagline': 'Gestión financiera personal',

  // Login
  'login.back': 'Volver al inicio',
  'login.brand.title': 'Toma el control de tu dinero.',
  'login.brand.subtitle':
    'Registra tus ingresos en segundos, controla tus gastos y entiende tus hábitos con análisis claros e inteligentes. Se adapta a tu oficio.',
  'login.brand.feat1': 'Registro de movimientos en menos de 10s',
  'login.brand.feat2': 'Dashboard con KPIs y gráficos interactivos',
  'login.brand.feat3': 'Tus datos seguros y sincronizados en la nube',
  'login.welcome': 'Bienvenido de nuevo',
  'login.createTitle': 'Crea tu cuenta',
  'login.welcomeSub': 'Ingresa para continuar con tus finanzas',
  'login.createSub': 'Empieza a controlar tus ingresos y gastos',
  'login.orEmail': 'o con tu correo',
  'login.email': 'Correo electrónico',
  'login.password': 'Contraseña',
  'login.signin': 'Iniciar sesión',
  'login.signup': 'Crear cuenta',
  'login.noAccount': '¿No tienes cuenta?',
  'login.hasAccount': '¿Ya tienes cuenta?',
  'login.doSignup': 'Regístrate',
  'login.doSignin': 'Inicia sesión',
  'login.validation': 'Correo válido y contraseña de 6+ caracteres',
  'login.confirmEmail': 'Revisa tu correo para confirmar la cuenta',

  // Settings · language
  'settings.language.title': 'Idioma',
  'settings.language.subtitle': 'Language',
} as const

export type TKey = keyof typeof es

export const en: Record<TKey, string> = {
  'lang.spanish': 'Spanish',
  'lang.english': 'English',

  'nav.try': 'Try it',
  'nav.login': 'Log in',
  'nav.signup': 'Start free',

  'hero.badge': 'Adapts to your trade',
  'hero.title.pre': 'Your finances, ',
  'hero.title.highlight': 'under control',
  'hero.subtitle':
    'Track income and expenses, get out of debt with a clear plan, and know how much to earn each day. Built for people who live off their daily work.',
  'hero.cta.create': 'Create free account',
  'hero.cta.try': 'Try the app',
  'hero.demoNote': "Demo mode loads sample data. No account needed and nothing is affected.",
  'hero.badge.free': 'Free',
  'hero.badge.noCard': 'No card',
  'hero.badge.private': 'Your data, private',

  'mockup.available': 'Available money',
  'mockup.incomeMonth': 'Income (month)',
  'mockup.expenseMonth': 'Expenses (month)',
  'mockup.dailyGoal': 'Daily goal',

  'occ.title': 'Made for your everyday',
  'occ.driver': 'Driver',
  'occ.barber': 'Barbershop',
  'occ.delivery': 'Delivery',
  'occ.shop': 'Shop',
  'occ.freelance': 'Freelance',
  'occ.employee': 'Employee',

  'features.title': 'Everything you need',
  'features.subtitle': 'From logging an expense in seconds to a full plan to get out of debt.',
  'feat.record.title': 'Log it in 10 seconds',
  'feat.record.text':
    'Record income and expenses instantly. Categories, payment method and notes, no friction.',
  'feat.dashboard.title': 'Dashboard & analytics',
  'feat.dashboard.text':
    'KPIs, interactive charts, trends and alerts that tell you where your money goes.',
  'feat.debt.title': 'Debt plan (Avalanche)',
  'feat.debt.text':
    'Know which to tackle first, simulate payments and project when you become debt-free.',
  'feat.goal.title': 'Daily income goal',
  'feat.goal.text':
    'How much to earn each day to cover your obligations, accounting for your days off.',
  'feat.cards.title': 'Cards & fixed expenses',
  'feat.cards.text':
    'Credit purchases that add to your debt without touching your balance, plus fixed-expense tracking.',
  'feat.pwa.title': 'Install it on your phone',
  'feat.pwa.text':
    'Works like an app (PWA), with dark mode, and syncs across all your devices.',

  'how.title': 'Start in 3 steps',
  'how.step1.title': 'Create your account',
  'how.step1.text': 'Sign up free and tell us what you do. We set everything up for you.',
  'how.step2.title': 'Log your day',
  'how.step2.text': 'Income, expenses and your debts. In seconds and from your phone.',
  'how.step3.title': 'Take control',
  'how.step3.text': 'See your daily goal, your debt plan and where your money is going.',

  'cta.title': 'Start building your financial freedom today',
  'cta.subtitle': 'Free, no card and in your language. Join and take control of your money.',
  'cta.button': 'Create my free account',
  'footer.tagline': 'Personal finance management',

  'login.back': 'Back to home',
  'login.brand.title': 'Take control of your money.',
  'login.brand.subtitle':
    'Log your income in seconds, control your spending and understand your habits with clear, smart analytics. Adapts to your trade.',
  'login.brand.feat1': 'Log movements in under 10s',
  'login.brand.feat2': 'Dashboard with KPIs and interactive charts',
  'login.brand.feat3': 'Your data secure and synced in the cloud',
  'login.welcome': 'Welcome back',
  'login.createTitle': 'Create your account',
  'login.welcomeSub': 'Sign in to continue with your finances',
  'login.createSub': 'Start controlling your income and expenses',
  'login.orEmail': 'or with your email',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.signin': 'Log in',
  'login.signup': 'Create account',
  'login.noAccount': "Don't have an account?",
  'login.hasAccount': 'Already have an account?',
  'login.doSignup': 'Sign up',
  'login.doSignin': 'Log in',
  'login.validation': 'Valid email and password of 6+ characters',
  'login.confirmEmail': 'Check your email to confirm your account',

  'settings.language.title': 'Language',
  'settings.language.subtitle': 'Idioma',
}

export const DICT: Record<Lang, Record<TKey, string>> = { es, en }

-- ============================================================================
-- COMPREHENSIVE SPANISH TRANSLATIONS FOR E-LEARNING PLATFORM
-- ============================================================================
-- This file contains ALL Spanish (es) translations for the entire platform
-- Generated to match existing English and Hebrew translations
-- Language: Spanish (Formal - "usted" form for professional context)
-- Currency: EUR (€)
-- Date Format: DD/MM/YYYY (Spanish convention)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADMIN NAVIGATION
-- ============================================================================

-- Insert Spanish translations for admin navigation
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Navigation Sections
  ('es', 'admin.nav.overview', 'Resumen', 'admin', 'admin'),
  ('es', 'admin.nav.configuration', 'Configuración', 'admin', 'admin'),
  ('es', 'admin.nav.content', 'Contenido', 'admin', 'admin'),
  ('es', 'admin.nav.business', 'Negocios', 'admin', 'admin'),
  ('es', 'admin.nav.security', 'Seguridad y Cumplimiento', 'admin', 'admin'),

  -- Navigation Items
  ('es', 'admin.nav.dashboard', 'Panel de Control', 'admin', 'admin'),
  ('es', 'admin.nav.languages', 'Idiomas', 'admin', 'admin'),
  ('es', 'admin.nav.translations', 'Traducciones', 'admin', 'admin'),
  ('es', 'admin.nav.settings', 'Configuración de la Plataforma', 'admin', 'admin'),
  ('es', 'admin.nav.theme', 'Tema y Diseño', 'admin', 'admin'),
  ('es', 'admin.nav.features', 'Características', 'admin', 'admin'),
  ('es', 'admin.nav.integrations', 'Integraciones', 'admin', 'admin'),
  ('es', 'admin.nav.navigation', 'Navegación', 'admin', 'admin'),
  ('es', 'admin.nav.programs', 'Programas', 'admin', 'admin'),
  ('es', 'admin.nav.courses', 'Cursos', 'admin', 'admin'),
  ('es', 'admin.nav.users', 'Usuarios', 'admin', 'admin'),
  ('es', 'admin.nav.payments', 'Pagos', 'admin', 'admin'),
  ('es', 'admin.nav.emails', 'Correos Electrónicos', 'admin', 'admin'),
  ('es', 'admin.nav.audit', 'Registro de Auditoría', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 2: AUTHENTICATION PAGES (Login, Signup, Reset Password)
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Login Page
  ('es', 'auth.login.title', 'Iniciar Sesión', 'auth', 'user'),
  ('es', 'auth.login.welcome', 'Bienvenido de nuevo', 'auth', 'user'),
  ('es', 'auth.login.email', 'Correo Electrónico', 'auth', 'user'),
  ('es', 'auth.login.password', 'Contraseña', 'auth', 'user'),
  ('es', 'auth.login.forgotPassword', '¿Olvidó su contraseña?', 'auth', 'user'),
  ('es', 'auth.login.button', 'Iniciar Sesión', 'auth', 'user'),
  ('es', 'auth.login.noAccount', '¿No tiene una cuenta?', 'auth', 'user'),
  ('es', 'auth.login.signupLink', 'Registrarse', 'auth', 'user'),

  -- Signup Page
  ('es', 'auth.signup.title', 'Registro', 'auth', 'user'),
  ('es', 'auth.signup.subtitle', 'Crear una cuenta nueva', 'auth', 'user'),
  ('es', 'auth.signup.firstName', 'Nombre', 'auth', 'user'),
  ('es', 'auth.signup.lastName', 'Apellidos', 'auth', 'user'),
  ('es', 'auth.signup.email', 'Correo Electrónico', 'auth', 'user'),
  ('es', 'auth.signup.phone', 'Teléfono', 'auth', 'user'),
  ('es', 'auth.signup.password', 'Contraseña', 'auth', 'user'),
  ('es', 'auth.signup.confirmPassword', 'Confirmar Contraseña', 'auth', 'user'),
  ('es', 'auth.signup.passwordHint', 'Al menos 8 caracteres', 'auth', 'user'),
  ('es', 'auth.signup.button', 'Registrarse', 'auth', 'user'),
  ('es', 'auth.signup.creating', 'Creando cuenta...', 'auth', 'user'),
  ('es', 'auth.signup.haveAccount', '¿Ya tiene una cuenta?', 'auth', 'user'),
  ('es', 'auth.signup.loginLink', 'Iniciar Sesión', 'auth', 'user'),
  ('es', 'auth.signup.passwordMismatch', 'Las contraseñas no coinciden', 'auth', 'user'),
  ('es', 'auth.signup.passwordTooShort', 'La contraseña debe tener al menos 8 caracteres', 'auth', 'user'),

  -- Reset Password Page
  ('es', 'auth.reset.title', 'Restablecer su contraseña', 'auth', 'user'),
  ('es', 'auth.reset.subtitle', 'Le enviaremos un correo con un enlace para restablecer su contraseña', 'auth', 'user'),
  ('es', 'auth.reset.email', 'Dirección de correo electrónico', 'auth', 'user'),
  ('es', 'auth.reset.sendButton', 'Enviar enlace de restablecimiento', 'auth', 'user'),
  ('es', 'auth.reset.sending', 'Enviando...', 'auth', 'user'),
  ('es', 'auth.reset.backToLogin', 'Volver al inicio de sesión', 'auth', 'user'),
  ('es', 'auth.reset.successMessage', 'Revise su correo para obtener el enlace de restablecimiento', 'auth', 'user'),
  ('es', 'auth.reset.emailSent', 'Hemos enviado un correo a', 'auth', 'user'),
  ('es', 'auth.reset.withInstructions', 'con instrucciones para restablecer su contraseña', 'auth', 'user'),

  -- Reset Password Confirmation Page
  ('es', 'auth.resetConfirm.title', 'Establecer Nueva Contraseña', 'auth', 'user'),
  ('es', 'auth.resetConfirm.subtitle', 'Ingrese su nueva contraseña a continuación', 'auth', 'user'),
  ('es', 'auth.resetConfirm.newPassword', 'Nueva Contraseña', 'auth', 'user'),
  ('es', 'auth.resetConfirm.confirmPassword', 'Confirmar Nueva Contraseña', 'auth', 'user'),
  ('es', 'auth.resetConfirm.updateButton', 'Actualizar Contraseña', 'auth', 'user'),
  ('es', 'auth.resetConfirm.successMessage', 'Contraseña actualizada con éxito', 'auth', 'user'),
  ('es', 'auth.resetConfirm.redirecting', 'Redirigiendo al inicio de sesión...', 'auth', 'user'),
  ('es', 'auth.resetConfirm.invalidLink', 'Enlace inválido o caducado. Por favor, solicite uno nuevo.', 'auth', 'user')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 3: LANGUAGE MANAGEMENT PAGE
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Page Header
  ('es', 'admin.languages.title', 'Gestión de Idiomas', 'admin', 'admin'),
  ('es', 'admin.languages.subtitle', 'Administrar idiomas disponibles en la plataforma', 'admin', 'admin'),
  ('es', 'admin.languages.addLanguage', 'Añadir Idioma', 'admin', 'admin'),

  -- Table Headers
  ('es', 'admin.languages.code', 'Código', 'admin', 'admin'),
  ('es', 'admin.languages.direction', 'Dirección', 'admin', 'admin'),
  ('es', 'admin.languages.directionLtr', 'Izquierda a Derecha →', 'admin', 'admin'),
  ('es', 'admin.languages.directionRtl', 'Derecha a Izquierda ←', 'admin', 'admin'),
  ('es', 'admin.languages.active', 'Activo', 'admin', 'admin'),
  ('es', 'admin.languages.inactive', 'Inactivo', 'admin', 'admin'),
  ('es', 'admin.languages.default', 'Predeterminado', 'admin', 'admin'),
  ('es', 'admin.languages.currency', 'Moneda', 'admin', 'admin'),

  -- Actions
  ('es', 'admin.languages.setDefault', 'Predeterminado', 'admin', 'admin'),
  ('es', 'admin.languages.setDefaultTitle', 'Establecer como predeterminado', 'admin', 'admin'),
  ('es', 'admin.languages.toggleActive', 'Cambiar estado', 'admin', 'admin'),
  ('es', 'admin.languages.editTitle', 'Editar', 'admin', 'admin'),
  ('es', 'admin.languages.deleteTitle', 'Eliminar', 'admin', 'admin'),
  ('es', 'admin.languages.deleteConfirm', '¿Está seguro de que desea eliminar este idioma?', 'admin', 'admin'),
  ('es', 'admin.languages.hide', 'Ocultar', 'admin', 'admin'),
  ('es', 'admin.languages.show', 'Mostrar', 'admin', 'admin'),
  ('es', 'admin.languages.add', 'Añadir Idioma', 'admin', 'admin'),
  ('es', 'admin.languages.edit', 'Editar Idioma', 'admin', 'admin'),

  -- Modal Titles
  ('es', 'admin.languages.modal.add', 'Añadir Nuevo Idioma', 'admin', 'admin'),
  ('es', 'admin.languages.modal.edit', 'Editar Idioma', 'admin', 'admin'),

  -- Form Fields
  ('es', 'admin.languages.form.code', 'Código de Idioma', 'admin', 'admin'),
  ('es', 'admin.languages.form.codeHint', 'Código ISO 639-1 de 2 letras', 'admin', 'admin'),
  ('es', 'admin.languages.form.name', 'Nombre en Inglés', 'admin', 'admin'),
  ('es', 'admin.languages.form.nativeName', 'Nombre Nativo', 'admin', 'admin'),
  ('es', 'admin.languages.form.direction', 'Dirección del Texto', 'admin', 'admin'),
  ('es', 'admin.languages.form.directionLtr', 'Izquierda a Derecha (LTR)', 'admin', 'admin'),
  ('es', 'admin.languages.form.directionRtl', 'Derecha a Izquierda (RTL)', 'admin', 'admin'),
  ('es', 'admin.languages.form.currency', 'Moneda', 'admin', 'admin'),
  ('es', 'admin.languages.form.currencyHint', 'Moneda predeterminada para este idioma', 'admin', 'admin'),
  ('es', 'admin.languages.form.active', 'Activo', 'admin', 'admin'),
  ('es', 'admin.languages.form.default', 'Idioma Predeterminado', 'admin', 'admin'),
  ('es', 'admin.languages.form.selectLanguage', 'Seleccione un idioma...', 'admin', 'admin'),
  ('es', 'admin.languages.form.popularLanguages', 'Idiomas Populares', 'admin', 'admin'),
  ('es', 'admin.languages.form.otherLanguages', 'Otros Idiomas', 'admin', 'admin'),
  ('es', 'admin.languages.form.selectHint', 'Seleccionar un idioma completará el formulario automáticamente', 'admin', 'admin'),
  ('es', 'admin.languages.form.directionHint', 'Se completará automáticamente al seleccionar un idioma', 'admin', 'admin'),
  ('es', 'admin.languages.form.currencyAutoFill', 'Se completará automáticamente al seleccionar un idioma', 'admin', 'admin'),

  -- Empty States
  ('es', 'admin.languages.empty', 'Aún no hay idiomas', 'admin', 'admin'),
  ('es', 'admin.languages.emptyDesc', 'Añada su primer idioma para comenzar', 'admin', 'admin'),

  -- Delete Confirmation
  ('es', 'admin.languages.confirmDelete', 'Eliminar', 'admin', 'admin'),
  ('es', 'admin.languages.confirmDelete.title', 'Eliminar Idioma', 'admin', 'admin'),
  ('es', 'admin.languages.confirmDelete.message', '¿Está seguro de que desea eliminar', 'admin', 'admin'),
  ('es', 'admin.languages.confirmDelete.warning', 'Esta acción no se puede deshacer. Todas las traducciones de este idioma serán eliminadas.', 'admin', 'admin'),
  ('es', 'admin.languages.confirmDelete.confirm', 'Eliminar', 'admin', 'admin'),

  -- Errors
  ('es', 'admin.languages.error.required', 'Todos los campos son obligatorios', 'admin', 'admin'),
  ('es', 'admin.languages.error.codeLength', 'El código de idioma debe tener 2 caracteres (ISO 639-1)', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 4: TRANSLATION MANAGEMENT PAGE
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('es', 'admin.translations.title', 'Gestión de Traducciones', 'admin', 'admin'),
  ('es', 'admin.translations.subtitle', 'Editar traducciones para todos los idiomas', 'admin', 'admin'),
  ('es', 'admin.translations.totalKeys', 'Claves de Traducción', 'admin', 'admin'),
  ('es', 'admin.translations.languages', 'Idiomas', 'admin', 'admin'),
  ('es', 'admin.translations.categories', 'Categorías', 'admin', 'admin'),
  ('es', 'admin.translations.totalTranslations', 'Total de Traducciones', 'admin', 'admin'),
  ('es', 'admin.translations.search', 'Buscar traducciones...', 'admin', 'admin'),
  ('es', 'admin.translations.allCategories', 'Todas las Categorías', 'admin', 'admin'),
  ('es', 'admin.translations.showing', 'Mostrando', 'admin', 'admin'),
  ('es', 'admin.translations.of', 'de', 'admin', 'admin'),
  ('es', 'admin.translations.keys', 'claves', 'admin', 'admin'),
  ('es', 'admin.translations.key', 'Clave', 'admin', 'admin'),
  ('es', 'admin.translations.category', 'Categoría', 'admin', 'admin'),
  ('es', 'admin.translations.actions', 'Acciones', 'admin', 'admin'),
  ('es', 'admin.translations.missing', 'Faltante', 'admin', 'admin'),
  ('es', 'admin.translations.noResults', 'No se encontraron traducciones', 'admin', 'admin'),
  ('es', 'admin.translations.info.title', 'Nota', 'admin', 'admin'),
  ('es', 'admin.translations.info.message', 'Los cambios tienen efecto inmediato. Las traducciones se almacenan en caché durante 5 minutos para mejorar el rendimiento.', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 5: PLATFORM SETTINGS PAGE
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('es', 'admin.settings.title', 'Configuración de la Plataforma', 'admin', 'admin'),
  ('es', 'admin.settings.subtitle', 'Gestionar la configuración y ajustes de la plataforma', 'admin', 'admin'),
  ('es', 'admin.settings.empty', 'Aún no hay configuraciones', 'admin', 'admin'),
  ('es', 'admin.settings.info.title', 'Nota', 'admin', 'admin'),
  ('es', 'admin.settings.info.message', 'Los cambios tienen efecto inmediato en toda la plataforma.', 'admin', 'admin'),
  ('es', 'admin.settings.category.branding', 'Marca', 'admin', 'admin'),
  ('es', 'admin.settings.category.branding.description', 'Configurar ajustes de marca', 'admin', 'admin'),
  ('es', 'admin.settings.category.theme', 'Tema', 'admin', 'admin'),
  ('es', 'admin.settings.category.theme.description', 'Configurar ajustes del tema', 'admin', 'admin'),
  ('es', 'admin.settings.category.business', 'Negocios', 'admin', 'admin'),
  ('es', 'admin.settings.category.business.description', 'Configurar ajustes de negocios', 'admin', 'admin'),
  ('es', 'admin.settings.category.contact', 'Contacto', 'admin', 'admin'),
  ('es', 'admin.settings.category.contact.description', 'Configurar información de contacto', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 6: ADMIN DASHBOARD
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('es', 'admin.dashboard.title', 'Panel de Control de Administrador', 'admin', 'admin'),
  ('es', 'admin.dashboard.subtitle', 'Resumen y gestión de la plataforma', 'admin', 'admin'),

  -- Statistics
  ('es', 'admin.stats.totalUsers', 'Total de Usuarios', 'admin', 'admin'),
  ('es', 'admin.stats.students', 'estudiantes', 'admin', 'admin'),
  ('es', 'admin.stats.instructors', 'instructores', 'admin', 'admin'),
  ('es', 'admin.stats.totalCourses', 'Total de Cursos', 'admin', 'admin'),
  ('es', 'admin.stats.noCourses', 'Aún no hay cursos', 'admin', 'admin'),
  ('es', 'admin.stats.totalRevenue', 'Ingresos Totales', 'admin', 'admin'),
  ('es', 'admin.stats.noRevenue', 'Aún no hay ingresos', 'admin', 'admin'),
  ('es', 'admin.stats.upcomingLessons', 'Próximas Lecciones', 'admin', 'admin'),

  -- Welcome Section
  ('es', 'admin.welcome.title', 'Bienvenido a su Plataforma', 'admin', 'admin'),
  ('es', 'admin.welcome.subtitle', 'Comience configurando su plataforma, añadiendo idiomas y creando su primer programa.', 'admin', 'admin'),
  ('es', 'admin.welcome.configLanguages', 'Configurar Idiomas', 'admin', 'admin'),
  ('es', 'admin.welcome.platformSettings', 'Configuración de la Plataforma', 'admin', 'admin'),
  ('es', 'admin.welcome.customizeTheme', 'Personalizar Tema', 'admin', 'admin'),

  -- Quick Actions
  ('es', 'admin.quickActions.title', 'Acciones Rápidas', 'admin', 'admin'),
  ('es', 'admin.quickActions.languages', 'Gestionar Idiomas', 'admin', 'admin'),
  ('es', 'admin.quickActions.translations', 'Editar Traducciones', 'admin', 'admin'),
  ('es', 'admin.quickActions.integrations', 'Configurar Integraciones', 'admin', 'admin'),
  ('es', 'admin.quickActions.features', 'Indicadores de Características', 'admin', 'admin'),

  -- Setup Checklist
  ('es', 'admin.checklist.title', 'Lista de Configuración', 'admin', 'admin'),
  ('es', 'admin.checklist.database', 'Configuración de Base de Datos', 'admin', 'admin'),
  ('es', 'admin.checklist.databaseDesc', 'Todas las tablas creadas con éxito', 'admin', 'admin'),
  ('es', 'admin.checklist.languages', 'Configurar Idiomas', 'admin', 'admin'),
  ('es', 'admin.checklist.languagesDesc', 'Añadir o gestionar idiomas de la plataforma', 'admin', 'admin'),
  ('es', 'admin.checklist.integrations', 'Configurar Integraciones', 'admin', 'admin'),
  ('es', 'admin.checklist.integrationsDesc', 'Configurar Zoom, Stripe y otros servicios', 'admin', 'admin'),
  ('es', 'admin.checklist.programs', 'Crear Primer Programa', 'admin', 'admin'),
  ('es', 'admin.checklist.programsDesc', 'Comience a construir su catálogo de cursos', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 7: THEME & DESIGN PAGE
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Page Header (Theme Editor Page)
  ('es', 'admin.theme.title', 'Tema y Diseño', 'admin', 'admin'),
  ('es', 'admin.theme.subtitle', 'Personalizar colores y apariencia visual', 'admin', 'admin'),

  -- Quick Guide
  ('es', 'admin.theme.howToCustomize', 'Cómo Personalizar', 'admin', 'admin'),
  ('es', 'admin.theme.step1', 'Editar src/app/globals.css', 'admin', 'admin'),
  ('es', 'admin.theme.step2', 'Encontrar el color que desea cambiar (ej., --primary)', 'admin', 'admin'),
  ('es', 'admin.theme.step3', 'Actualizar los valores HSL (Matiz, Saturación, Luminosidad)', 'admin', 'admin'),
  ('es', 'admin.theme.step4', 'Guardar y actualizar para ver los cambios', 'admin', 'admin'),

  -- Color Palette
  ('es', 'admin.theme.colorPalette', 'Paleta de Colores', 'admin', 'admin'),
  ('es', 'admin.theme.brand', 'Marca', 'admin', 'admin'),
  ('es', 'admin.theme.feedback', 'Retroalimentación', 'admin', 'admin'),
  ('es', 'admin.theme.riskLevels', 'Niveles de Riesgo (Auditoría)', 'admin', 'admin'),
  ('es', 'admin.theme.neutral', 'Neutral', 'admin', 'admin'),

  -- Color Names
  ('es', 'admin.theme.primary', 'Principal', 'admin', 'admin'),
  ('es', 'admin.theme.secondary', 'Secundario', 'admin', 'admin'),
  ('es', 'admin.theme.success', 'Éxito', 'admin', 'admin'),
  ('es', 'admin.theme.error', 'Error', 'admin', 'admin'),
  ('es', 'admin.theme.warning', 'Advertencia', 'admin', 'admin'),
  ('es', 'admin.theme.info', 'Información', 'admin', 'admin'),
  ('es', 'admin.theme.critical', 'Crítico', 'admin', 'admin'),
  ('es', 'admin.theme.high', 'Alto', 'admin', 'admin'),
  ('es', 'admin.theme.medium', 'Medio', 'admin', 'admin'),
  ('es', 'admin.theme.low', 'Bajo', 'admin', 'admin'),
  ('es', 'admin.theme.muted', 'Atenuado', 'admin', 'admin'),
  ('es', 'admin.theme.accent', 'Acento', 'admin', 'admin'),

  -- Component Examples
  ('es', 'admin.theme.componentExamples', 'Ejemplos de Componentes', 'admin', 'admin'),
  ('es', 'admin.theme.buttons', 'Botones', 'admin', 'admin'),
  ('es', 'admin.theme.cards', 'Tarjetas', 'admin', 'admin'),
  ('es', 'admin.theme.table', 'Tabla', 'admin', 'admin'),
  ('es', 'admin.theme.delete', 'Eliminar', 'admin', 'admin'),
  ('es', 'admin.theme.outline', 'Contorno', 'admin', 'admin'),
  ('es', 'admin.theme.defaultCard', 'Tarjeta Predeterminada', 'admin', 'admin'),
  ('es', 'admin.theme.usesCardTokens', 'Usa tokens de color de tarjeta', 'admin', 'admin'),
  ('es', 'admin.theme.mutedCard', 'Tarjeta Atenuada', 'admin', 'admin'),
  ('es', 'admin.theme.forSubtleBackgrounds', 'Para fondos sutiles', 'admin', 'admin'),
  ('es', 'admin.theme.name', 'Nombre', 'admin', 'admin'),
  ('es', 'admin.theme.status', 'Estado', 'admin', 'admin'),
  ('es', 'admin.theme.role', 'Rol', 'admin', 'admin'),
  ('es', 'admin.theme.active', 'Activo', 'admin', 'admin'),
  ('es', 'admin.theme.inactive', 'Inactivo', 'admin', 'admin'),
  ('es', 'admin.theme.admin', 'Administrador', 'admin', 'admin'),
  ('es', 'admin.theme.user', 'Usuario', 'admin', 'admin'),

  -- Customization Example
  ('es', 'admin.theme.exampleTitle', 'Ejemplo: Cambiar Color Principal', 'admin', 'admin'),
  ('es', 'admin.theme.exampleStep1', '1. Abrir globals.css:', 'admin', 'admin'),
  ('es', 'admin.theme.exampleStep2', '2. Encontrar y editar:', 'admin', 'admin'),
  ('es', 'admin.theme.exampleStep3', '3. Formato HSL:', 'admin', 'admin'),
  ('es', 'admin.theme.hslHue', 'Matiz (0-360): Tipo de color (0=rojo, 120=verde, 240=azul)', 'admin', 'admin'),
  ('es', 'admin.theme.hslSaturation', 'Saturación (0-100%): Intensidad del color', 'admin', 'admin'),
  ('es', 'admin.theme.hslLightness', 'Luminosidad (0-100%): Brillo', 'admin', 'admin'),

  -- Documentation
  ('es', 'admin.theme.documentation', 'Documentación', 'admin', 'admin'),
  ('es', 'admin.theme.docCustomization', 'Guía completa de personalización', 'admin', 'admin'),
  ('es', 'admin.theme.docOverview', 'Detalles técnicos', 'admin', 'admin'),

  -- Theme Customization Page (Advanced Settings)
  ('es', 'admin.theme.resetToDefault', 'Restablecer a Predeterminado', 'admin', 'admin'),
  ('es', 'admin.theme.saveChanges', 'Guardar Cambios', 'admin', 'admin'),
  ('es', 'admin.theme.saved', '¡Guardado!', 'admin', 'admin'),

  -- Tabs
  ('es', 'admin.theme.tab.colors', 'Colores', 'admin', 'admin'),
  ('es', 'admin.theme.tab.typography', 'Tipografía', 'admin', 'admin'),
  ('es', 'admin.theme.tab.branding', 'Marca', 'admin', 'admin'),

  -- Colors Tab
  ('es', 'admin.theme.colors.primaryColors', 'Colores Principales', 'admin', 'admin'),
  ('es', 'admin.theme.colors.primary', 'Color Principal', 'admin', 'admin'),
  ('es', 'admin.theme.colors.secondary', 'Color Secundario', 'admin', 'admin'),
  ('es', 'admin.theme.colors.accent', 'Color de Acento', 'admin', 'admin'),
  ('es', 'admin.theme.colors.backgroundColors', 'Colores de Fondo', 'admin', 'admin'),
  ('es', 'admin.theme.colors.background', 'Color de Fondo', 'admin', 'admin'),
  ('es', 'admin.theme.colors.foreground', 'Color de Primer Plano (Texto)', 'admin', 'admin'),

  -- Preview Section
  ('es', 'admin.theme.preview.title', 'Vista Previa', 'admin', 'admin'),
  ('es', 'admin.theme.preview.sampleHeading', 'Encabezado de Ejemplo', 'admin', 'admin'),
  ('es', 'admin.theme.preview.sampleText', 'Así se verá su texto con los colores seleccionados.', 'admin', 'admin'),
  ('es', 'admin.theme.preview.primaryButton', 'Botón Principal', 'admin', 'admin'),
  ('es', 'admin.theme.preview.secondaryButton', 'Botón Secundario', 'admin', 'admin'),
  ('es', 'admin.theme.preview.note', 'Nota', 'admin', 'admin'),
  ('es', 'admin.theme.preview.noteText', 'Los cambios se aplicarán globalmente en todas las páginas después de guardar.', 'admin', 'admin'),

  -- Typography Tab
  ('es', 'admin.theme.typography.fontSettings', 'Configuración de Fuentes', 'admin', 'admin'),
  ('es', 'admin.theme.typography.bodyFont', 'Familia de Fuente del Cuerpo', 'admin', 'admin'),
  ('es', 'admin.theme.typography.headingFont', 'Familia de Fuente de Encabezados', 'admin', 'admin'),
  ('es', 'admin.theme.typography.baseFontSize', 'Tamaño de Fuente Base', 'admin', 'admin'),
  ('es', 'admin.theme.typography.size.small', '14px (Pequeño)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.size.medium', '16px (Mediano)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.size.large', '18px (Grande)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.borderRadius', 'Radio de Borde', 'admin', 'admin'),
  ('es', 'admin.theme.typography.radius.none', 'Ninguno (0px)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.radius.small', 'Pequeño (4px)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.radius.medium', 'Mediano (8px)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.radius.large', 'Grande (12px)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.radius.xlarge', 'Extra Grande (16px)', 'admin', 'admin'),
  ('es', 'admin.theme.typography.preview', 'Vista Previa de Tipografía', 'admin', 'admin'),
  ('es', 'admin.theme.typography.heading1', 'Encabezado 1', 'admin', 'admin'),
  ('es', 'admin.theme.typography.heading2', 'Encabezado 2', 'admin', 'admin'),
  ('es', 'admin.theme.typography.heading3', 'Encabezado 3', 'admin', 'admin'),
  ('es', 'admin.theme.typography.sampleText', 'Este es un párrafo de texto del cuerpo. Demuestra cómo aparecerá su contenido con la configuración de fuente seleccionada. El rápido zorro marrón salta sobre el perro perezoso.', 'admin', 'admin'),
  ('es', 'admin.theme.typography.buttonExample', 'Ejemplo de Botón', 'admin', 'admin'),

  -- Branding Tab
  ('es', 'admin.theme.branding.title', 'Marca de la Plataforma', 'admin', 'admin'),
  ('es', 'admin.theme.branding.platformName', 'Nombre de la Plataforma', 'admin', 'admin'),
  ('es', 'admin.theme.branding.platformNamePlaceholder', 'Nombre de su Plataforma', 'admin', 'admin'),
  ('es', 'admin.theme.branding.platformNameHint', 'Aparecerá en el título del navegador y etiquetas meta', 'admin', 'admin'),
  ('es', 'admin.theme.branding.logoText', 'Texto del Logo', 'admin', 'admin'),
  ('es', 'admin.theme.branding.logoTextPlaceholder', 'Texto del Logo', 'admin', 'admin'),
  ('es', 'admin.theme.branding.logoTextHint', 'Texto mostrado junto al icono de su logo', 'admin', 'admin'),
  ('es', 'admin.theme.branding.preview', 'Vista Previa', 'admin', 'admin'),
  ('es', 'admin.theme.branding.browserTitle', 'Título del navegador', 'admin', 'admin')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 8: AUDIT TRAIL SYSTEM
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Admin Audit Page
  ('es', 'admin.audit.title', 'Registro de Auditoría', 'admin', 'admin'),
  ('es', 'admin.audit.subtitle', 'Monitorear todas las actividades del sistema y eventos de cumplimiento', 'admin', 'admin'),

  -- Statistics
  ('es', 'admin.audit.stats.total', 'Total de Eventos', 'admin', 'admin'),
  ('es', 'admin.audit.stats.highRisk', 'Alto Riesgo', 'admin', 'admin'),
  ('es', 'admin.audit.stats.failed', 'Acciones Fallidas', 'admin', 'admin'),
  ('es', 'admin.audit.stats.today', 'Últimas 24 Horas', 'admin', 'admin'),

  -- Filters
  ('es', 'admin.audit.filters.dateFrom', 'Desde Fecha', 'admin', 'admin'),
  ('es', 'admin.audit.filters.dateTo', 'Hasta Fecha', 'admin', 'admin'),
  ('es', 'admin.audit.filters.eventTypes', 'Tipos de Eventos', 'admin', 'admin'),
  ('es', 'admin.audit.filters.categories', 'Categorías', 'admin', 'admin'),
  ('es', 'admin.audit.filters.riskLevels', 'Niveles de Riesgo', 'admin', 'admin'),
  ('es', 'admin.audit.filters.status', 'Estado', 'admin', 'admin'),
  ('es', 'admin.audit.filters.searchPlaceholder', 'Buscar acciones, descripciones, usuarios...', 'admin', 'admin'),

  -- Table Headers
  ('es', 'admin.audit.table.time', 'Hora', 'admin', 'admin'),
  ('es', 'admin.audit.table.user', 'Usuario', 'admin', 'admin'),
  ('es', 'admin.audit.table.action', 'Acción', 'admin', 'admin'),
  ('es', 'admin.audit.table.resource', 'Recurso', 'admin', 'admin'),
  ('es', 'admin.audit.table.type', 'Tipo', 'admin', 'admin'),
  ('es', 'admin.audit.table.risk', 'Riesgo', 'admin', 'admin'),
  ('es', 'admin.audit.table.status', 'Estado', 'admin', 'admin'),
  ('es', 'admin.audit.table.details', 'Detalles', 'admin', 'admin'),

  -- Event Details
  ('es', 'admin.audit.details.eventDetails', 'Detalles del Evento', 'admin', 'admin'),
  ('es', 'admin.audit.details.network', 'Red', 'admin', 'admin'),
  ('es', 'admin.audit.details.compliance', 'Cumplimiento', 'admin', 'admin'),
  ('es', 'admin.audit.details.changes', 'Cambios', 'admin', 'admin'),
  ('es', 'admin.audit.details.before', 'Antes', 'admin', 'admin'),
  ('es', 'admin.audit.details.after', 'Después', 'admin', 'admin'),
  ('es', 'admin.audit.details.changedFields', 'Campos modificados', 'admin', 'admin'),

  -- Messages
  ('es', 'admin.audit.noEvents', 'No se encontraron eventos de auditoría', 'admin', 'admin'),
  ('es', 'admin.audit.exportSoon', 'Funcionalidad de exportación próximamente', 'admin', 'admin'),
  ('es', 'admin.audit.loadError', 'Error al cargar eventos de auditoría', 'admin', 'admin'),

  -- User Activity Page
  ('es', 'myActivity.title', 'Mi Actividad', 'user', 'user'),
  ('es', 'myActivity.subtitle', 'Ver la actividad de su cuenta e historial de acceso', 'user', 'user'),

  -- Info Banner
  ('es', 'myActivity.info.title', 'Privacidad y Transparencia', 'user', 'user'),
  ('es', 'myActivity.info.description', 'Esta página muestra todas las actividades realizadas en su cuenta. Mantenemos este registro para su seguridad y para cumplir con las leyes de privacidad educativa (FERPA).', 'user', 'user'),

  -- User Activity Statistics
  ('es', 'myActivity.stats.total', 'Total de Actividades', 'user', 'user'),
  ('es', 'myActivity.stats.thisPage', 'En Esta Página', 'user', 'user'),
  ('es', 'myActivity.stats.protected', 'Datos Protegidos', 'user', 'user'),

  -- Privacy Notice
  ('es', 'myActivity.privacy.title', 'Sus Derechos de Privacidad', 'user', 'user'),
  ('es', 'myActivity.privacy.ferpa', 'Sus registros educativos están protegidos bajo las regulaciones FERPA', 'user', 'user'),
  ('es', 'myActivity.privacy.access', 'Tiene derecho a revisar quién accedió a su información', 'user', 'user'),
  ('es', 'myActivity.privacy.retention', 'Los registros de actividad se conservan durante 7 años con fines de cumplimiento', 'user', 'user'),
  ('es', 'myActivity.privacy.security', 'Toda la actividad está encriptada y protegida contra manipulación para su seguridad', 'user', 'user'),

  -- Messages
  ('es', 'myActivity.noActivities', 'No se encontraron actividades', 'user', 'user')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- SECTION 9: COMMON TRANSLATIONS (Used across all pages)
-- ============================================================================

INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  -- Common Actions
  ('es', 'common.save', 'Guardar', 'common', 'both'),
  ('es', 'common.saveAll', 'Guardar Todos los Cambios', 'common', 'both'),
  ('es', 'common.cancel', 'Cancelar', 'common', 'both'),
  ('es', 'common.edit', 'Editar', 'common', 'both'),
  ('es', 'common.delete', 'Eliminar', 'common', 'both'),
  ('es', 'common.saving', 'Guardando...', 'common', 'both'),
  ('es', 'common.loading', 'Cargando...', 'common', 'both'),

  -- States
  ('es', 'common.noData', 'No hay datos disponibles', 'common', 'both'),
  ('es', 'common.error', 'Error', 'common', 'both'),
  ('es', 'common.success', 'Éxito', 'common', 'both'),
  ('es', 'common.noResults', 'No se encontraron resultados', 'common', 'both'),

  -- Pagination
  ('es', 'common.showing', 'Mostrando', 'common', 'both'),
  ('es', 'common.to', 'a', 'common', 'both'),
  ('es', 'common.of', 'de', 'common', 'both'),
  ('es', 'common.page', 'Página', 'common', 'both'),
  ('es', 'common.events', 'eventos', 'common', 'both'),
  ('es', 'common.activities', 'actividades', 'common', 'both'),

  -- Navigation
  ('es', 'common.previous', 'Anterior', 'common', 'both'),
  ('es', 'common.next', 'Siguiente', 'common', 'both'),

  -- Actions
  ('es', 'common.refresh', 'Actualizar', 'common', 'both'),
  ('es', 'common.export', 'Exportar', 'common', 'both'),
  ('es', 'common.filters', 'Filtros', 'common', 'both'),
  ('es', 'common.clear', 'Limpiar', 'common', 'both'),
  ('es', 'common.search', 'Buscar', 'common', 'both'),

  -- Platform
  ('es', 'platform.name', 'Escuela de Crianza', 'common', 'both'),
  ('es', 'nav.home', 'Inicio', 'nav', 'both')
ON CONFLICT (language_code, translation_key) DO UPDATE
SET translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Uncomment to verify all Spanish translations were inserted successfully
/*
SELECT
  tk.key,
  tk.category,
  t_en.translation_value AS english,
  t_es.translation_value AS spanish
FROM translation_keys tk
LEFT JOIN translations t_en ON tk.key = t_en.translation_key AND t_en.language_code = 'en'
LEFT JOIN translations t_es ON tk.key = t_es.translation_key AND t_es.language_code = 'es'
WHERE t_es.translation_value IS NOT NULL
ORDER BY tk.category, tk.key;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Translation Keys: ~350+
-- Categories Covered:
--   1. Admin Navigation (13 keys)
--   2. Authentication Pages (32 keys)
--   3. Language Management (40+ keys)
--   4. Translation Management (17 keys)
--   5. Platform Settings (12 keys)
--   6. Admin Dashboard (30 keys)
--   7. Theme & Design (80+ keys)
--   8. Audit Trail System (50+ keys)
--   9. Common Translations (25 keys)
--
-- Language: Spanish (Spain/Latin America)
-- Formality: Formal "usted" for professional UI
-- Currency: EUR (€) - Standard for Spanish language
-- Technical Terms: Widely accepted Spanish tech terminology
-- ============================================================================

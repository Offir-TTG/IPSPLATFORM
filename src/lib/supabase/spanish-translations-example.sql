-- Spanish Translations Example
-- This is a template showing how to add Spanish translations for all your UI text

-- Navigation translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('nav.home', 'es', 'Inicio', 'nav', 'general'),
  ('nav.programs', 'es', 'Programas', 'nav', 'general'),
  ('nav.courses', 'es', 'Cursos', 'nav', 'general'),
  ('nav.about', 'es', 'Acerca de', 'nav', 'general'),
  ('nav.contact', 'es', 'Contacto', 'nav', 'general'),
  ('nav.login', 'es', 'Iniciar sesión', 'nav', 'general'),
  ('nav.signup', 'es', 'Registrarse', 'nav', 'general'),
  ('nav.dashboard', 'es', 'Panel de control', 'nav', 'general'),
  ('nav.settings', 'es', 'Configuración', 'nav', 'general'),
  ('nav.logout', 'es', 'Cerrar sesión', 'nav', 'general')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Auth translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('auth.login.title', 'es', 'Iniciar sesión', 'auth', 'general'),
  ('auth.login.welcome', 'es', 'Bienvenido de nuevo', 'auth', 'general'),
  ('auth.login.email', 'es', 'Correo electrónico', 'auth', 'general'),
  ('auth.login.password', 'es', 'Contraseña', 'auth', 'general'),
  ('auth.login.button', 'es', 'Iniciar sesión', 'auth', 'general'),
  ('auth.signup.title', 'es', 'Crear cuenta', 'auth', 'general'),
  ('auth.signup.firstName', 'es', 'Nombre', 'auth', 'general'),
  ('auth.signup.lastName', 'es', 'Apellido', 'auth', 'general')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Common translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('common.save', 'es', 'Guardar', 'common', 'general'),
  ('common.cancel', 'es', 'Cancelar', 'common', 'general'),
  ('common.delete', 'es', 'Eliminar', 'common', 'general'),
  ('common.edit', 'es', 'Editar', 'common', 'general'),
  ('common.loading', 'es', 'Cargando...', 'common', 'general')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- Admin translations
INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  ('admin.languages.title', 'es', 'Idiomas', 'admin', 'admin'),
  ('admin.languages.add', 'es', 'Agregar idioma', 'admin', 'admin'),
  ('admin.languages.form.code', 'es', 'Código de idioma', 'admin', 'admin'),
  ('admin.languages.form.name', 'es', 'Nombre en inglés', 'admin', 'admin'),
  ('admin.languages.form.nativeName', 'es', 'Nombre nativo', 'admin', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

-- NOTE: You need to add translations for ALL translation keys in your system
-- This is just an example to get you started

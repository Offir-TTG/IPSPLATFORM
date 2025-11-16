-- ============================================================================
-- THEME & DESIGN - SPANISH TRANSLATIONS
-- ============================================================================
-- Complete Spanish translations for the Theme & Design admin page
-- Run this after adding Spanish language to the languages table
-- ============================================================================

INSERT INTO translations (translation_key, language_code, translation_value, category, context)
VALUES
  -- Page Headers (6 keys)
  ('admin.theme.title', 'es', 'Tema y Diseño', 'admin', 'admin'),
  ('admin.theme.subtitle', 'es', 'Personalizar colores y apariencia visual', 'admin', 'admin'),
  ('admin.theme.save', 'es', 'Guardar Cambios', 'admin', 'admin'),
  ('admin.theme.saving', 'es', 'Guardando...', 'admin', 'admin'),
  ('admin.theme.saveChanges', 'es', 'Guardar Cambios', 'admin', 'admin'),
  ('admin.theme.resetToDefault', 'es', 'Restablecer a Predeterminado', 'admin', 'admin'),

  -- UI Tabs (3 keys)
  ('admin.theme.colorsTab', 'es', 'Colores', 'admin', 'admin'),
  ('admin.theme.typographyTab', 'es', 'Tipografía', 'admin', 'admin'),
  ('admin.theme.sidebarTab', 'es', 'Barra Lateral', 'admin', 'admin'),

  -- Edit Mode (4 keys)
  ('admin.theme.editMode', 'es', 'Modo de Edición', 'admin', 'admin'),
  ('admin.theme.editModeHelp', 'es', 'Elige qué esquema de color personalizar', 'admin', 'admin'),
  ('admin.theme.lightMode', 'es', 'Claro', 'admin', 'admin'),
  ('admin.theme.darkMode', 'es', 'Oscuro', 'admin', 'admin'),

  -- Color Categories (4 keys)
  ('admin.theme.categoryBrand', 'es', 'Colores de Marca', 'admin', 'admin'),
  ('admin.theme.categoryFeedback', 'es', 'Colores de Retroalimentación', 'admin', 'admin'),
  ('admin.theme.categoryNeutral', 'es', 'Colores Neutros', 'admin', 'admin'),
  ('admin.theme.categoryBorders', 'es', 'Bordes y Campos', 'admin', 'admin'),

  -- Brand Colors (2 keys)
  ('admin.theme.primary', 'es', 'Primario', 'admin', 'admin'),
  ('admin.theme.secondary', 'es', 'Secundario', 'admin', 'admin'),

  -- Feedback Colors (4 keys)
  ('admin.theme.success', 'es', 'Éxito', 'admin', 'admin'),
  ('admin.theme.error', 'es', 'Destructivo', 'admin', 'admin'),
  ('admin.theme.warning', 'es', 'Advertencia', 'admin', 'admin'),
  ('admin.theme.info', 'es', 'Información', 'admin', 'admin'),

  -- Neutral Colors & Components (8 keys)
  ('admin.theme.background', 'es', 'Fondo', 'admin', 'admin'),
  ('admin.theme.card', 'es', 'Tarjeta', 'admin', 'admin'),
  ('admin.theme.popover', 'es', 'Ventana Emergente', 'admin', 'admin'),
  ('admin.theme.muted', 'es', 'Atenuado', 'admin', 'admin'),
  ('admin.theme.accent', 'es', 'Acento', 'admin', 'admin'),
  ('admin.theme.border', 'es', 'Borde', 'admin', 'admin'),
  ('admin.theme.input', 'es', 'Campo de Entrada', 'admin', 'admin'),
  ('admin.theme.ring', 'es', 'Anillo', 'admin', 'admin'),

  -- Typography Section (11 keys)
  ('admin.theme.fontFamilies', 'es', 'Familias de Fuentes', 'admin', 'admin'),
  ('admin.theme.fontPrimary', 'es', 'Fuente Primaria (Texto del Cuerpo)', 'admin', 'admin'),
  ('admin.theme.fontPrimaryHelp', 'es', 'Utilizada para todo el texto del cuerpo y párrafos', 'admin', 'admin'),
  ('admin.theme.fontHeading', 'es', 'Fuente de Encabezados', 'admin', 'admin'),
  ('admin.theme.fontHeadingHelp', 'es', 'Utilizada para encabezados y títulos', 'admin', 'admin'),
  ('admin.theme.fontMono', 'es', 'Fuente Monoespaciada (Código)', 'admin', 'admin'),
  ('admin.theme.fontMonoHelp', 'es', 'Utilizada para bloques de código y texto técnico', 'admin', 'admin'),
  ('admin.theme.fontSizes', 'es', 'Tamaños de Fuente', 'admin', 'admin'),
  ('admin.theme.fontWeights', 'es', 'Pesos de Fuente', 'admin', 'admin'),
  ('admin.theme.lineHeights', 'es', 'Alturas de Línea', 'admin', 'admin'),
  ('admin.theme.letterSpacing', 'es', 'Espaciado de Letras', 'admin', 'admin'),

  -- Font Group Labels (6 keys)
  ('admin.theme.fontGroupSystem', 'es', 'Fuentes del Sistema', 'admin', 'admin'),
  ('admin.theme.fontGroupHebrew', 'es', 'Fuentes Hebreas', 'admin', 'admin'),
  ('admin.theme.fontGroupGoogle', 'es', 'Fuentes de Google', 'admin', 'admin'),
  ('admin.theme.fontGroupMonospace', 'es', 'Fuentes Monoespaciadas', 'admin', 'admin'),
  ('admin.theme.fontSystemDefault', 'es', 'Predeterminado del Sistema', 'admin', 'admin'),
  ('admin.theme.fontSFMono', 'es', 'SF Mono', 'admin', 'admin'),

  -- Font Weight Labels (4 keys)
  ('admin.theme.weightNormal', 'es', 'Normal', 'admin', 'admin'),
  ('admin.theme.weightMedium', 'es', 'Medio', 'admin', 'admin'),
  ('admin.theme.weightSemibold', 'es', 'Semi-negrita', 'admin', 'admin'),
  ('admin.theme.weightBold', 'es', 'Negrita', 'admin', 'admin'),

  -- Line Height & Letter Spacing (6 keys)
  ('admin.theme.lineHeightTight', 'es', 'Ajustado', 'admin', 'admin'),
  ('admin.theme.lineHeightNormal', 'es', 'Normal', 'admin', 'admin'),
  ('admin.theme.lineHeightRelaxed', 'es', 'Relajado', 'admin', 'admin'),
  ('admin.theme.letterSpacingTight', 'es', 'Ajustado', 'admin', 'admin'),
  ('admin.theme.letterSpacingNormal', 'es', 'Normal', 'admin', 'admin'),
  ('admin.theme.letterSpacingWide', 'es', 'Amplio', 'admin', 'admin'),

  -- Text Colors (7 keys)
  ('admin.theme.textColors', 'es', 'Colores de Texto', 'admin', 'admin'),
  ('admin.theme.textBody', 'es', 'Texto del Cuerpo', 'admin', 'admin'),
  ('admin.theme.textHeading', 'es', 'Texto de Encabezado', 'admin', 'admin'),
  ('admin.theme.textMuted', 'es', 'Texto Atenuado', 'admin', 'admin'),
  ('admin.theme.textLink', 'es', 'Texto de Enlace', 'admin', 'admin'),
  ('admin.theme.textMutedPreview', 'es', 'Texto secundario', 'admin', 'admin'),
  ('admin.theme.textLinkPreview', 'es', 'Texto de enlace', 'admin', 'admin'),

  -- Color Picker (4 keys)
  ('admin.theme.colorBackground', 'es', 'Fondo', 'admin', 'admin'),
  ('admin.theme.colorForeground', 'es', 'Primer Plano', 'admin', 'admin'),
  ('admin.theme.colorForegroundPlaceholder', 'es', 'HSL del Primer Plano', 'admin', 'admin'),
  ('admin.theme.preview', 'es', 'Vista Previa', 'admin', 'admin'),

  -- Messages (5 keys)
  ('admin.theme.errorNoTheme', 'es', 'No se encontró tema activo', 'admin', 'admin'),
  ('admin.theme.errorLoadFailed', 'es', 'Error al cargar el tema', 'admin', 'admin'),
  ('admin.theme.successSaved', 'es', '¡Tema guardado exitosamente! Actualizando página...', 'admin', 'admin'),
  ('admin.theme.errorSaveFailed', 'es', 'Error al guardar el tema', 'admin', 'admin'),
  ('admin.theme.errorNoConfig', 'es', 'No se encontró configuración de tema. Por favor ejecuta la migración de base de datos.', 'admin', 'admin'),

  -- Border Radius (2 keys)
  ('admin.theme.borderRadius', 'es', 'Radio de Borde', 'admin', 'admin'),
  ('admin.theme.borderRadiusHelp', 'es', 'Controla el redondeo de esquinas (ej., 0.5rem, 8px)', 'admin', 'admin'),

  -- Sidebar Section (8 keys)
  ('admin.theme.sidebarColors', 'es', 'Colores de Barra Lateral', 'admin', 'admin'),
  ('admin.theme.sidebarBackground', 'es', 'Fondo de Barra Lateral', 'admin', 'admin'),
  ('admin.theme.sidebarForeground', 'es', 'Texto de Barra Lateral', 'admin', 'admin'),
  ('admin.theme.sidebarBorder', 'es', 'Borde de Barra Lateral', 'admin', 'admin'),
  ('admin.theme.sidebarActive', 'es', 'Fondo de Elemento Activo', 'admin', 'admin'),
  ('admin.theme.sidebarActiveForeground', 'es', 'Texto de Elemento Activo', 'admin', 'admin'),
  ('admin.theme.sidebarPreviewItem', 'es', 'Elemento de Menú', 'admin', 'admin'),
  ('admin.theme.sidebarPreviewActive', 'es', 'Activo', 'admin', 'admin'),

  -- Theme Customization (17 keys)
  ('admin.theme.saved', 'es', '¡Guardado!', 'admin', 'admin'),
  ('admin.theme.tab.colors', 'es', 'Colores', 'admin', 'admin'),
  ('admin.theme.tab.typography', 'es', 'Tipografía', 'admin', 'admin'),
  ('admin.theme.tab.branding', 'es', 'Marca', 'admin', 'admin'),
  ('admin.theme.colors.primaryColors', 'es', 'Colores Primarios', 'admin', 'admin'),
  ('admin.theme.colors.primary', 'es', 'Color Primario', 'admin', 'admin'),
  ('admin.theme.colors.secondary', 'es', 'Color Secundario', 'admin', 'admin'),
  ('admin.theme.colors.accent', 'es', 'Color de Acento', 'admin', 'admin'),
  ('admin.theme.colors.backgroundColors', 'es', 'Colores de Fondo', 'admin', 'admin'),
  ('admin.theme.colors.foreground', 'es', 'Color de Primer Plano (Texto)', 'admin', 'admin'),
  ('admin.theme.preview.title', 'es', 'Vista Previa', 'admin', 'admin'),
  ('admin.theme.preview.sampleHeading', 'es', 'Encabezado de Ejemplo', 'admin', 'admin'),
  ('admin.theme.preview.sampleText', 'es', 'Así es como se verá tu texto con los colores seleccionados.', 'admin', 'admin'),
  ('admin.theme.preview.primaryButton', 'es', 'Botón Primario', 'admin', 'admin'),
  ('admin.theme.preview.secondaryButton', 'es', 'Botón Secundario', 'admin', 'admin'),
  ('admin.theme.preview.note', 'es', 'Nota', 'admin', 'admin'),
  ('admin.theme.preview.noteText', 'es', 'Los cambios se aplicarán globalmente en todas las páginas después de guardar.', 'admin', 'admin')

ON CONFLICT (translation_key, language_code) DO UPDATE
  SET translation_value = EXCLUDED.translation_value,
      updated_at = NOW();

-- ============================================================================
-- Total: 110 Spanish translations for Theme & Design page
-- (104 original + 6 font group labels)
-- ============================================================================

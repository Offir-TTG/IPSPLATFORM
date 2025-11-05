export interface ThemeConfig {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;

  // Typography
  fontFamily: string;
  headingFontFamily: string;
  fontSize: string;

  // Layout
  borderRadius: string;

  // Branding
  platformName: string;
  logoText: string;

  // Metadata
  id?: string;
  created_at?: string;
  updated_at?: string;
}

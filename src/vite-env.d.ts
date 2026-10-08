/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** POST endpoint that receives inquiries as JSON (your backend / form service). */
  readonly VITE_INQUIRY_ENDPOINT?: string;
  /** Server route for the AI Project Brief. The provider key lives on that server. */
  readonly VITE_AI_BRIEF_ENDPOINT?: string;
  /** Public contact e-mail, once decided. */
  readonly VITE_CONTACT_EMAIL?: string;
}

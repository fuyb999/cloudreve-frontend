declare module "react-highlight-words" {
  import type { ComponentType } from "react";

  const Highlighter: ComponentType<Record<string, unknown>>;
  export default Highlighter;
}

declare module "react-google-recaptcha" {
  import type { Component, CSSProperties } from "react";

  export interface ReCAPTCHAProps {
    sitekey: string;
    onChange?: (token: string | null) => void;
    theme?: "light" | "dark";
    style?: CSSProperties;
  }

  export default class ReCAPTCHA extends Component<ReCAPTCHAProps> {
    reset(): void;
    getValue(): string | null;
  }
}

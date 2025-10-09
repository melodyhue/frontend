export interface OverlayOut {
  readonly id: string;
  readonly name: string;
  readonly template: string; // e.g., 'classic'
  readonly created_at: string; // date-time
  readonly updated_at: string; // date-time
}

export interface OverlayCreateIn {
  readonly name?: string; // default "Overlay"
  readonly template?: string; // default "classic"
}

export interface OverlayUpdateIn {
  readonly name?: string | null;
  readonly template?: string | null;
}

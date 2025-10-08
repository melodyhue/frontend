export interface OverlayOut {
  readonly id: string;
  readonly name: string;
  readonly color_hex: string; // ^#[0-9a-fA-F]{6}$
  readonly created_at: string; // date-time
  readonly updated_at: string; // date-time
}

export interface OverlayCreateIn {
  readonly name?: string; // default "Overlay"
  readonly color_hex?: string; // default "#25d865"
}

export interface OverlayUpdateIn {
  readonly name?: string | null;
  readonly color_hex?: string | null;
}

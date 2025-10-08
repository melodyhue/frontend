import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OverlayCreateIn, OverlayOut, OverlayUpdateIn } from '../models/overlay.model';

@Injectable({ providedIn: 'root' })
export class OverlaysService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<OverlayOut[]>('overlays/');
  }

  create(payload: OverlayCreateIn) {
    return this.http.post<OverlayOut>('overlays/', payload);
  }

  getById(overlay_id: string) {
    return this.http.get<OverlayOut>(`overlays/${overlay_id}`);
  }

  update(overlay_id: string, payload: OverlayUpdateIn) {
    return this.http.patch<OverlayOut>(`overlays/${overlay_id}`, payload);
  }

  delete(overlay_id: string) {
    return this.http.delete<void>(`overlays/${overlay_id}`);
  }

  duplicate(overlay_id: string) {
    return this.http.post<OverlayOut>(`overlays/${overlay_id}/duplicate`, {});
  }
}

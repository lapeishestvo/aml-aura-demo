import { Component, model } from '@angular/core';
import { reviewRoles, type ReviewRole } from './case-model';
import { FormsModule } from '@angular/forms';
import { AuraFormFieldComponents } from '@aura-ng/form-field-v2';
import { AuraSelectComponents } from '@aura-ng/select-v2';
import { AuraListboxComponents } from '@aura-ng/listbox';

@Component({
  selector: 'aml-global-sidebar', standalone: true,
  imports: [FormsModule, AuraFormFieldComponents, AuraSelectComponents, AuraListboxComponents],
  template: `
    <aside class="global-sidebar" [class.role-open]="roleSelect.isOpen()" aria-label="Notifications and role" tabindex="0">
      <div class="sidebar-collapsed" aria-hidden="true"><span class="notification-counter">1</span><img src="assets/sidebar-status-collapsed.svg" width="24" height="24" alt=""></div>
      <div class="sidebar-expanded">
        <div class="sidebar-notifications">
          <div class="sidebar-tabs"><div class="sidebar-tab selected">Notificaciones <span class="notification-counter">1</span></div><div class="sidebar-tab">Incidentes</div></div>
          <div class="sidebar-static-field sidebar-filter"><div><span>Todos los tipos de notificacion</span><p>Incidentes</p></div><img src="assets/sidebar-filter-chevron.svg" width="16" height="16" alt=""></div>
          <div class="sidebar-notification"><div class="sidebar-notification-meta"><span>Nuevo incidente</span><span>1 de sep 2026, 2:58 p.m.</span></div><p>No se puede crear una solicitud de entrada</p></div>
        </div>
        <div class="sidebar-footer">
          <div class="sidebar-actions">Acciones <img src="assets/sidebar-actions-chevron.svg" width="20" height="20" alt=""></div>
          <aura-form-field size="m" surface="secondary" labelBehavior="float" class="sidebar-role">
            <img auraLeading src="assets/sidebar-user.svg" width="20" height="20" alt="">
            <aura-label>Role</aura-label>
            <aura-select #roleSelect="auraSelect">
              <aura-select-form-field-trigger aria-label="Role" [ngModel]="role()" (ngModelChange)="role.set($event)" />
              <ul *auraPanel auraListbox>@for (option of roles; track option) { <li auraOption [value]="option">{{ option }}</li> }</ul>
            </aura-select>
          </aura-form-field>
          <div class="sidebar-static-field sidebar-status"><img src="assets/sidebar-status.svg" width="20" height="20" alt=""><div><span>Status</span><p>Trabajando</p></div><img src="assets/sidebar-role-chevron.svg" width="20" height="20" alt=""></div>
        </div>
      </div>
    </aside>
  `,
})
export class GlobalSidebar {
  readonly role = model<ReviewRole>('Analyst');
  readonly roles = reviewRoles;
}

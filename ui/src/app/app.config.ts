import { ApplicationConfig, NgModule, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AzureChatComponent } from './azure-chat/azure-chat.component';
import { CommonModule } from '@angular/common';
import {  HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ChatThreadComponent } from './chat-thread/chat-thread.component';
import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {DataViewModule} from 'primeng/dataview';
import { ContextMenuModule } from 'primeng/contextmenu';

@NgModule({
  declarations: [AzureChatComponent, ChatThreadComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NgbDropdownModule,
    NgbModalModule,
    MultiSelectModule,
    InputTextModule,
    RippleModule,
    ButtonModule,
    SidebarModule,
    OverlayPanelModule,
    DataViewModule,
    ContextMenuModule
    // other module imports
  ],
  providers: [HttpClient] // Ensure HttpClient is provided
  // other configurations
})
export class AppConfigModule { }

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), importProvidersFrom([BrowserAnimationsModule])]
};

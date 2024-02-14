import { Routes } from '@angular/router';
import { AzureChatComponent } from './azure-chat/azure-chat.component';
import { ChatThreadComponent } from './chat-thread/chat-thread.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { HttpClient } from '@angular/common/http';

export const routes: Routes = [
    {path: '', component: AzureChatComponent, canActivate: [authGuard]},
    {path: 'login', component: LoginComponent}
];

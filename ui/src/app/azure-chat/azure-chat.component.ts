import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatClient, ChatThreadClient, ChatThreadItem, ChatThreadProperties } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-azure-chat',
  templateUrl: './azure-chat.component.html',
  styleUrl: './azure-chat.component.scss',
})
export class AzureChatComponent {
  communicationUserId: string = '';
  userAccessToken: string = '';
  chatClient: ChatClient | any = null;
  topicName: string = '';
  displayName: string = '';
  threadLink: string = '';
  threadId: string = '';
  chatThreadClient: ChatThreadClient | any = null;
  otherCommunicationUserId: string = '';
  otherDisplayName: string = '';
  groupTopicname: string = '';

  chats: { threadId: string, topic: string, participants?: IUser[] }[] = [];

  constructor(private http: HttpClient, private router: Router, private modalService: NgbModal) {
  }

  users: { label: string, value: string }[] = [];

  selectedUser?: { label: string, value: string }[] = undefined;

  ngOnInit(): void {
    let userId = localStorage.getItem("user");
    this.http.get(`${environment.apiUrl}/user/refreshToken/${userId}`).subscribe((data: any) => {
      this.userAccessToken = data.token;
      this.communicationUserId = userId ?? '';
      this.chatClient = new ChatClient(environment.azureCommunication.connectionString, new AzureCommunicationTokenCredential(this.userAccessToken));
      this.listAllChatThreads();
      this.getUsers();
    });
  }

  async getUsers() {
    let userId = localStorage.getItem("user");
    this.users = await this.http.get<IUser[]>(`${environment.apiUrl}/user/get-user/` + userId).pipe(
      map((data: IUser[]) => data.map((x) => ({ label: x.userName, value: x.userId })))
    ).toPromise() ?? [];
  }

  open(content: TemplateRef<any>) {
    let that = this;
    this.modalService.open(content, {
      centered: true, animation: true, windowClass: 'ngb-modal-custom'

    }).result.then(
      (result) => {
      },
      (reason) => {
      },
    );
  }


  async createChatThread(users: IUser[], topicName: string): Promise<ChatThreadProperties> {
    let createChatThreadRequest = {
      topic: topicName
    };
    let createChatThreadOptions = {
      participants: users.map((x) => {
        return {
          id: { communicationUserId: x.userId },
          displayName: x.userName
        }
      }),

    };
    let createChatThreadResult = await this.chatClient.createChatThread(
      createChatThreadRequest,
      createChatThreadOptions
    );
    let threadId = createChatThreadResult.chatThread.id;
    console.log(`Thread created:${threadId}`);
    return createChatThreadResult.chatThread;
  }
  async AddUserParticipantToTheChatThread() {
    let addParticipantsRequest =
    {
      participants: [
        {
          id: { communicationUserId: this.otherCommunicationUserId },
          displayName: this.otherDisplayName
        }
      ]
    };
    let addUser = await this.chatThreadClient.addParticipants(addParticipantsRequest);
    console.log(addUser);
  }
  async listAllChatThreads() {
    let threads: AsyncIterableIterator<ChatThreadItem> = this.chatClient.listChatThreads();
    for await (const  thread of threads) {
      if(!thread.deletedOn) {
        this.chats.push({ topic: thread.topic, threadId: thread.id, participants: await this.loadParticipants(thread.id) });
      }
    }

    if (this.chats.length > 0) {
      this.threadId = this.chats[0].threadId;
      this.topicName = this.chats[0].topic;
    }
  }

  async loadParticipants(threadId: string) {
    let users: IUser[] = [];
    var client = this.chatClient.getChatThreadClient(threadId)
    const participants = client?.listParticipants();
    if (!participants) {
      return;
    }

    for await (const message of participants) {
      users.push({ userId: message.id.communicationUserId, userName: message.displayName });
    }

    return users;
  }

  goToChat(chat: { threadId: string, topic: string }) {
    this.threadId = chat.threadId;
    this.topicName = chat.topic;
  }

  async createChat() {
    let creator = localStorage.getItem("userName");
    if (this.selectedUser && this.selectedUser[0].value) {
      const selectedUser = this.selectedUser[0];
      if (this.checkAndChangeToThread(this.selectedUser[0].value)) {
        let users: IUser[] = [{
          userId: this.communicationUserId,
          userName: creator ?? this.communicationUserId
        }, {
          userId: selectedUser.value,
          userName: selectedUser.label
        }];
        let thread = await this.createChatThread(users, `${this.communicationUserId + '-' + selectedUser.value}`);
        this.chats.push({ threadId: thread.id, topic: thread.topic, participants: await this.loadParticipants(thread.id) });
        this.modalService.dismissAll();
        this.selectedUser = [];
        this.goToChat({ threadId: thread.id, topic: thread.topic });
        return true;
      }
    }

    return true;
  }

  async addGroupChat() {

    if (!this.groupTopicname || !(this.selectedUser && this.selectedUser.length > 0)) {
      return;
    }

    let creator = localStorage.getItem("userName");
    let users: IUser[] = [{
      userId: this.communicationUserId,
      userName: creator ?? this.communicationUserId
    }, ...this.selectedUser.map(x => ({ userId: x.value, userName: x.label }))];

    if (users.length <= 2) {
      return true;
    }

    let thread = await this.createChatThread(users, this.groupTopicname);
    this.chats.push({ threadId: thread.id, topic: thread.topic, participants: await this.loadParticipants(thread.id) });
    this.modalService.dismissAll();
    this.selectedUser = [];
    this.goToChat({ threadId: thread.id, topic: thread.topic });
    return true;
  }

  getChatUsers(threadId: string) {
    return this.chats.find(x => x.threadId == threadId)?.participants;
  }

  async deleteChat(threadId: string) {
     await this.chatClient.deleteChatThread(threadId);
     let chatIndex = this.chats.findIndex(x=>x.threadId == threadId);
     if(chatIndex > -1) {
        let chat = this.chats[0];
        this.chats = this.chats.splice(chatIndex, 1);
        if(chat.threadId == this.threadId) {
          this.threadId =  this.chats[0] ? this.chats[0].threadId: "";
        }
     }
  }

  // Inside the component class
  getParticipant(chat: any) {

    if (chat.participants && chat.participants.length > 2) {
      return chat.topic;
    }

    let chatParticipants = chat.participants?.find((x: any) => x.userId != this.communicationUserId);
    return chatParticipants?.userName ?? chat.topic;
  }

  checkAndChangeToThread(userId: string) {
    let chat = this.chats.find(x => x.participants && x.participants.length == 2 && x.participants.some(y => y.userId == userId));
    if (chat) {
      this.modalService.dismissAll();
      this.selectedUser = [];
      this.goToChat({ threadId: chat.threadId, topic: chat.topic });
      return false;
    }
    return true;
  }

  logout() {
    window.localStorage.clear();
    this.router.navigate(['/login']);
  }
}

export interface IUser {
  userId: string;
  userName: string;
}

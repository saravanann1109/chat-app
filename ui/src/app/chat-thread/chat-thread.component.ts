import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, Renderer2, SimpleChanges, ViewChild, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatClient, ChatMessageContent, ChatParticipant, ChatThreadClient, SendMessageOptions, SendMessageRequest } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { IUser } from '../azure-chat/azure-chat.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-chat-thread',
  templateUrl: './chat-thread.component.html',
  styleUrl: './chat-thread.component.scss'
})
export class ChatThreadComponent implements OnChanges, OnDestroy {
  communicationUserId: any;
  communicatorUserName: any = '';
  userAccessToken: string = '';
  chatClient: ChatClient | any = null;
  displayName: string = '';
  currentThreadId: any;
  notifyDisplayName: string = '';
  chatThreadClient?: ChatThreadClient = undefined;
  messageSending: boolean = false;
  messageSenderName: string = '';
  sidebarVisible: boolean = false;
  public apiUrl = environment.apiUrl;
  @ViewChild('scrollMe') private myScrollContainer?: ElementRef;
  @Input('userId') userId: string = '';
  @Input('threadId') threadId: string = '';
  @Input('topicName') topicName: string = '';
  @Input('participants') users?: IUser[] = [];
  isGroup: boolean = false;
  imageUrl: any = "";

  constructor(public http: HttpClient,
    private changeDetection: ChangeDetectorRef,
    private route: ActivatedRoute,
    private renderer: Renderer2) { }
  ngOnDestroy(): void {
    console.log("destroyed");
    this.chatThreadClient = undefined;
    this.chatClient = null;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['threadId'] && changes['threadId'].currentValue != changes['threadId'].previousValue) {
      this.loadData(this.userId, changes['threadId'].currentValue);
    }
  }

  loadData(userId: string, threadId: string) {
    this.isGroup = this.users && this.users.length > 2 ? true : false;
    this.currentThreadId = threadId;
    this.communicationUserId = userId;
    this.http.get(`${this.apiUrl}/user/refreshToken/` + userId).subscribe((data: any) => {
      this.userAccessToken = data.token;
      this.chatClient = new ChatClient(environment.azureCommunication.connectionString, new AzureCommunicationTokenCredential(this.userAccessToken));
      this.chatThreadClient = this.chatClient.getChatThreadClient(threadId);
      this.setupHandlers();
      this.loadParticipants();
    });
  }

  messages: message[] = [];
  sendMsg: message = { id: '', message: '', sender: '', isOwner: false };
  participants: ChatParticipant[] = [];

  ngOnInit(): void {
    this.loadData(this.userId, this.threadId);
  }

  async loadParticipants() {
    const participants = this.chatThreadClient?.listParticipants();

    if (!participants) {
      return;
    }

    for await (const message of participants) {
      this.participants.push(message);
    }

    this.participants.forEach((x: any) => {
      if (x.id.communicationUserId == this.communicationUserId) {
        this.communicatorUserName = x.displayName;
      }
      else {
        this.messageSenderName = x.displayName;
      }
    });
  }

  async setupHandlers() {
    this.getListMessages();
    await this.chatClient.startRealtimeNotifications();
    this.chatClient.on("chatMessageReceived", ((state: any) => {
      this.addMessage(state);
    }).bind(this));

    this.chatClient.on("chatMessageEdited", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("chatMessageDeleted", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("typingIndicatorReceived", ((state: any) => {
      // this.getListMessages();
      this.showTyping(state);
    }).bind(this));
    this.chatClient.on("readReceiptReceived", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("chatThreadCreated", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("chatThreadDeleted", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("chatThreadPropertiesUpdated", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("participantsAdded", ((state: any) => {
      this.getListMessages();
    }).bind(this));
    this.chatClient.on("participantsRemoved", ((state: any) => {
      this.getListMessages();
    }).bind(this));
  }

  showTyping(state: any) {
    if (state.senderDisplayName && state.senderDisplayName != this.communicatorUserName) {
      this.notifyDisplayName = state.senderDisplayName;
    }
    else {
      this.notifyDisplayName = '';
    }
  }

  addMessage(data: any) {
    console.log(data);

    if (!this.messages.some(x => x.id == data.id)) {
      let msg = undefined;
      if(this.checkJson(data.message)) {
        let parsed = JSON.parse(data.message);
        msg = {
          id: data.id,
          sender: data.senderDisplayName,
          message: parsed.message,
          isOwner: data.sender.communicationUserId == this.communicationUserId,
          createdOn: data.createdOn,
          image: parsed.attachments[0].url.split('/').pop()
        };
      }
      else {
        msg = {
          id: data.id,
          sender: data.senderDisplayName,
          message: data.message,
          isOwner: data.sender.communicationUserId == this.communicationUserId,
          createdOn: data.createdOn,
      };
    }

      this.messages.push(msg);
      this.scrollToBottom();
    }
  }

  async getListMessages() {
    this.messages = [];

    let currentDate = new Date();

    // Subtract one hour from the current time
    let oneHourBefore = new Date(currentDate.getTime() - (1 * 60 * 60 * 1000));

    const messages = <any>this.chatThreadClient?.listMessages({startTime: oneHourBefore});

    if (!messages) {
      return;
    }

    for await (const message of messages) {
      if (message.type == "text") {
        let messageObj = this.messages.find(x => x.id == message.id);
        if(this.checkJson(message.content.message)) {
          let parsed = JSON.parse(message.content.message);
          if (messageObj) {
            messageObj = {
              id: message.id,
              sender: message.senderDisplayName,
              message: parsed.message,
              isOwner: message.sender?.communicationUserId == this.communicationUserId,
              createdOn: message.createdOn,
              image: parsed.attachments ? parsed.attachments[0].url.split('/').pop() : undefined 
            };
          }
          else {
            let msg: message = {
              id: message.id,
              sender: message.senderDisplayName,
              message: parsed.message ?? parsed.message,
              isOwner: message.sender.communicationUserId == this.communicationUserId,
              createdOn: message.createdOn,
              image: parsed.attachments ? parsed.attachments[0].url.split('/').pop() : undefined 
            };
            this.messages.push(msg);
          }
        }
        else {
          if (messageObj) {
            messageObj = {
              id: message.id,
              sender: message.senderDisplayName,
              message: message.content?.message,
              isOwner: message.sender?.communicationUserId == this.communicationUserId,
              createdOn: message.createdOn
            };
          }
          else {
            let msg: message = {
              id: message.id,
              sender: message.senderDisplayName,
              message: message.content.message,
              isOwner: message.sender.communicationUserId == this.communicationUserId,
              createdOn: message.createdOn
            };
            this.messages.push(msg);
          }
        }
      }
    }
    this.messages = this.messages.sort((a, b) => a.createdOn!.getTime() - b.createdOn!.getTime());
    this.changeDetection.detectChanges();
    this.scrollToBottom();
  }
  async sendMessage() {
    if (!this.sendMsg.message) {
      return;
    }

    this.messageSending = true;

    let fileURL = undefined;
    if (this.sendMsg.file) {
      fileURL = await this.sendLargeFileAttachment(this.sendMsg.file);
      if(!fileURL) {
        return;
      }
      const messageContent: ChatMessageContent = {
        message: this.sendMsg.message,
        attachments: [
          {
            attachmentType: 'image',
            url: fileURL,
            id: fileURL
          },
        ],
      };

      await this.chatThreadClient?.sendMessage({
        content: JSON.stringify(messageContent)
      }, {
        senderDisplayName: this.communicatorUserName,
        type: 'text',
      });
      this.sendMsg = { id: '', message: '', sender: '', isOwner: false };
      this.messageSending = false;
      return;
    }


    let sendMessageRequest: SendMessageRequest =
    {
      content: this.sendMsg.message
    };
    let sendMessageOptions: SendMessageOptions =
    {
      senderDisplayName: this.communicatorUserName,
      type: 'html',
    };
    const sendChatMessageResult = await this.chatThreadClient?.sendMessage(sendMessageRequest, { senderDisplayName: this.communicatorUserName, type: 'text' });
    if (!sendChatMessageResult) {
      return;
    }
    const messageId = sendChatMessageResult.id;
    this.sendMsg = { id: '', message: '', sender: '', isOwner: false };
    this.messageSending = false;
  }
  async ListUsersInChatThread() {
    const participants = this.chatThreadClient?.listParticipants();
    if (!participants) {
      return;
    }
    for await (const participant of participants) {
      console.log(participant);
    }
  }
  async RemoveUserFromChatThread(userId: any) {
    await this.chatThreadClient?.removeParticipant({ communicationUserId: userId });
    await this.ListUsersInChatThread();
  }

  scrollToBottom(): void {
    try {

      setTimeout(() => {
        if (this.myScrollContainer && this.myScrollContainer.nativeElement) {
          this.renderer.setProperty(this.myScrollContainer.nativeElement, 'scrollTop', this.myScrollContainer.nativeElement.scrollHeight);
        }
      }, 0);

    } catch (err) { }
  }

  async notifyTyping() {
    await this.chatThreadClient?.sendTypingNotification({ senderDisplayName: this.communicatorUserName });
  }

  async stopNotify() {
    await this.chatThreadClient?.sendTypingNotification();
  }

  uploadImage(data: any) {
    this.sendMsg.file = data.target.files[0];
    if (this.sendMsg.file ) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.sendMsg.file);
    }
  }

  cancelUpload() {
    this.sendMsg.file = undefined;
  }

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async sendLargeFileAttachment(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return new Promise<string>((resolve, reject) => {
      this.http.post<any>(`${this.apiUrl}/images/upload`, formData)
        .subscribe(
          response => {
            console.log('Image uploaded successfully. Image URL:', response.imageUrl);
            resolve(response.imageUrl);
          },
          error => {
            console.error('Error uploading image:', error);
            reject('Error uploading image');
          }
        );
    });

  }

  checkJson(jsonString:string) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }

  getUserName(userId: string) {
    return this.users?.find(x=>x.userId == userId)?.userName;
  }

  getHeaderName() {
    return this.users?.find(x=>x.userId != this.userId)?.userName;
  }
}

interface message {
  id: string
  sender?: string,
  message?: string
  isOwner: boolean,
  createdOn?: Date
  file?: File
  image?: string
}
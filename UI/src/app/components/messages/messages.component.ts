// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from '../../../../../infrastructure-ts/resources/models/message';
import { CommunicationService } from 'src/app/services/communication.service';
import { Agent } from '../../../../../infrastructure-ts/resources/models/agent';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserModel } from 'src/app/models/user';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit {

  private agent!: Agent;
  @Input() set Agent(agent: Agent) {
    this.agent = agent;
    this.loadAgent(agent);
  }
  get Agent(): Agent {
    return this.agent;
  }

  private communicationSubstription!: Subscription;

  public messages: Message[] = [];

  public messageText: string = "";
  public user!: UserModel;
  constructor(private communicationService: CommunicationService,
    private apiService: ApiService,
    private authService: AuthService) { }

  async ngOnInit() {
    this.communicationSubstription = this.communicationService.getSubscribableSocket().subscribe((t: string) => {
      let payload = JSON.parse(t);
      if (payload.type == "Message") {

        let message = payload as Message;
        if(message.channelId == this.agent.id) {
          this.messages.push(payload);
        }
      }
    });

    this.user = this.authService.getUser();
  }

  async loadAgent(agent: Agent) {
    await this.apiService.getAgentMessages(agent.id).then(c => { this.messages = c });
  }

  onDestroy() {
    this.communicationSubstription.unsubscribe();
  }

  async sendMessage(text: string) {
    console.log("Sending message:" + text);
    let message = new Message({
      sender: this.user.username,
      text: text,
      channelId: this.Agent.id,
      sentAt: new Date()
    });

    this.communicationService.sendMessage(message);
    this.messageText = "";
  }
}

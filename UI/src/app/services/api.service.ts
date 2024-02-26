// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Agent } from '../../../../infrastructure-ts/resources/models/agent';
import { Message } from '../../../../infrastructure-ts/resources/models/message';
import { AppConfigService } from './config.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  jsonHeaders: HttpHeaders;
  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.jsonHeaders = new HttpHeaders();
    this.jsonHeaders = this.jsonHeaders.set('Content-Type', 'application/json; charset=utf-8');
  } 


  getAgentMessages(channelId: string): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      this.http.get<Message[]>(`${this.appConfig.getConfig().api_url}/agents/messages/${channelId}`, { observe: 'response' })
        .subscribe(res => {
          resolve(res.body!);
        }, (errorResponse: HttpErrorResponse) => {
          console.log(errorResponse);
          reject(errorResponse);
        });
    });
  }


  getAgents(userName: string): Promise<Agent[]> {
    return new Promise<Agent[]>((resolve, reject) => {
      this.http.get<Agent[]>(this.appConfig.getConfig().api_url + `/agents/all/${userName}`, { observe: 'response' })
        .subscribe(res => {
          resolve(res.body!);
        }, (errorResponse: HttpErrorResponse) => {
          console.log(errorResponse);
          reject(errorResponse);
        });
    });
  }

  createAgent(agent: Agent): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.http.post<any>(this.appConfig.getConfig().api_url + '/agents', JSON.stringify(agent), { headers: this.jsonHeaders })
        .subscribe(res => {
          resolve(res);
        }, (errorResponse: HttpErrorResponse) => {
          console.log(errorResponse);
          reject(errorResponse);
        });
    });
  }
}
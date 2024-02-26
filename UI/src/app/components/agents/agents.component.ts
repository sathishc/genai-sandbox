import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { Agent } from '../../../../../infrastructure-ts/resources/models/agent';
import { AddAgentComponent } from '../add-agent/add-agent.component';
import { AuthService } from 'src/app/services/auth.service';

export interface Section {
  name: string;
  member_count: number;
}

@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss']
})
export class AgentsComponent implements OnInit {
  public agents!: Agent[];
  public selectedAgent!: Agent;
  private _agentSelections!: Agent[];
  get agentSelections(): Agent[] {
      return this._agentSelections;
  }
  set agentSelections(value: Agent[]) {
      this._agentSelections = value;
      if(this._agentSelections.length > 0)
      {
        this.selectedAgent = this._agentSelections[0];
      }
  }

  constructor(public dialog: MatDialog, 
              public apiService: ApiService,
              private authService: AuthService,
              public router: Router) { }

  async ngOnInit() {
    this.refreshAgents();
  }

  logout() {
    this.router.navigate(['/logout']);
  }

  async refreshAgents() {
    let currentUser = this.authService.getUser();
    await this.apiService.getAgents(currentUser.username).then(c => {this.agents = c});
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AddAgentComponent, {
      width: '250px',
      data: { },
    });

    dialogRef.afterClosed().subscribe(async data => {
      console.log('The dialog was closed');
      console.log(data);
      if(data !== undefined) {
        let currentUser = this.authService.getUser();
        await this.apiService.createAgent({
          id: data.name + "@" + currentUser.username, 
          username: currentUser.username,
          agentId:data.agentId, 
          agentAliasId:data.agentAliasId, 
          Participants:[]})
        this.refreshAgents();
      }
    });
  }
}
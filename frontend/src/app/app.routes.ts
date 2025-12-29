import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LobbyComponent } from './pages/lobby/lobby.component';
import { GameComponent } from './pages/game/game.component';
import { HostPanelComponent } from './pages/host-panel/host-panel.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'lobby/:code', component: LobbyComponent },
  { path: 'game/:code', component: GameComponent },
  { path: 'host/:code', component: HostPanelComponent },
  { path: '**', redirectTo: '' }
];
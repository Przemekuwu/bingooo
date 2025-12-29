import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="margin: 0;">Sala: <span style="color: blue; background: #e3f2fd; padding: 5px 10px; border-radius: 4px;">{{ roomCode }}</span></h2>
        <div style="font-size: 14px; color: #666;">
          Tu ID: {{ myId.substring(0, 10) }}...
        </div>
      </div>
      
      <h3>👥 Jugadores en la sala ({{ players.length }}):</h3>
      <ul style="list-style: none; padding: 0;">
        <li *ngFor="let p of players" style="padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span [style.font-weight]="p.playerId === myId ? 'bold' : 'normal'" 
                  [style.color]="p.playerId === myId ? '#2e7d32' : 'black'">
              {{ p.nickname }} 
              <small *ngIf="p.playerId === myId"> (Tú)</small>
            </span>
            
            <span *ngIf="p.host" style="margin-left: 10px; background: #ffd700; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
              ⭐ HOST
            </span>
          </div>
          
          <div>
            <span *ngIf="!p.socketId" style="color: #d32f2f; font-size: 11px; margin-right: 10px;">
              ⚠️ Desconectado
            </span>
            <span *ngIf="p.socketId" style="color: #4caf50; font-size: 11px;">
              ● En línea
            </span>
          </div>
        </li>
      </ul>

      <div *ngIf="isHost" style="margin-top: 30px; padding: 20px; background: #f1f8e9; border: 2px solid #81c784; border-radius: 8px;">
        <p style="margin: 0 0 15px 0; color: #2e7d32;">
          <b>¡Eres el Host!</b> Espera a que se unan todos y dale a empezar.
          <br><small>Como host, tendrás acceso al panel de control para cantar números.</small>
        </p>
        <button 
          (click)="startGame()"
          style="background: #4caf50; color: white; border: none; padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; width: 100%;">
          INICIAR PARTIDA 🎰
        </button>
      </div>

      <div *ngIf="!isHost" style="margin-top: 30px; padding: 20px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #666;">Esperando a que el Host inicie el juego...</p>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">
          Se te redirigirá automáticamente cuando el juego comience
        </p>
      </div>
      
      <div style="margin-top: 30px; padding: 15px; background: #e8eaf6; border-radius: 5px;">
        <p style="margin: 0; color: #3f51b5; font-size: 14px;">
          <strong>📢 Instrucciones:</strong><br>
          1. El host debe iniciar el juego cuando todos estén listos<br>
          2. Los jugadores recibirán su cartilla de bingo única<br>
          3. El host cantará números y los jugadores marcarán sus cartillas<br>
          4. ¡El primero en completar un patrón grita BINGO!
        </p>
      </div>
    </div>
  `
})
export class LobbyComponent implements OnInit {
  roomCode = '';
  players: any[] = [];
  isHost = false;
  myId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socket: SocketService
  ) {}

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code')!;
    this.myId = this.socket.getPlayerId();
    const session = this.socket.getSession();

    console.log('🎮 Lobby inicializado para sala:', this.roomCode);

    // Escuchar lista de jugadores
    this.socket.onPlayerList(players => {
      this.players = players;
      const me = players.find(p => p.playerId === this.myId);
      this.isHost = me ? me.host : false;
    });

    // Escuchar cuando el juego comienza
    this.socket.onGameStarted(() => {
      const me = this.players.find(p => p.playerId === this.myId);
      if (me && me.host) {
        // Host va al panel de control
        this.router.navigate(['/host', this.roomCode]);
      } else {
        // Jugadores van al juego
        this.router.navigate(['/game', this.roomCode]);
      }
    });

    // Unirse a la sala
    if (session.nickname) {
      this.socket.joinRoom(this.roomCode, session.nickname);
    }
  }

  startGame() {
    this.socket.startGame(this.roomCode);
  }
}
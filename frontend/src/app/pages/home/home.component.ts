import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="text-align: center; margin-top: 50px; padding: 20px;">
      <h1 style="color: #4caf50; font-size: 48px; margin-bottom: 10px;">🎰 Bingo-Finds</h1>
      <p style="color: #666; margin-bottom: 40px; font-size: 18px;">¡Atrapa a todos los Pokémon con el Bingo!</p>
      
      <div style="max-width: 400px; margin: 0 auto; padding: 30px; background: #f8f9fa; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 25px;">
          <input 
            placeholder="Tu Nickname" 
            [(ngModel)]="nickname" 
            style="padding: 15px; width: 100%; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box;"
            (keyup.enter)="nickname ? createRoom() : null">
          <p style="font-size: 12px; color: #666; margin-top: 5px; text-align: left;">Elige un nombre para identificarte</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <button 
            (click)="createRoom()" 
            style="background: #4caf50; color: white; border: none; padding: 15px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;"
            [disabled]="!nickname"
            [style.background]="!nickname ? '#cccccc' : '#4caf50'"
            [style.cursor]="!nickname ? 'not-allowed' : 'pointer'">
            Crear Sala
          </button>
          
          <button 
            (click)="joinRoom()" 
            style="background: #2196f3; color: white; border: none; padding: 15px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;"
            [disabled]="!nickname || !roomCode"
            [style.background]="!nickname || !roomCode ? '#cccccc' : '#2196f3'"
            [style.cursor]="!nickname || !roomCode ? 'not-allowed' : 'pointer'">
            Unirse
          </button>
        </div>
        
        <div style="margin-top: 25px;">
          <div style="margin-bottom: 15px;">
            <input 
              placeholder="Código de Sala (ej: ABCD)" 
              [(ngModel)]="roomCode" 
              style="padding: 15px; width: 100%; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; text-transform: uppercase;"
              (keyup.enter)="nickname && roomCode ? joinRoom() : null">
            <p style="font-size: 12px; color: #666; margin-top: 5px; text-align: left;">Pídele el código al host de la sala</p>
          </div>
        </div>
      </div>
      
      <div *ngIf="error" 
           style="max-width: 400px; margin: 20px auto; padding: 15px; background: #ffebee; border: 2px solid #f44336; border-radius: 8px; color: #d32f2f; font-weight: bold;">
        {{ error }}
      </div>
      
      <div style="margin-top: 50px; color: #666; font-size: 14px;">
        <p><strong>✨ Características:</strong></p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; max-width: 600px; margin: 20px auto;">
          <div style="padding: 10px;">✅ Cartillas persistentes</div>
          <div style="padding: 10px;">✅ Multi-jugador en tiempo real</div>
          <div style="padding: 10px;">✅ Panel de control para el host</div>
          <div style="padding: 10px;">✅ Verificación automática de BINGO</div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  nickname = '';
  roomCode = '';
  error = '';

  constructor(private socket: SocketService, private router: Router) {
    this.socket.onRoomCreated((data) => {
      this.socket.saveSession(data.roomCode, this.nickname);
      this.router.navigate(['/lobby', data.roomCode]);
    });
    
    this.socket.onError((error) => {
      this.error = error.message || 'Error al conectar con el servidor';
      setTimeout(() => this.error = '', 5000);
    });
  }

  createRoom() {
    if (!this.nickname) {
      this.error = 'Debes ponerte un nombre';
      return;
    }
    if (this.nickname.length < 2) {
      this.error = 'El nombre debe tener al menos 2 caracteres';
      return;
    }
    this.error = '';
    this.socket.createRoom(this.nickname);
  }

  joinRoom() {
    if (!this.nickname) {
      this.error = 'Debes ponerte un nombre';
      return;
    }
    if (!this.roomCode) {
      this.error = 'Debes ingresar un código de sala';
      return;
    }
    if (this.roomCode.length !== 4) {
      this.error = 'El código debe tener 4 caracteres';
      return;
    }
    
    this.error = '';
    const roomCodeUpper = this.roomCode.toUpperCase();
    this.socket.saveSession(roomCodeUpper, this.nickname);
    this.router.navigate(['/lobby', roomCodeUpper]);
  }
}
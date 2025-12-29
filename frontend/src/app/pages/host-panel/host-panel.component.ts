import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-host-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif; max-width: 1400px; margin: 0 auto;">
      <!-- Encabezado -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
        <div>
          <h1 style="margin: 0; color: #333;">🎮 Bingo-Finds - Panel del Host</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 16px;">
            Sala: <span style="color: #2196f3; font-weight: bold; font-size: 18px;">{{ roomCode }}</span>
            <span style="margin-left: 15px; background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
              🎮 Modo Host
            </span>
          </p>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button (click)="goToGame()" 
                  style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>🎯</span> Ir al Juego
          </button>
          
          <button (click)="verifyRoomState()" 
                  style="background: #607d8b; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 5px;">
            <span>🔍</span> Ver Estado
          </button>
        </div>
      </div>
      
      <!-- Notificación de línea completada -->
      <div *ngIf="lineCompletedNotification" 
           style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #ffeb3b, #ff9800); border: 3px solid #ff5722; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);">
        <h3 style="color: #d32f2f; margin: 0 0 15px 0; font-size: 24px;">🎉 ¡LÍNEA COMPLETADA! 🎉</h3>
        <p style="color: #333; font-size: 18px; margin: 0 0 20px 0; font-weight: bold;">{{ lineCompletedNotification }}</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <button (click)="acknowledgeLine()" 
                  style="background: #2196f3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>✅</span> Aceptar y Continuar
          </button>
          <button *ngIf="gameCompleted" (click)="endGame()" 
                  style="background: #f44336; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>🏁</span> Finalizar Partida
          </button>
          <button *ngIf="!blackoutMode" (click)="activateBlackoutMode()" 
                  style="background: #673ab7; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
            <span>🎯</span> Activar Modo Apagón
          </button>
        </div>
      </div>
      
      <!-- Panel principal -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">
        <!-- Columna Izquierda: Control del Juego -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
          <h2 style="color: #4caf50; margin-bottom: 25px; font-size: 22px; display: flex; align-items: center; gap: 10px;">
            <span>🎲</span> Control del Juego
          </h2>
          
          <!-- Botones principales -->
          <div style="margin-bottom: 25px;">
            <button (click)="startGame()" 
                    [disabled]="gameStarted"
                    style="background: #4caf50; color: white; border: none; padding: 18px 30px; font-size: 18px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);"
                    [style.background]="gameStarted ? '#cccccc' : '#4caf50'"
                    [style.cursor]="gameStarted ? 'not-allowed' : 'pointer'">
              <span>{{ gameStarted ? '🎮' : '🚀' }}</span>
              {{ gameStarted ? 'JUEGO EN CURSO' : 'INICIAR JUEGO' }}
            </button>
            
            <button (click)="callNumber()" 
                    [disabled]="!gameStarted || gamePaused"
                    style="background: #ff5722; color: white; border: none; padding: 22px 30px; font-size: 24px; border-radius: 10px; cursor: pointer; width: 100%; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 15px; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);"
                    [style.background]="(!gameStarted || gamePaused) ? '#cccccc' : '#ff5722'"
                    [style.cursor]="(!gameStarted || gamePaused) ? 'not-allowed' : 'pointer'">
              <span>🎲</span>
              CANTAR NÚMERO
            </button>
          </div>
          
          <!-- Último número -->
          <div style="background: white; padding: 25px; border-radius: 10px; border: 2px solid #e0e0e0; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h3 style="color: #ff5722; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>🔢</span> ÚLTIMO NÚMERO CANTADO
            </h3>
            <div *ngIf="lastBingoNumber" style="text-align: center;">
              <div style="font-size: 80px; font-weight: bold; color: #d32f2f; line-height: 1; margin-bottom: 10px;">
                {{ lastBingoNumber.full }}
              </div>
              <div style="font-size: 24px; color: #666; margin-bottom: 15px;">
                {{ lastBingoNumber.letter }}-{{ lastBingoNumber.number }}
              </div>
              <div style="font-size: 14px; color: #999;">
                Total números cantados: {{ calledNumbers.length }}
              </div>
            </div>
            <div *ngIf="!lastBingoNumber" style="text-align: center; color: #999; padding: 30px; font-style: italic; font-size: 16px;">
              ⏳ Aún no se ha cantado ningún número
            </div>
          </div>
          
          <!-- Controles del Host -->
          <div style="background: white; padding: 25px; border-radius: 10px; border: 2px solid #e0e0e0; margin-bottom: 25px;">
            <h3 style="color: #9c27b0; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>⚙️</span> CONTROLES DEL HOST
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <button (click)="toggleGamePause()" 
                      [style.background]="gamePaused ? '#4caf50' : '#ff9800'"
                      style="color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>{{ gamePaused ? '▶️' : '⏸️' }}</span>
                {{ gamePaused ? 'REANUDAR' : 'PAUSAR' }}
              </button>
              
              <button (click)="resetGame()" 
                      style="background: #f44336; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>🔄</span>
                REINICIAR
              </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <button (click)="clearNumbers()" 
                      [disabled]="calledNumbers.length === 0"
                      style="background: #795548; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;"
                      [style.background]="calledNumbers.length === 0 ? '#cccccc' : '#795548'">
                <span>🧹</span>
                LIMPIAR
              </button>
              
              <button (click)="endGame()" 
                      style="background: #d32f2f; color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>🏁</span>
                FINALIZAR
              </button>
            </div>
            
            <!-- Modo Apagón -->
            <div *ngIf="gameCompleted" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <button (click)="activateBlackoutMode()" 
                      [disabled]="blackoutMode"
                      style="background: #673ab7; color: white; border: none; padding: 18px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 18px; display: flex; align-items: center; justify-content: center; gap: 10px;"
                      [style.background]="blackoutMode ? '#cccccc' : '#673ab7'">
                <span>🎯</span>
                {{ blackoutMode ? 'MODO APAGÓN ACTIVO' : 'ACTIVAR MODO APAGÓN' }}
              </button>
              <p style="font-size: 13px; color: #666; margin-top: 8px; text-align: center;">
                Continúa jugando hasta que alguien complete todo el tablero
              </p>
            </div>
          </div>
          
          <!-- Estadísticas -->
          <div style="background: white; padding: 25px; border-radius: 10px; border: 2px solid #e0e0e0;">
            <h3 style="color: #2196f3; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>📊</span> ESTADÍSTICAS
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 20px; background: #e3f2fd; border-radius: 8px; border: 2px solid #bbdefb;">
                <div style="font-size: 14px; color: #1976d2; font-weight: bold; margin-bottom: 8px;">JUGADORES</div>
                <div style="font-size: 36px; font-weight: bold; color: #0d47a1;">{{ players.length }}</div>
              </div>
              <div style="text-align: center; padding: 20px; background: #f1f8e9; border-radius: 8px; border: 2px solid #c8e6c9;">
                <div style="font-size: 14px; color: #388e3c; font-weight: bold; margin-bottom: 8px;">NÚMEROS</div>
                <div style="font-size: 36px; font-weight: bold; color: #1b5e20;">{{ calledNumbers.length }}</div>
              </div>
            </div>
            <div style="padding-top: 15px; border-top: 1px solid #eee;">
              <div style="font-size: 14px; color: #555;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>• Números disponibles:</span>
                  <span style="font-weight: bold; color: #2196f3;">{{ 75 - calledNumbers.length }}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>• Porcentaje completado:</span>
                  <span style="font-weight: bold; color: #4caf50;">{{ (calledNumbers.length / 75 * 100).toFixed(1) }}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span>• Líneas completadas:</span>
                  <span style="font-weight: bold; color: #ff9800;">{{ linesCompleted }}</span>
                </div>
                <div *ngIf="blackoutMode" style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #673ab7;">
                  <span>• 🎯 Modo Apagón:</span>
                  <span style="font-weight: bold;">ACTIVADO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Columna Derecha: Números Cantados -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
          <h2 style="color: #9c27b0; margin-bottom: 25px; font-size: 22px; display: flex; align-items: center; gap: 10px;">
            <span>📋</span> Números Cantados
          </h2>
          
          <!-- Controles de números -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <button (click)="clearNumbers()" 
                    style="background: #f44336; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;"
                    [disabled]="calledNumbers.length === 0"
                    [style.background]="calledNumbers.length === 0 ? '#cccccc' : '#f44336'">
              <span>🧹</span> Limpiar Todo
            </button>
            
            <button (click)="getCalledNumbers()" 
                    style="background: #673ab7; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
              <span>🔄</span> Actualizar
            </button>
          </div>
          
          <!-- Lista de números -->
          <div style="background: white; padding: 20px; border-radius: 10px; max-height: 500px; overflow-y: auto; border: 2px solid #e0e0e0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
            <div *ngIf="calledNumbers.length === 0" style="text-align: center; color: #999; padding: 50px; font-style: italic; font-size: 16px;">
              📭 No se han cantado números todavía
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
              <div *ngFor="let num of calledNumbers" 
                   style="padding: 20px; text-align: center; background: #4caf50; color: white; border-radius: 8px; font-weight: bold; font-size: 20px; box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3); position: relative;">
                {{ num }}
                <div style="position: absolute; top: 4px; right: 4px; font-size: 10px; background: rgba(255,255,255,0.3); padding: 1px 4px; border-radius: 3px;">
                  {{ getBingoLetterForNumber(num) }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Progreso BINGO -->
          <div style="margin-top: 25px; background: #fff3e0; padding: 25px; border-radius: 10px; border-left: 5px solid #ff9800; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);">
            <h4 style="color: #ef6c00; margin-top: 0; margin-bottom: 20px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
              <span>🎯</span> PROGRESO BINGO
            </h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span style="font-weight: bold; color: #d32f2f; font-size: 22px; text-align: center; flex: 1;">B</span>
              <span style="font-weight: bold; color: #1976d2; font-size: 22px; text-align: center; flex: 1;">I</span>
              <span style="font-weight: bold; color: #388e3c; font-size: 22px; text-align: center; flex: 1;">N</span>
              <span style="font-weight: bold; color: #f57c00; font-size: 22px; text-align: center; flex: 1;">G</span>
              <span style="font-weight: bold; color: #7b1fa2; font-size: 22px; text-align: center; flex: 1;">O</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-bottom: 15px;">
              <span style="text-align: center; flex: 1;">{{ getLetterCount('B') }}/15</span>
              <span style="text-align: center; flex: 1;">{{ getLetterCount('I') }}/15</span>
              <span style="text-align: center; flex: 1;">{{ getLetterCount('N') }}/15</span>
              <span style="text-align: center; flex: 1;">{{ getLetterCount('G') }}/15</span>
              <span style="text-align: center; flex: 1;">{{ getLetterCount('O') }}/15</span>
            </div>
            <!-- Barras de progreso -->
            <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 15px;">
              <div *ngFor="let letter of ['B', 'I', 'N', 'G', 'O']; let i = index" 
                   style="flex: 1; text-align: center;">
                <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 5px;">
                  <div [style.width]="(getLetterCount(letter) / 15 * 100) + '%'" 
                       [style.background]="i === 0 ? '#d32f2f' : i === 1 ? '#1976d2' : i === 2 ? '#388e3c' : i === 3 ? '#f57c00' : '#7b1fa2'"
                       style="height: 100%; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Jugadores Conectados -->
      <div style="margin-top: 30px; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
        <h2 style="color: #009688; margin-bottom: 25px; font-size: 22px; display: flex; align-items: center; gap: 10px;">
          <span>👥</span> Jugadores Conectados ({{ players.length }})
        </h2>
        
        <div *ngIf="players.length === 0" style="text-align: center; color: #999; padding: 40px; font-style: italic; font-size: 16px;">
          🙁 No hay jugadores conectados
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
          <div *ngFor="let player of players" 
               style="padding: 20px; border: 2px solid #e0e0e0; border-radius: 10px; background: #fafafa; transition: all 0.3s;"
               [style.border-color]="player.playerId === myId ? '#4caf50' : player.host ? '#ff9800' : '#e0e0e0'"
               [style.background]="player.playerId === myId ? '#f1f8e9' : '#fafafa'">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
              <div>
                <div style="font-weight: bold; font-size: 18px; color: #333;">
                  {{ player.nickname }}
                  <span *ngIf="player.playerId === myId" style="color: #4caf50; font-size: 14px;"> (Tú)</span>
                </div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">
                  ID: {{ player.playerId.substring(0, 10) }}...
                </div>
              </div>
              
              <div style="display: flex; gap: 5px;">
                <span *ngIf="player.host" 
                      style="background: #ff9800; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                  <span>⭐</span> HOST
                </span>
                <span *ngIf="!player.socketId" 
                      style="background: #ffcdd2; color: #d32f2f; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                  <span>⚠️</span> Desconectado
                </span>
                <span *ngIf="player.socketId" 
                      style="background: #c8e6c9; color: #388e3c; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                  <span>●</span> En línea
                </span>
              </div>
            </div>
            
            <!-- Estadísticas del jugador -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 13px; color: #666;">
              <div *ngIf="playerStats[player.playerId]" style="display: flex; justify-content: space-between;">
                <div>
                  <span *ngIf="playerStats[player.playerId].hasLine" style="color: #4caf50; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                    <span>✅</span> Línea completada
                  </span>
                  <span *ngIf="!playerStats[player.playerId].hasLine" style="color: #607d8b; display: flex; align-items: center; gap: 5px;">
                    <span>📝</span> Jugando...
                  </span>
                </div>
                <div *ngIf="playerStats[player.playerId].lines > 0" style="color: #ff9800; font-weight: bold;">
                  {{ playerStats[player.playerId].lines }} línea(s)
                </div>
              </div>
              <div *ngIf="!playerStats[player.playerId]" style="color: #999; font-style: italic;">
                Esperando acción...
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mensajes del Sistema -->
      <div *ngIf="systemMessage" 
           style="margin-top: 25px; padding: 20px; background: #e8f5e8; border: 3px solid #4caf50; border-radius: 10px; color: #2e7d32; text-align: center; font-size: 16px; font-weight: bold;">
        {{ systemMessage }}
      </div>
      
      <!-- Notificación de apagón -->
      <div *ngIf="blackoutMessage" 
           style="margin-top: 25px; padding: 25px; background: linear-gradient(135deg, #673ab7, #9575cd); border: 3px solid #512da8; border-radius: 12px; text-align: center; color: white; box-shadow: 0 6px 20px rgba(103, 58, 183, 0.4);">
        <h3 style="margin: 0 0 15px 0; font-size: 28px;">🎯 ¡MODO APAGÓN ACTIVADO! 🎯</h3>
        <p style="font-size: 18px; margin: 0; opacity: 0.9;">{{ blackoutMessage }}</p>
        <p style="font-size: 14px; margin: 15px 0 0 0; opacity: 0.8;">
          El juego continúa hasta que alguien complete TODO el tablero.
        </p>
      </div>
    </div>
  `
})
export class HostPanelComponent implements OnInit {
  roomCode = '';
  players: any[] = [];
  myId = '';
  gameStarted = false;
  gamePaused = false;
  gameCompleted = false;
  blackoutMode = false;
  lastBingoNumber: { letter: string, number: number, full: string } | null = null;
  calledNumbers: number[] = [];
  systemMessage = '';
  lineCompletedNotification = '';
  blackoutMessage = '';
  linesCompleted = 0;
  playerStats: { [key: string]: { hasLine: boolean, lines: number } } = {};

  constructor(
    private route: ActivatedRoute,
    private socket: SocketService
  ) {}

  ngOnInit() {
    this.roomCode = this.route.snapshot.paramMap.get('code')!;
    this.myId = this.socket.getPlayerId();
    const session = this.socket.getSession();

    console.log('🎮 Panel de Host inicializado para sala:', this.roomCode);

    // Setup listeners
    this.setupSocketListeners(session);
    
    // Unirse a la sala
    if (session.nickname) {
      this.socket.joinRoom(this.roomCode, session.nickname);
    }

    // Cargar estado del juego
    setTimeout(() => {
      this.socket.getGameState(this.roomCode);
      this.socket.getCalledNumbers(this.roomCode);
    }, 1000);
  }

  setupSocketListeners(session: any) {
    // Lista de jugadores
    this.socket.onPlayerList(players => {
      this.players = players;
    });

    // Estado del juego
    this.socket.onGameState((state: any) => {
      this.gameStarted = state.gameStarted || false;
      this.gamePaused = state.gamePaused || false;
      this.blackoutMode = state.blackoutMode || false;
      this.calledNumbers = state.calledNumbers || [];
      this.linesCompleted = state.completedLines || 0;
      this.lastBingoNumber = state.lastNumber || null;
      this.gameCompleted = this.linesCompleted > 0;
    });

    // Números cantados
    this.socket.onBingoNumberCalled((bingoNumber: { letter: string, number: number, full: string }) => {
      this.lastBingoNumber = bingoNumber;
      if (!this.calledNumbers.includes(bingoNumber.number)) {
        this.calledNumbers.push(bingoNumber.number);
      }
    });

    this.socket.onCalledNumbers((numbers: number[]) => {
      this.calledNumbers = numbers;
    });

    // Juego iniciado
    this.socket.onGameStarted(() => {
      this.gameStarted = true;
      this.systemMessage = '🎮 ¡El juego ha comenzado!';
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Juego pausado
    this.socket.onGamePaused((data: { paused: boolean, message: string }) => {
      this.gamePaused = data.paused;
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 3000);
    });

    // Modo apagón activado
    this.socket.onBlackoutActivated((data: { message: string }) => {
      this.blackoutMode = true;
      this.blackoutMessage = data.message;
      this.gameCompleted = true;
      setTimeout(() => this.blackoutMessage = '', 8000);
    });

    // Línea completada
    this.socket.onLineCompleted((data: { winner: string, message: string, patterns: string[], totalLines: number, isFirstLine: boolean }) => {
      this.linesCompleted = data.totalLines;
      this.lineCompletedNotification = data.message;
      this.gameCompleted = true;
      
      // Actualizar stats del jugador
      const winner = this.players.find(p => p.nickname === data.winner);
      if (winner) {
        if (!this.playerStats[winner.playerId]) {
          this.playerStats[winner.playerId] = { hasLine: true, lines: 1 };
        } else {
          this.playerStats[winner.playerId].hasLine = true;
          this.playerStats[winner.playerId].lines++;
        }
      }
    });

    // Apagón completado
    this.socket.onBlackoutCompleted((data: { winner: string, message: string, totalNumbers: number, numbersCalled: number[], totalLines: number }) => {
      this.linesCompleted = data.totalLines;
      this.lineCompletedNotification = data.message + ' 🎊';
      this.gameStarted = false;
      this.blackoutMode = false;
      
      // Actualizar stats del jugador
      const winner = this.players.find(p => p.nickname === data.winner);
      if (winner) {
        this.playerStats[winner.playerId] = { hasLine: true, lines: this.playerStats[winner.playerId]?.lines || 0 };
      }
    });

    // Partida finalizada
    this.socket.onGameEnded((data: { message: string, winner: string, totalLines: number, totalNumbers: number, winners: any[] }) => {
      this.systemMessage = `${data.message} Ganador: ${data.winner}`;
      this.gameStarted = false;
      this.lineCompletedNotification = '';
      setTimeout(() => this.systemMessage = '', 8000);
    });

    // Juego reiniciado
    this.socket.onGameReset((data: { message: string, calledNumbers: number[] }) => {
      this.calledNumbers = data.calledNumbers;
      this.gameStarted = false;
      this.gamePaused = false;
      this.blackoutMode = false;
      this.gameCompleted = false;
      this.lastBingoNumber = null;
      this.linesCompleted = 0;
      this.playerStats = {};
      this.lineCompletedNotification = '';
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Números limpiados
    this.socket.onNumbersCleared((data: { message: string, calledNumbers: number[] }) => {
      this.calledNumbers = data.calledNumbers;
      this.lastBingoNumber = null;
      this.systemMessage = data.message;
      setTimeout(() => this.systemMessage = '', 5000);
    });

    // Estado de sala (debug)
    this.socket.onRoomState((state: any) => {
      console.log('🔍 Estado de sala:', state);
    });

    // Errores
    this.socket.onError((error) => {
      this.systemMessage = `❌ Error: ${error.message}`;
      setTimeout(() => this.systemMessage = '', 5000);
    });
  }

  // Métodos del host
  startGame() {
    if (!this.gameStarted) {
      this.socket.startGame(this.roomCode);
    }
  }

  callNumber() {
    if (this.gameStarted && !this.gamePaused) {
      this.socket.callNumber(this.roomCode);
    }
  }

  toggleGamePause() {
    this.socket.togglePause(this.roomCode);
  }

  activateBlackoutMode() {
    if (!this.blackoutMode) {
      this.socket.activateBlackout(this.roomCode);
    }
  }

  endGame() {
    const winner = this.getCurrentWinner();
    if (confirm(`¿Finalizar la partida ahora?\n\nGanador: ${winner}\nLíneas completadas: ${this.linesCompleted}\nNúmeros cantados: ${this.calledNumbers.length}`)) {
      this.socket.endGame(this.roomCode, winner);
    }
  }

  resetGame() {
    if (confirm('¿Reiniciar el juego completamente?\n\nEsto limpiará todos los números, estadísticas y reiniciará el juego para todos los jugadores.')) {
      this.socket.resetGame(this.roomCode);
    }
  }

  clearNumbers() {
    if (this.calledNumbers.length === 0) return;
    
    if (confirm(`¿Limpiar todos los ${this.calledNumbers.length} números cantados?\n\nEsto no reiniciará el juego, solo eliminará los números cantados.`)) {
      this.socket.clearNumbers(this.roomCode);
    }
  }

  getCalledNumbers() {
    this.socket.getCalledNumbers(this.roomCode);
  }

  acknowledgeLine() {
    this.lineCompletedNotification = '';
    if (this.blackoutMode) {
      this.systemMessage = '🎯 ¡Sigue jugando en modo APAGÓN!';
      setTimeout(() => this.systemMessage = '', 5000);
    }
  }

  getCurrentWinner(): string {
    for (const playerId in this.playerStats) {
      if (this.playerStats[playerId].hasLine) {
        const player = this.players.find(p => p.playerId === playerId);
        return player ? player.nickname : 'Un jugador';
      }
    }
    return 'Ninguno aún';
  }

  getLetterCount(letter: string): number {
    const ranges: { [key: string]: { min: number, max: number } } = {
      'B': { min: 1, max: 15 },
      'I': { min: 16, max: 30 },
      'N': { min: 31, max: 45 },
      'G': { min: 46, max: 60 },
      'O': { min: 61, max: 75 }
    };
    
    const range = ranges[letter];
    return this.calledNumbers.filter(n => n >= range.min && n <= range.max).length;
  }

  getBingoLetterForNumber(num: number): string {
    if (num >= 1 && num <= 15) return 'B';
    if (num >= 16 && num <= 30) return 'I';
    if (num >= 31 && num <= 45) return 'N';
    if (num >= 46 && num <= 60) return 'G';
    if (num >= 61 && num <= 75) return 'O';
    return '';
  }

  goToGame() {
    window.location.href = `/game/${this.roomCode}`;
  }

  verifyRoomState() {
    this.socket.verifyRoomState(this.roomCode);
  }
}
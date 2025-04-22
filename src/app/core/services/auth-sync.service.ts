import { Injectable } from '@angular/core';
import { TokenManagerService } from './token-manager.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSyncService {
  private readonly AUTH_SYNC_CHANNEL = 'auth_token_sync';
  private readonly TOKEN_KEY = 'auth_token';
  private broadcastChannel: BroadcastChannel | null = null;

  constructor(
    private tokenManager: TokenManagerService,
    private authService: AuthService
  ) {
    this.initSync();
  }

  /**
   * Initialize cross-tab synchronization
   */
  private initSync() {
    try {
      // Check if user has explicitly logged out
      const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
      if (hasLoggedOut) {
        console.log('Auth Sync: User has explicitly logged out, not initializing token sync');
        return; // Skip initialization if user has logged out
      }
      
      // Check if BroadcastChannel is supported
      if ('BroadcastChannel' in window) {
        console.log('Auth Sync: BroadcastChannel is supported');
        this.broadcastChannel = new BroadcastChannel(this.AUTH_SYNC_CHANNEL);
        
        // Listen for auth events from other tabs
        this.broadcastChannel.onmessage = (event: MessageEvent) => {
          this.handleSyncMessage(event.data);
        };
        
        // Also listen for storage events as a fallback
        window.addEventListener('storage', (event: StorageEvent) => {
          if (event.key === this.TOKEN_KEY) {
            this.handleStorageChange(event);
          }
        });
        
        console.log('Auth Sync: Event listeners registered');
      } else {
        // Fallback for browsers that don't support BroadcastChannel
        console.log('Auth Sync: BroadcastChannel not supported, using localStorage fallback');
        (window as Window).addEventListener('storage', (event: StorageEvent) => {
          if (event.key === this.TOKEN_KEY) {
            this.handleStorageChange(event);
          }
        });
      }
      
      // Send initial sync message
      this.syncCurrentToken();
    } catch (e) {
      console.error('Auth Sync: Error initializing sync', e);
    }
  }

  /**
   * Handle sync messages from other tabs
   */
  private handleSyncMessage(data: any) {
    console.log('Auth Sync: Received sync message', data);
    
    if (data.type === 'token_update') {
      if (data.token) {
        console.log('Auth Sync: Updating token from another tab');
        this.tokenManager.setToken(data.token);
        this.authService.setManualToken(data.token);
      } else {
        console.log('Auth Sync: Clearing token from another tab');
        this.tokenManager.clearToken();
        this.authService.logout();
      }
    }
  }

  /**
   * Handle localStorage changes (fallback sync method)
   */
  private handleStorageChange(event: StorageEvent) {
    console.log('Auth Sync: Storage change detected', event);
    
    // Token was added or changed
    if (event.newValue) {
      console.log('Auth Sync: Token updated in another tab');
      this.tokenManager.setToken(event.newValue);
      this.authService.setManualToken(event.newValue);
    } 
    // Token was removed
    else if (event.oldValue && !event.newValue) {
      console.log('Auth Sync: Token removed in another tab');
      this.tokenManager.clearToken();
      this.authService.logout();
    }
  }

  /**
   * Sync current token to other tabs
   */
  syncCurrentToken() {
    try {
      // Check if user has explicitly logged out
      const hasLoggedOut = localStorage.getItem('user_logged_out') === 'true';
      if (hasLoggedOut) {
        console.log('Auth Sync: User has explicitly logged out, not syncing token');
        return; // Skip sync if user has logged out
      }
      
      const token = this.authService.getToken();
      
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'token_update',
          token: token,
          timestamp: new Date().toISOString()
        });
        console.log('Auth Sync: Broadcast current token state to other tabs');
      }
    } catch (e) {
      console.error('Auth Sync: Error syncing token', e);
    }
  }

  /**
   * Notify other tabs about logout
   */
  notifyLogout() {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'token_update',
          token: null,
          timestamp: new Date().toISOString()
        });
        console.log('Auth Sync: Broadcast logout to other tabs');
      }
    } catch (e) {
      console.error('Auth Sync: Error notifying logout', e);
    }
  }
} 
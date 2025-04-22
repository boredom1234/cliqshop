import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <header class="header">
        <div class="container header__content">
          <a routerLink="/" class="header__logo">CLIQSHOP</a>
          <nav class="header__nav">
            <a routerLink="/products">Shop</a>
            <a routerLink="/cart">Cart</a>
            <a routerLink="/auth/login">Login</a>
          </nav>
        </div>
      </header>

      <main class="main">
        <ng-content></ng-content>
      </main>

      <footer class="footer">
        <div class="container">
          <p>&copy; 2025 CLIQSHOP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .layout {
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }

    .header {
      border-bottom: 1px solid $color-gray-200;
      position: sticky;
      top: 0;
      background: $color-white;
      z-index: $z-index-header;

      &__content {
        @include flex-center;
        justify-content: space-between;
        padding: $spacing-md 0;
      }

      &__logo {
        font-size: $font-size-xl;
        text-decoration: none;
        color: $color-black;
        letter-spacing: 0.1em;
      }

      &__nav {
        display: flex;
        gap: $spacing-lg;

        a {
          text-decoration: none;
          color: $color-black;
          text-transform: uppercase;
          font-size: $font-size-sm;
          letter-spacing: 0.05em;
          position: relative;

          &:after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 1px;
            background: $color-black;
            transform: scaleX(0);
            transition: transform 0.3s ease;
          }

          &:hover:after {
            transform: scaleX(1);
          }
        }
      }
    }

    .main {
      padding: $spacing-xl 0;
    }

    .footer {
      border-top: 1px solid $color-gray-200;
      padding: $spacing-lg 0;
      text-align: center;
      color: $color-gray-600;
    }
  `]
})
export class LayoutComponent {} 
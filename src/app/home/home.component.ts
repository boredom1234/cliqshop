import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="magazine-layout">
      <!-- Magazine Cover Section -->
      <section class="cover">
        <div class="cover__overlay"></div>
        <div class="cover__content">
          <div class="cover__logo">CLIQ<span>SHOP</span></div>
          <div class="cover__tagline">Spring | Summer 2025</div>
          <h1 class="cover__title">MINIMAL. <br/><span>MODERN.</span> <em>YOU.</em></h1>
          <div class="cover__issue-container">
            <div class="cover__issue">Volume 01</div>
            <div class="cover__line"></div>
            <div class="cover__date">EDITION</div>
          </div>
        </div>
      </section>

      <!-- Editorial Preview -->
      <section class="editorial">
        <div class="container">
          <div class="editorial__header">
            <span class="editorial__number">01</span>
            <h2 class="editorial__title">EDITOR'S NOTE</h2>
            <div class="editorial__line"></div>
          </div>
          <div class="editorial__layout">
            <div class="editorial__text">
              <p class="editorial__lead">"Discover our curated collection of contemporary essentials that blend timeless elegance with modern sensibility."</p>
              <p class="editorial__body">Each piece in our collection is meticulously crafted to balance form and function, creating a wardrobe that transcends seasons and trends.</p>
              <div class="editorial__signature">
                <span class="editorial__sign">ME (●'◡'●)</span>
                <span class="editorial__position">Creative Director</span>
              </div>
              <div class="editorial__cta">
                <a routerLink="/products" class="btn btn--minimal">Explore Collection</a>
              </div>
            </div>
            <div class="editorial__image">
              <div class="editorial__image-frame">
                <img src="https://images.unsplash.com/photo-1646178071012-7bf3efe0ddfa?q=80&w=1969&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Editorial Image">
              </div>
              <div class="editorial__caption">The art of refined simplicity</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Categories Spread -->
      <section class="categories-spread">
        <div class="container-fluid">
          <div class="categories-spread__header">
            <span class="categories-spread__number">02</span>
            <h2 class="categories-spread__title">COLLECTIONS</h2>
            <div class="categories-spread__line"></div>
          </div>
          
          <div class="editorial-layout">
            <a routerLink="/products" [queryParams]="{category: 'Women', gender: 'Women'}" class="editorial-item editorial-item--main">
              <div class="editorial-item__content">
                <span class="editorial-item__tag">Curated Selection</span>
                <h3 class="editorial-item__title">Women</h3>
                <p class="editorial-item__description">The Essence Collection</p>
                <span class="editorial-item__action">Explore</span>
              </div>
              <div class="editorial-item__image">
                <img src="https://img.freepik.com/premium-photo/cool-trendy-beautiful-glamorous-girl-autumn-vogue-style-with-long-coat-sweater-with-sunglasses-walking-street-sunlight_338491-11795.jpg?w=740" alt="Women's Collection">
                <div class="editorial-item__overlay"></div>
                <div class="editorial-item__caption">Effortless elegance in motion</div>
              </div>
            </a>
            
            <div class="editorial-column">
              <a routerLink="/products" [queryParams]="{category: 'Men', gender: 'Men'}" class="editorial-item editorial-item--secondary">
                <div class="editorial-item__content">
                  <h3 class="editorial-item__title">Men</h3>
                  <p class="editorial-item__description">The Modern Edit</p>
                  <span class="editorial-item__action">View Collection</span>
                </div>
                <div class="editorial-item__image">
                  <img src="https://img.freepik.com/premium-photo/hipster-fashion-man-stylish-clothes-with-sunglasses_338491-8012.jpg?w=740" alt="Men's Collection">
                  <div class="editorial-item__overlay"></div>
                  <div class="editorial-item__caption">Contemporary confidence defined</div>
                </div>
              </a>
              
              <a routerLink="/products" [queryParams]="{category: 'Accessories'}" class="editorial-item editorial-item--secondary">
                <div class="editorial-item__content">
                  <h3 class="editorial-item__title">Accessories</h3>
                  <p class="editorial-item__description">The Finishing Touch</p>
                  <span class="editorial-item__action">Discover More</span>
                </div>
                <div class="editorial-item__image">
                  <img src="https://images.unsplash.com/photo-1658500140897-7f2a772391e3?q=80&w=800&auto=format&fit=crop" alt="Accessories">
                  <div class="editorial-item__overlay"></div>
                  <div class="editorial-item__caption">Details that elevate every look</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Lookbook Teaser -->
      <section class="lookbook">
        <div class="container">
          <div class="lookbook__content">
            <div class="lookbook__header">
              <span class="lookbook__number">03</span>
              <h2 class="lookbook__title">LOOKBOOK</h2>
              <div class="lookbook__line"></div>
            </div>
            <div class="lookbook__quote">" Style is a way to say who you are without having to speak "</div>
            <p class="lookbook__text">Experience our newest collection through a visual narrative that captures the essence of contemporary luxury.</p>
            <a routerLink="/products" class="btn btn--outline">View Lookbook</a>
          </div>
        </div>
      </section>

      <!-- Trend Highlight -->
      <section class="trend">
        <div class="container">
          <div class="trend__header">
            <span class="trend__number">04</span>
            <h2 class="trend__title">SEASONAL HIGHLIGHTS</h2>
            <div class="trend__line"></div>
          </div>
          <div class="trend__grid">
            <div class="trend__item">
              <div class="trend__image">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop" alt="Trend 1">
                <div class="trend__caption">Flowing forms for the modern silhouette</div>
              </div>
              <div class="trend__meta">
                <h3 class="trend__name">Ethereal Elegance</h3>
                <p class="trend__description">Lightweight materials and flowing silhouettes define the season</p>
              </div>
            </div>
            <div class="trend__item">
              <div class="trend__image">
                <img src="https://images.unsplash.com/photo-1542295669297-4d352b042bca?q=80&w=1000&auto=format&fit=crop" alt="Trend 2">
                <div class="trend__caption">Minimalism with a statement</div>
              </div>
              <div class="trend__meta">
                <h3 class="trend__name">Bold Minimalism</h3>
                <p class="trend__description">Clean lines and monochromatic palettes with unexpected details</p>
              </div>
            </div>
            <div class="trend__item">
              <div class="trend__image">
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop" alt="Trend 3">
                <div class="trend__caption">Tactile luxury for everyday</div>
              </div>
              <div class="trend__meta">
                <h3 class="trend__name">Timeless Textures</h3>
                <p class="trend__description">Rich fabrics that evolve throughout the day and evening</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @use '../../styles/variables' as vars;
    
    /* General Layout */
    .magazine-layout {
      width: 100%;
      overflow-x: hidden;
      color: vars.$color-black;
      letter-spacing: 0.02em;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 vars.$spacing-md;
    }

    .container-fluid {
      width: 100%;
      padding: 0 vars.$spacing-md;
    }

    /* Magazine Cover Section */
    .cover {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background-image: url('https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
      color: vars.$color-white;

      &__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1;
      }

      &__content {
        position: relative;
        z-index: 2;
        text-align: center;
        padding: 0 vars.$spacing-xl;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      &__logo {
        font-size: 1.25rem;
        letter-spacing: 0.3em;
        font-weight: 300;
        margin-bottom: vars.$spacing-xl;
        text-transform: uppercase;
        
        span {
          font-weight: 600;
        }
      }

      &__tagline {
        font-size: vars.$font-size-sm;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        margin-bottom: vars.$spacing-md;
        font-weight: 300;
        position: relative;
        
        &::before, &::after {
          content: '';
          height: 1px;
          width: 40px;
          background-color: rgba(255, 255, 255, 0.4);
          position: absolute;
          top: 50%;
        }
        
        &::before {
          right: calc(100% + 20px);
        }
        
        &::after {
          left: calc(100% + 20px);
        }
      }

      &__title {
        font-size: clamp(3rem, 8vw, 7rem);
        line-height: 1.1;
        font-weight: 200;
        margin-bottom: vars.$spacing-xl;
        letter-spacing: 0.05em;
        
        span {
          font-weight: 500;
        }
        
        em {
          font-style: italic;
          font-weight: 300;
        }
      }

      &__issue-container {
        display: flex;
        align-items: center;
        gap: vars.$spacing-md;
      }

      &__issue {
        font-size: vars.$font-size-lg;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 300;
      }
      
      &__line {
        width: 40px;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.5);
      }
      
      &__date {
        font-size: vars.$font-size-lg;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 300;
      }
    }

    /* Editorial Section Styles */
    .editorial {
      padding: vars.$spacing-xl 0;
      background-color: vars.$color-white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      &__header {
        display: flex;
        align-items: center;
        margin-bottom: vars.$spacing-xl;
      }

      &__number {
        font-size: vars.$font-size-lg;
        font-weight: 200;
        color: #999;
        margin-right: vars.$spacing-md;
      }

      &__title {
        font-size: vars.$font-size-xl;
        font-weight: 300;
        margin: 0;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      &__line {
        flex-grow: 1;
        height: 1px;
        background-color: #ddd;
        margin-left: vars.$spacing-md;
      }

      &__layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: vars.$spacing-xl;
        
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      &__text {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      &__lead {
        font-size: clamp(vars.$font-size-lg, 2vw, 1.85rem);
        line-height: 1.5;
        font-weight: 300;
        margin-bottom: vars.$spacing-lg;
        font-style: italic;
        color: #333;
      }

      &__body {
        font-size: vars.$font-size-base;
        line-height: 1.7;
        margin-bottom: vars.$spacing-xl;
        color: #555;
      }
      
      &__signature {
        display: flex;
        flex-direction: column;
        margin-bottom: vars.$spacing-xl;
      }
      
      &__sign {
        font-size: 1.25rem;
        font-style: italic;
        margin-bottom: 4px;
      }
      
      &__position {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #999;
      }

      &__image {
        overflow: hidden;
        display: flex;
        flex-direction: column;
        
        &-frame {
          position: relative;
          overflow: hidden;
          padding-top: 10px;
          padding-left: 10px;
          background-color: #fafafa;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      }
      
      &__caption {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #999;
        margin-top: 8px;
        text-align: right;
        font-style: italic;
      }
    }

    /* Categories Spread Styles */
    .categories-spread {
      padding: vars.$spacing-xl 0;
      background-color: #fafafa;

      &__header {
        display: flex;
        align-items: center;
        margin-bottom: vars.$spacing-xl;
        padding: 0 vars.$spacing-md;
      }

      &__number {
        font-size: vars.$font-size-lg;
        font-weight: 200;
        color: #999;
        margin-right: vars.$spacing-md;
      }

      &__title {
        font-size: vars.$font-size-xl;
        font-weight: 300;
        margin: 0;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      &__line {
        flex-grow: 1;
        height: 1px;
        background-color: #ddd;
        margin-left: vars.$spacing-md;
      }
    }

    .editorial-layout {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: vars.$spacing-lg;
      height: auto;
      padding: 0 vars.$spacing-md;
      
      @media (max-width: 992px) {
        grid-template-columns: 1fr;
      }
    }

    .editorial-column {
      display: flex;
      flex-direction: column;
      gap: vars.$spacing-lg;
    }

    .editorial-item {
      position: relative;
      display: flex;
      text-decoration: none;
      background-color: vars.$color-white;
      overflow: hidden;
      box-shadow: 0 1px 5px rgba(0,0,0,0.05);
      
      &--main {
        height: 680px;
        flex-direction: row;
        
        @media (max-width: 992px) {
          height: 500px;
          flex-direction: column;
        }
        
        .editorial-item__content {
          width: 45%;
          padding: vars.$spacing-xl;
          display: flex;
          flex-direction: column;
          justify-content: center;
          
          @media (max-width: 992px) {
            width: 100%;
            padding: vars.$spacing-lg;
          }
        }
        
        .editorial-item__image {
          width: 55%;
          
          @media (max-width: 992px) {
            width: 100%;
            height: 300px;
          }
        }
        
        .editorial-item__title {
          font-size: 3.5rem;
          margin-bottom: vars.$spacing-md;
        }
        
        .editorial-item__description {
          font-size: vars.$font-size-lg;
          margin-bottom: vars.$spacing-xl;
        }
      }
      
      &--secondary {
        height: 325px;
        
        .editorial-item__content {
          width: 50%;
          padding: vars.$spacing-lg;
          
          @media (max-width: 768px) {
            width: 100%;
          }
        }
        
        .editorial-item__image {
          width: 50%;
          
          @media (max-width: 768px) {
            display: none;
          }
        }
      }
      
      &__content {
        position: relative;
        z-index: 2;
        color: vars.$color-black;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      &__tag {
        font-size: vars.$font-size-xs;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: vars.$spacing-md;
        color: vars.$color-gray-600;
      }
      
      &__title {
        font-size: 2rem;
        font-weight: 300;
        margin: 0 0 vars.$spacing-xs;
        letter-spacing: 0.05em;
      }
      
      &__description {
        font-size: vars.$font-size-base;
        color: vars.$color-gray-600;
        margin-bottom: vars.$spacing-lg;
      }
      
      &__action {
        font-size: vars.$font-size-sm;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        position: relative;
        display: inline-block;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: vars.$color-black;
          transition: width 0.3s ease;
        }
      }
      
      &__image {
        position: relative;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s ease;
        }
      }
      
      &__overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.03);
        transition: background-color 0.3s ease;
      }
      
      &__caption {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #fff;
        text-align: right;
        font-style: italic;
        padding: 3px 8px;
        background-color: rgba(0, 0, 0, 0.02);
        z-index: 3;
      }
      
      &:hover {
        .editorial-item__image img {
          transform: scale(1.05);
        }
        
        .editorial-item__action::after {
          width: 30%;
        }
        
        .editorial-item__overlay {
          background-color: rgba(0,0,0,0);
        }
      }
    }

    .categories-grid {
      display: none; /* Hide the old grid */
    }

    .category-feature {
      display: none; /* Hide the old features */
    }

    /* Lookbook Section */
    .lookbook {
      padding: 120px 0;
      background-image: url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      position: relative;
      color: vars.$color-white;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }
      
      &__content {
        position: relative;
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }
      
      &__header {
        display: flex;
        align-items: center;
        margin-bottom: vars.$spacing-xl;
        justify-content: center;
      }

      &__number {
        font-size: vars.$font-size-lg;
        font-weight: 200;
        margin-right: vars.$spacing-md;
      }

      &__title {
        font-size: vars.$font-size-xl;
        font-weight: 300;
        margin: 0;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      &__line {
        width: 60px;
        height: 1px;
        background-color: rgba(255, 255, 255, 0.5);
        margin-left: vars.$spacing-md;
      }
      
      &__quote {
        font-size: 1.75rem;
        line-height: 1.4;
        font-weight: 300;
        margin-bottom: vars.$spacing-xl;
        font-style: italic;
      }
      
      &__text {
        font-size: vars.$font-size-lg;
        line-height: 1.6;
        margin-bottom: vars.$spacing-xl;
        font-weight: 300;
      }
    }
    
    /* Trend Section */
    .trend {
      padding: 100px 0;
      background-color: vars.$color-white;
      
      &__header {
        display: flex;
        align-items: center;
        margin-bottom: vars.$spacing-xl;
      }

      &__number {
        font-size: vars.$font-size-lg;
        font-weight: 200;
        color: #999;
        margin-right: vars.$spacing-md;
      }

      &__title {
        font-size: vars.$font-size-xl;
        font-weight: 300;
        margin: 0;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      &__line {
        flex-grow: 1;
        height: 1px;
        background-color: #ddd;
        margin-left: vars.$spacing-md;
      }
      
      &__grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: vars.$spacing-xl;
        
        @media (max-width: 992px) {
          grid-template-columns: repeat(2, 1fr);
        }
        
        @media (max-width: 576px) {
          grid-template-columns: 1fr;
        }
      }
      
      &__item {
        display: flex;
        flex-direction: column;
      }
      
      &__image {
        aspect-ratio: 3/4;
        overflow: hidden;
        margin-bottom: vars.$spacing-md;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
          
          &:hover {
            transform: scale(1.03);
          }
        }
      }
      
      &__meta {
        padding: 0 vars.$spacing-sm;
      }
      
      &__name {
        font-size: 1.25rem;
        font-weight: 400;
        margin: 0 0 vars.$spacing-xs;
        letter-spacing: 0.05em;
      }
      
      &__description {
        font-size: vars.$font-size-sm;
        color: vars.$color-gray-600;
        line-height: 1.6;
      }

      &__caption {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #999;
        margin-top: 8px;
        text-align: right;
        font-style: italic;
      }
    }

    /* Button Styles */
    .btn {
      display: inline-block;
      padding: vars.$spacing-sm vars.$spacing-xl;
      font-size: vars.$font-size-sm;
      font-weight: 300;
      text-decoration: none;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      transition: all 0.3s ease;
      
      &--minimal {
        background: transparent;
        color: vars.$color-black;
        border-bottom: 1px solid vars.$color-black;
        padding: vars.$spacing-xs 0;
        
        &:hover {
          letter-spacing: 0.25em;
        }
      }
      
      &--outline {
        background: transparent;
        color: vars.$color-white;
        border: 1px solid vars.$color-white;
        padding: vars.$spacing-sm vars.$spacing-xl;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  `]
})
export class HomeComponent {} 
import { Component } from '@angular/core';
import { HiteshComponent } from './component/hitesh/hitesh.component';
import { PiyushComponent } from './component/piyush/piyush.component';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ChatService } from './component/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HiteshComponent, PiyushComponent],
  providers: [ChatService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = '02-persona';

  currentComponent: 'hitesh' | 'piyush' = 'hitesh';

  showComponent(comp: 'hitesh' | 'piyush') {
    this.currentComponent = comp;
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { MainLayoutComponent } from "./features/layouts/main-layout/main-layout.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'pharmacie-delivery-v1';
}
 
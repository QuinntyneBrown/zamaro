import { Component } from '@angular/core';
import { Shell } from './shell/shell';

@Component({
  imports: [Shell],
  selector: 'zm-root',
  templateUrl: './app.html',
})
export class App {}

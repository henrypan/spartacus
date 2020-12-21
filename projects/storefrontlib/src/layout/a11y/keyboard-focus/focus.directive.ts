import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { FocusConfig } from './keyboard-focus.model';
import { LockFocusDirective } from './lock/lock-focus.directive';
import { KeyboardFocusService } from './services/keyboard-focus.service';

@Directive({
  selector: '[cxFocus]',
})
export class FocusDirective extends LockFocusDirective {
  protected defaultConfig: FocusConfig = {};
  // tslint:disable-next-line: no-input-rename
  @Input('cxFocus') protected config: FocusConfig = {};

  @Input() set cxRefreshFocusOn(_switchCondition: string) {
    if (this.shouldAutofocus) {
      super.handleFocus();
    }
  }

  constructor(
    protected elementRef: ElementRef,
    protected service: KeyboardFocusService,
    protected renderer: Renderer2
  ) {
    super(elementRef, service, renderer);
  }
}

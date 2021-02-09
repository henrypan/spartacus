import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UrlModule, I18nModule } from '@spartacus/core';
import { VariantSizeSelectorComponent } from './variant-size-selector.component';
import { RouterModule } from '@angular/router';

/**
 * @deprecated since 3.1
 * Use feature-library @spartacus/product/variants instead
 */
@NgModule({
  imports: [CommonModule, RouterModule, UrlModule, I18nModule],
  declarations: [VariantSizeSelectorComponent],
  entryComponents: [VariantSizeSelectorComponent],
  exports: [VariantSizeSelectorComponent],
})
export class VariantSizeSelectorModule {}

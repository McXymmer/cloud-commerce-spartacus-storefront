import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import * as fromUserStore from '../../../../user/store';
import { CheckoutService } from '../../../services/checkout.service';
import { Card } from '../../../../ui/components/card/card.component';

@Component({
  selector: 'y-payment-method',
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentMethodComponent implements OnInit {
  isPaymentForm = false;
  existingPaymentMethods$: Observable<any>;
  cards = [];

  @Input()
  selectedPayment: any;
  @Output()
  backStep = new EventEmitter<any>();
  @Output()
  addPaymentInfo = new EventEmitter<any>();

  constructor(
    protected store: Store<fromUserStore.UserState>,
    protected checkoutService: CheckoutService
  ) {}

  ngOnInit() {
    this.existingPaymentMethods$ = this.store
      .select(fromUserStore.getPaymentMethods)
      .pipe(
        tap(payments => {
          if (payments.length === 0) {
            this.checkoutService.loadUserPaymentMethods();
          } else {
            if (this.cards.length === 0) {
              payments.forEach(payment => {
                const card = this.getCardContent(payment);
                if (
                  this.selectedPayment &&
                  this.selectedPayment.id === payment.id
                ) {
                  card.header = 'SELECTED';
                }
              });
            }
          }
        })
      );
  }

  getCardContent(payment): Card {
    let ccImage;
    if (payment.cardType.code === 'visa') {
      ccImage = 'assets/visa.png';
    } else if (payment.cardType.code === 'master') {
      ccImage = 'assets/masterCard.png';
    }
    const card: Card = {
      title: payment.defaultPayment ? 'Default Payment Method' : '',
      textBold: payment.accountHolderName,
      text: [
        payment.cardNumber,
        'Expires: ' + payment.expiryMonth + '/' + payment.expiryYear
      ],
      img: ccImage,
      actions: [{ name: 'Use this payment', event: 'send' }]
    };

    this.cards.push(card);
    return card;
  }

  paymentMethodSelected(paymentDetails, index) {
    this.selectedPayment = paymentDetails;

    for (let i = 0; this.cards[i]; i++) {
      const card = this.cards[i];
      if (i === index) {
        card.header = 'SELECTED';
      } else {
        card.header = '';
      }
    }
  }

  next() {
    this.addPaymentInfo.emit({
      payment: this.selectedPayment,
      newPayment: false
    });
  }

  addNewPaymentMethod(paymentDetails) {
    this.addPaymentInfo.emit({ payment: paymentDetails, newPayment: true });
  }

  goToPaymentForm() {
    this.isPaymentForm = true;
  }

  backToPaymentMethod() {
    this.isPaymentForm = false;
  }

  back() {
    this.backStep.emit();
  }
}

import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OrderDetails, PersonalData } from '../models/ubs.interface';

@Injectable({
  providedIn: 'root'
})
export class UBSOrderFormService {
  orderDetails: OrderDetails;
  personalData: PersonalData;
  orderUrl: string;
  orderStatusDone = false;
  errorOccurred = false;
  changedOrder: any = new EventEmitter();
  changedPersonalData: any = new EventEmitter();
  private orderID = new BehaviorSubject(null);
  orderId = this.orderID.asObservable();

  transferOrderId(order_id: any) {
    this.orderID.next(order_id);
  }

  changeOrderDetails() {
    this.changedOrder.emit(this.orderDetails);
  }

  changePersonalData() {
    this.changedPersonalData.emit(this.personalData);
  }

  changeOrderStatus(orderStatus: boolean) {
    this.orderStatusDone = orderStatus;
  }

  getOrderStatus(): boolean {
    return this.orderStatusDone;
  }

  setOrderStatus(orderStatus: boolean): void {
    this.orderStatusDone = orderStatus;
  }

  getOrderResponseErrorStatus(): boolean {
    return this.errorOccurred;
  }
  setOrderResponseErrorStatus(errorStatus: boolean): void {
    this.errorOccurred = errorStatus;
    errorStatus && (this.orderStatusDone = false);
  }
}

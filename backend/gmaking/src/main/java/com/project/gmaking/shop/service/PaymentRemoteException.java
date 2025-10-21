package com.project.gmaking.shop.service;

public class PaymentRemoteException extends RuntimeException {
    public PaymentRemoteException(String message) { super(message); }
    public PaymentRemoteException(String message, Throwable cause) { super(message, cause); }
}

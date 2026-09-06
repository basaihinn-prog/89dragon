package com.example.demo;

import android.app.Application;
import com.stripe.android.PaymentConfiguration;

public class MyApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        PaymentConfiguration.init(
            getApplicationContext(),
            "pk_test_51SejKnE83KyGh9qze9VTzFnIufoM1RL8vxoQGpQmCyk2TW00LGAA3Ja2uKur6FUraQrGuvP7rIaic7XiccfrCsLR00xS7irHWt"
        );
    }
}
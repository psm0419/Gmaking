package com.project.gmaking.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.*;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;


@Configuration
@RequiredArgsConstructor
public class IamportWebClientConfig {
    @Value("${iamport.api.base-url:https://api.iamport.kr}")
    private String baseUrl;

    @Value("${iamport.http.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${iamport.http.read-timeout:5000}")
    private int readTimeout;

    @Bean("iamportWebClient")
    public WebClient iamportWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeout)
                .responseTimeout(Duration.ofMillis(readTimeout))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(readTimeout, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(readTimeout, TimeUnit.MILLISECONDS))
                );

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
                .build();

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .exchangeStrategies(strategies)
                .filter(ExchangeFilterFunctions.statusError(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        resp -> WebClientResponseException.create(
                                resp.statusCode().value(),
                                "Iamport HTTP error",
                                resp.headers().asHttpHeaders(),
                                resp.bodyToMono(byte[].class).blockOptional().orElse(new byte[0]),
                                null
                        )
                ))
                .build();
    }
}

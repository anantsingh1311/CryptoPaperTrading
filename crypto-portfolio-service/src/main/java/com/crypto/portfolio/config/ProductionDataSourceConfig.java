package com.crypto.portfolio.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("production")
public class ProductionDataSourceConfig {

    @Bean
    public DataSource dataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        URI databaseUri = URI.create(databaseUrl);
        String[] credentials = databaseUri.getRawUserInfo().split(":", 2);
        int port = databaseUri.getPort() == -1 ? 5432 : databaseUri.getPort();
        String query = databaseUri.getRawQuery() == null ? "" : "?" + databaseUri.getRawQuery();

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(
            "jdbc:postgresql://" + databaseUri.getHost() + ":" + port + databaseUri.getPath() + query
        );
        dataSource.setUsername(URLDecoder.decode(credentials[0], StandardCharsets.UTF_8));
        dataSource.setPassword(URLDecoder.decode(credentials[1], StandardCharsets.UTF_8));
        return dataSource;
    }
}

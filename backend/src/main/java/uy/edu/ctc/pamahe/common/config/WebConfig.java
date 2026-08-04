package uy.edu.ctc.pamahe.common.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** 
 * Configura la comunicación con el frontend y expone únicamente el almacenamiento público.
 * Los archivos privados se entregan mediante controladores protegidos para conservar el RBAC. 
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.storage.root}")
    private String storageRoot;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(this.allowedOrigins.split(","))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // No hacer NUNCA un handler para /private: se saltearía todas las reglas de seguridad y daría todo el contenido por las URLs.
        Path publicDirectory = Path.of(this.storageRoot, "public").toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/public/**")
                .addResourceLocations(publicDirectory.toUri().toString() + "/");
    }
}

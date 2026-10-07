Comandos para ejecutar el proyecto

Para levantar MySQL
Desde pamahe/: docker compose up -d
Verificar: docker compose ps
Detener: docker compose down


Levantar Backend
Desde pamahe/backend:.\mvnw.cmd spring-boot:run
Backend esperado: http://localhost:8080/api

Levantar Frontend
Desde pamahe/frontend: npm run dev
Frontend esperado: http://localhost:5173
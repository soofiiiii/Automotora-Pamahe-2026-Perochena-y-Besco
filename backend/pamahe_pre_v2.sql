-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: pamahe_db
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `usuario` varchar(80) NOT NULL,
  `accion` varchar(50) NOT NULL,
  `entidad` varchar(80) NOT NULL,
  `entidad_id` bigint DEFAULT NULL,
  `detalle` varchar(1000) DEFAULT NULL,
  `valores_anteriores` text,
  `valores_nuevos` text,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_entidad` (`entidad`,`entidad_id`),
  KEY `idx_auditoria_usuario_accion_fecha` (`usuario`,`accion`,`creado_en`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (1,_binary '','2026-08-02 16:40:38.447366','2026-08-02 16:40:38.447366','admin','ALTA','Cliente',1,'Creación de cliente',NULL,NULL),(2,_binary '','2026-08-02 16:43:38.818698','2026-08-02 16:43:38.818698','admin','ALTA','Cliente',2,'Creación de cliente',NULL,NULL),(3,_binary '','2026-08-02 20:27:12.433312','2026-08-02 20:27:12.433312','admin','MODIFICACION','Cliente',2,'Actualización de cliente',NULL,NULL),(4,_binary '','2026-08-02 20:31:43.638263','2026-08-02 20:31:43.638263','admin','ALTA','Usuario',2,'Creación de usuario interno',NULL,NULL),(5,_binary '','2026-08-02 20:39:11.238476','2026-08-02 20:39:11.238476','admin','ALTA','Usuario',3,'Creación de usuario interno',NULL,NULL),(6,_binary '','2026-08-07 13:16:54.451329','2026-08-07 13:16:54.451329','admin','ALTA','Vehiculo',1,'Creación de vehículo',NULL,'marca=Toyota, modelo=Corolla, anio=2020, kilometraje=65000, precioVentaEstimado=15000.00, estado=COMPRADO, publicado=false'),(7,_binary '','2026-08-07 13:22:27.568452','2026-08-07 13:22:27.568452','admin','MODIFICACION','Vehiculo',1,'Actualización de datos técnicos y comerciales del vehículo','marca=Toyota, modelo=Corolla, anio=2020, kilometraje=65000, precioVentaEstimado=15000.00, estado=COMPRADO, publicado=false','marca=Toyota, modelo=Corolla XEI, anio=2020, kilometraje=67000, precioVentaEstimado=15500.00, estado=COMPRADO, publicado=false'),(8,_binary '','2026-08-07 13:23:52.696338','2026-08-07 13:23:52.696338','admin','BAJA_LOGICA','Vehiculo',1,'Desactivación de vehículo','marca=Toyota, modelo=Corolla XEI, anio=2020, kilometraje=67000, precioVentaEstimado=15500.00, estado=COMPRADO, publicado=false','activo=false, publicado=false'),(9,_binary '','2026-08-07 13:25:41.988417','2026-08-07 13:25:41.988417','admin','ALTA','Vehiculo',2,'Creación de vehículo',NULL,'marca=Toyota, modelo=Corolla, anio=1998, kilometraje=65000, precioVentaEstimado=7500.00, estado=COMPRADO, publicado=false'),(10,_binary '','2026-08-07 13:30:03.806703','2026-08-07 13:30:03.806703','admin','ALTA','Compra',1,'Registro de compra del vehículo 2',NULL,'vehiculoId=2, clienteVendedorId=1, costoAdquisicion=6000.00, fechaCompra=2026-08-06'),(11,_binary '','2026-08-07 13:40:44.582530','2026-08-07 13:40:44.582530','admin','CAMBIO_ESTADO','Vehiculo',2,'Ingreso automático a taller por la refacción 1','estado=COMPRADO','estado=EN_TALLER, publicado=false'),(12,_binary '','2026-08-07 13:40:44.588227','2026-08-07 13:40:44.588227','admin','ALTA','Refaccion',1,'Registro de refacción del vehículo 2',NULL,'vehiculoId=2, estadoTarea=PENDIENTE, costoRepuestos=500.00, costoManoObra=300.00, costoServiciosExternos=200.00, costoTotal=1000.00'),(13,_binary '','2026-08-07 13:49:26.304360','2026-08-07 13:49:26.304360','admin','MODIFICACION','Refaccion',1,'Actualización de refacción sin reasignar el vehículo','vehiculoId=2, estadoTarea=PENDIENTE, costoRepuestos=500.00, costoManoObra=300.00, costoServiciosExternos=200.00, costoTotal=1000.00','vehiculoId=2, estadoTarea=FINALIZADA, costoRepuestos=500.00, costoManoObra=300.00, costoServiciosExternos=200.00, costoTotal=1000.00'),(14,_binary '','2026-08-07 13:51:25.819875','2026-08-07 13:51:25.819875','admin','CAMBIO_ESTADO','Vehiculo',2,'Trabajos de taller finalizados','estado=EN_TALLER','estado=DISPONIBLE, publicado=false'),(15,_binary '','2026-08-07 14:11:10.980054','2026-08-07 14:11:10.980054','admin','CAMBIO_ESTADO','Vehiculo',2,'Venta registrada: 1','estado=DISPONIBLE','estado=VENDIDO, publicado=false'),(16,_binary '','2026-08-07 14:11:11.004481','2026-08-07 14:11:11.004481','admin','ALTA','Venta',1,'Registro de venta del vehículo 2',NULL,'vehiculoId=2, clienteCompradorId=2, vendedorId=1, fechaVenta=2026-08-07, costoCompraAlVender=6000.00, costoRefaccionesAlVender=1000.00, costoTotalAlVender=7000.00, precioFinal=8500.00, rentabilidad=1500.00'),(17,_binary '','2026-08-14 03:57:17.094557','2026-08-14 03:57:17.094557','admin','ALTA','Vehiculo',3,'Creación de vehículo',NULL,'marca=Volkswagen, modelo=Gol 1.6, anio=1998, kilometraje=0, precioVentaEstimado=5900, estado=COMPRADO, publicado=false'),(18,_binary '','2026-08-14 03:58:34.961257','2026-08-14 03:58:34.960748','admin','MODIFICACION','Vehiculo',3,'Actualización de datos técnicos y comerciales del vehículo','marca=Volkswagen, modelo=Gol 1.6, anio=1998, kilometraje=0, precioVentaEstimado=5900.00, estado=COMPRADO, publicado=false','marca=Volkswagen, modelo=Gol 1.6, anio=2000, kilometraje=0, precioVentaEstimado=5900, estado=COMPRADO, publicado=false'),(19,_binary '','2026-08-14 04:00:34.569872','2026-08-14 04:00:34.569872','admin','ALTA','ImagenVehiculo',1,'Imagen privada asociada al vehículo 3',NULL,'vehiculoId=3, publica=false, principal=false'),(20,_binary '','2026-08-14 04:00:37.559457','2026-08-14 04:00:37.559457','admin','CAMBIO_VISIBILIDAD','ImagenVehiculo',1,'Actualización de visibilidad de imagen','publica=false, principal=false','publica=true, principal=true'),(21,_binary '','2026-08-14 04:01:46.559684','2026-08-14 04:01:46.558688','admin','ALTA','Compra',2,'Registro de compra del vehículo 3',NULL,'vehiculoId=3, clienteVendedorId=1, costoAdquisicion=5400, fechaCompra=2026-08-14'),(22,_binary '','2026-08-14 04:02:12.889412','2026-08-14 04:02:12.889412','admin','CAMBIO_ESTADO','Vehiculo',3,'Cambio controlado de estado','estado=COMPRADO','estado=DISPONIBLE, publicado=false'),(23,_binary '','2026-08-14 04:02:44.626091','2026-08-14 04:02:44.626091','admin','CAMBIO_PUBLICACION','Vehiculo',3,'Vehículo habilitado para el catálogo','publicado=false','publicado=true'),(24,_binary '','2026-08-14 07:18:27.998838','2026-08-14 07:18:27.998838','admin','CAMBIO_PUBLICACION','Vehiculo',3,'Vehículo retirado del catálogo','publicado=true','publicado=false'),(25,_binary '','2026-08-14 07:18:35.537100','2026-08-14 07:18:35.537100','admin','CAMBIO_PUBLICACION','Vehiculo',3,'Vehículo habilitado para el catálogo','publicado=false','publicado=true'),(26,_binary '','2026-08-14 14:35:21.827668','2026-08-14 14:35:21.827668','vendedor1','ALTA','ImagenVehiculo',2,'Imagen privada asociada al vehículo 3',NULL,'vehiculoId=3, publica=false, principal=false'),(27,_binary '','2026-08-14 14:35:27.672931','2026-08-14 14:35:27.672931','vendedor1','ALTA','ImagenVehiculo',3,'Imagen privada asociada al vehículo 3',NULL,'vehiculoId=3, publica=false, principal=false'),(28,_binary '','2026-08-14 14:35:30.985359','2026-08-14 14:35:30.985359','vendedor1','CAMBIO_VISIBILIDAD','ImagenVehiculo',3,'Actualización de visibilidad de imagen','publica=false, principal=false','publica=true, principal=false'),(29,_binary '','2026-08-14 15:18:48.166420','2026-08-14 15:18:48.166420','admin','CAMBIO_VISIBILIDAD','ImagenVehiculo',2,'Actualización de visibilidad de imagen','publica=false, principal=false','publica=true, principal=false'),(30,_binary '','2026-08-21 02:03:43.913402','2026-08-21 02:03:43.913402','admin','CAMBIO_PUBLICACION','Vehiculo',3,'Vehículo retirado del catálogo','publicado=true','publicado=false'),(31,_binary '','2026-08-21 02:03:49.822790','2026-08-21 02:03:49.822264','admin','CAMBIO_PUBLICACION','Vehiculo',3,'Vehículo habilitado para el catálogo','publicado=false','publicado=true'),(32,_binary '','2026-08-21 02:04:03.310173','2026-08-21 02:04:03.310173','admin','CAMBIO_VISIBILIDAD','ImagenVehiculo',2,'Actualización de visibilidad de imagen','publica=true, principal=false','publica=false, principal=false'),(33,_binary '','2026-08-21 02:04:10.593960','2026-08-21 02:04:10.593960','admin','CAMBIO_VISIBILIDAD','ImagenVehiculo',2,'Actualización de visibilidad de imagen','publica=false, principal=false','publica=true, principal=false');
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `nombre` varchar(120) NOT NULL,
  `apellido` varchar(120) DEFAULT NULL,
  `razon_social` varchar(160) DEFAULT NULL,
  `documento` varchar(30) NOT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `tipo_cliente` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clientes_documento` (`documento`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,_binary '','2026-08-02 16:40:38.342409','2026-08-02 16:40:38.342409','Juan','Pérez',NULL,'45678901','099111222','juan.perez@pamahe.test','José Enrique Rodó 1234','VENDEDOR'),(2,_binary '','2026-08-02 16:43:38.800354','2026-08-02 20:27:12.522358','María','González',NULL,'48765432','099876543','maria.gonzalez@pamahe.test','Avenida Artigas 850','COMPRADOR');
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `vehiculo_id` bigint NOT NULL,
  `cliente_vendedor_id` bigint NOT NULL,
  `usuario_responsable_id` bigint NOT NULL,
  `fecha_compra` date NOT NULL,
  `costo_adquisicion` decimal(14,2) NOT NULL,
  `comprobante_path` varchar(500) DEFAULT NULL,
  `observaciones` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_compras_vehiculo` (`vehiculo_id`),
  KEY `fk_compras_cliente` (`cliente_vendedor_id`),
  KEY `fk_compras_usuario` (`usuario_responsable_id`),
  KEY `idx_compras_vehiculo_activo` (`vehiculo_id`,`activo`),
  CONSTRAINT `fk_compras_cliente` FOREIGN KEY (`cliente_vendedor_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_compras_usuario` FOREIGN KEY (`usuario_responsable_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_compras_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,_binary '','2026-08-07 13:30:03.508353','2026-08-07 13:30:03.832295',2,1,1,'2026-08-06',6000.00,'compras/compra-37f58231-b9c5-4fab-8005-5aec7f60ae77.pdf','Compra utilizada para prueba del flujo comercial.'),(2,_binary '','2026-08-14 04:01:46.273309','2026-08-14 04:01:46.570410',3,1,1,'2026-08-14',5400.00,'compras/compra-253dc210-2d30-4722-aaa2-f12547310efd.pdf','tiene todo roto');
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'1','create initial schema','SQL','V1__create_initial_schema.sql',-858939696,'pamahe','2026-07-31 18:39:46',866,1),(2,'2','seed initial data','SQL','V2__seed_initial_data.sql',-2114984791,'pamahe','2026-07-31 18:39:46',55,1),(3,'3','edit pre v1','SQL','V3__edit_pre_v1.sql',2094011104,'pamahe','2026-07-31 18:39:47',1094,1),(4,'4','parametros and indexes','SQL','V4__parametros_and_indexes.sql',-873429676,'pamahe','2026-08-28 04:25:25',86,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imagenes_vehiculo`
--

DROP TABLE IF EXISTS `imagenes_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imagenes_vehiculo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `vehiculo_id` bigint NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `publica` bit(1) NOT NULL DEFAULT b'1',
  `principal` bit(1) NOT NULL DEFAULT b'0',
  `principal_vehiculo_activo` bigint GENERATED ALWAYS AS ((case when ((`activo` = 1) and (`principal` = 1)) then `vehiculo_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_imagen_principal_activa` (`principal_vehiculo_activo`),
  KEY `fk_imagenes_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_imagenes_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imagenes_vehiculo`
--

LOCK TABLES `imagenes_vehiculo` WRITE;
/*!40000 ALTER TABLE `imagenes_vehiculo` DISABLE KEYS */;
INSERT INTO `imagenes_vehiculo` (`id`, `activo`, `creado_en`, `actualizado_en`, `vehiculo_id`, `ruta_archivo`, `descripcion`, `publica`, `principal`) VALUES (1,_binary '','2026-08-14 04:00:34.549930','2026-08-14 04:00:37.551355',3,'public/vehiculos/3/e103a0f6-9dbf-4f0f-bf35-a8d0ac9be16c.jpg',NULL,_binary '',_binary ''),(2,_binary '','2026-08-14 14:35:21.798250','2026-08-21 02:04:10.586923',3,'public/vehiculos/3/c6daa788-b676-4b9e-8ae3-16be1641c056.jpg',NULL,_binary '',_binary '\0'),(3,_binary '','2026-08-14 14:35:27.666241','2026-08-14 14:35:30.975799',3,'public/vehiculos/3/7c3979b7-b99e-4add-8c21-1f7c5d4ce321.jpg',NULL,_binary '',_binary '\0');
/*!40000 ALTER TABLE `imagenes_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parametros`
--

DROP TABLE IF EXISTS `parametros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `categoria` varchar(80) NOT NULL,
  `clave` varchar(80) NOT NULL,
  `valor` varchar(500) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parametros_categoria_clave` (`categoria`,`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parametros`
--

LOCK TABLES `parametros` WRITE;
/*!40000 ALTER TABLE `parametros` DISABLE KEYS */;
INSERT INTO `parametros` VALUES (1,_binary '','2026-07-31 18:39:46.619015','2026-07-31 18:39:46.619015','CONTACTO','WHATSAPP','+59899111222','WhatsApp comercial de la automotora'),(2,_binary '','2026-07-31 18:39:46.619015','2026-07-31 18:39:46.619015','CONTACTO','TELEFONO','+59845860000','Teléfono comercial de la automotora'),(3,_binary '','2026-07-31 18:39:46.619015','2026-07-31 18:39:46.619015','CONTACTO','EMAIL','contacto@pamahe.local','Correo comercial de la automotora'),(4,_binary '','2026-08-28 04:25:25.734269','2026-08-28 04:25:25.734269','CONTACTO','HORARIO','Nuestro horario de atención es de lunes a viernes de 9:00 a 12:00 y de 14:30 a 19:30. Los sábados atendemos de 10:00 a 13:30. Los domingos no contamos con atención al público.','Horario comercial utilizado por el chatbot y el frontend');
/*!40000 ALTER TABLE `parametros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refacciones`
--

DROP TABLE IF EXISTS `refacciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refacciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `vehiculo_id` bigint NOT NULL,
  `responsable_id` bigint DEFAULT NULL,
  `usuario_registra_id` bigint NOT NULL,
  `fecha` date NOT NULL,
  `tipo_trabajo` varchar(40) NOT NULL,
  `descripcion` varchar(1000) NOT NULL,
  `costo_repuestos` decimal(14,2) NOT NULL DEFAULT '0.00',
  `costo_mano_obra` decimal(14,2) NOT NULL DEFAULT '0.00',
  `costo_servicios_externos` decimal(14,2) NOT NULL DEFAULT '0.00',
  `estado_tarea` varchar(30) NOT NULL,
  `observaciones` varchar(1000) DEFAULT NULL,
  `registro_fotografico_url` varchar(500) DEFAULT NULL,
  `sincronizado_desde_offline` bit(1) NOT NULL DEFAULT b'0',
  `id_operacion_offline` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refacciones_operacion_offline` (`id_operacion_offline`),
  KEY `fk_refacciones_responsable` (`responsable_id`),
  KEY `idx_refacciones_vehiculo` (`vehiculo_id`),
  KEY `idx_refacciones_estado` (`estado_tarea`),
  KEY `fk_refacciones_usuario_registra` (`usuario_registra_id`),
  KEY `idx_refacciones_vehiculo_estado_activo` (`vehiculo_id`,`estado_tarea`,`activo`),
  CONSTRAINT `fk_refacciones_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_refacciones_usuario_registra` FOREIGN KEY (`usuario_registra_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_refacciones_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refacciones`
--

LOCK TABLES `refacciones` WRITE;
/*!40000 ALTER TABLE `refacciones` DISABLE KEYS */;
INSERT INTO `refacciones` VALUES (1,_binary '','2026-08-07 13:40:44.553876','2026-08-07 13:49:26.323341',2,NULL,1,'2026-08-06','MECANICA','Cambio de distribución y mantenimiento general finalizado.',500.00,300.00,200.00,'FINALIZADA','Trabajo finalizado correctamente.',NULL,_binary '\0',NULL);
/*!40000 ALTER TABLE `refacciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,_binary '','2026-07-31 18:39:46.585651','2026-07-31 18:39:46.585651','ADMINISTRADOR','Administrador del sistema'),(2,_binary '','2026-07-31 18:39:46.585651','2026-07-31 18:39:46.585651','DUENO','Dueño o administrador general'),(3,_binary '','2026-07-31 18:39:46.585651','2026-07-31 18:39:46.585651','VENDEDOR','Empleado o vendedor'),(4,_binary '','2026-07-31 18:39:46.585651','2026-07-31 18:39:46.585651','TALLER','Encargado de taller');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(120) NOT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_username` (`username`),
  UNIQUE KEY `uk_usuarios_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,_binary '','2026-07-31 18:39:46.601124','2026-07-31 18:39:46.601124','admin','$2y$10$2hIPAMc3RmYmBggQTFVRVO.EDOJr/YBqTK.7TQX8NerpiB.Xodqm2','Administrador Pamahe','admin@pamahe.local',NULL),(2,_binary '','2026-08-02 20:31:43.628138','2026-08-02 20:31:43.628138','vendedor1','$2a$10$aqVfPOsFLGXhtR8By54YhOsfqZoubnNXbaivKixSDF1hhptzA8Vyy','Carlos Rodríguez','carlos.rodriguez@pamahe.test','099123456'),(3,_binary '','2026-08-02 20:39:11.230831','2026-08-02 20:39:11.230831','taller1','$2a$10$Y8Q3QZKv9eQROXuWxJd8keVuALKNlickRxeehn9Hz.07wpIpl9Ioi','Encargado de Taller','taller1@pamahe.test','099222333');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_roles`
--

DROP TABLE IF EXISTS `usuarios_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_roles` (
  `usuario_id` bigint NOT NULL,
  `rol_id` bigint NOT NULL,
  PRIMARY KEY (`usuario_id`,`rol_id`),
  KEY `fk_usuarios_roles_rol` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_usuarios_roles_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_roles`
--

LOCK TABLES `usuarios_roles` WRITE;
/*!40000 ALTER TABLE `usuarios_roles` DISABLE KEYS */;
INSERT INTO `usuarios_roles` VALUES (1,1),(2,3),(3,4);
/*!40000 ALTER TABLE `usuarios_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `marca` varchar(80) NOT NULL,
  `modelo` varchar(80) NOT NULL,
  `anio` int NOT NULL,
  `matricula` varchar(30) DEFAULT NULL,
  `numero_chasis` varchar(80) DEFAULT NULL,
  `color` varchar(60) DEFAULT NULL,
  `kilometraje` int DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  `costo_inicial` decimal(14,2) DEFAULT '0.00',
  `precio_venta_estimado` decimal(14,2) DEFAULT '0.00',
  `descripcion_publica` varchar(1000) DEFAULT NULL,
  `publicado` bit(1) NOT NULL DEFAULT b'0',
  `observaciones_internas` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vehiculos_matricula` (`matricula`),
  UNIQUE KEY `uk_vehiculos_chasis` (`numero_chasis`),
  KEY `idx_vehiculos_estado_publicado` (`estado`,`publicado`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,_binary '\0','2026-08-07 13:16:54.368330','2026-08-07 13:23:52.714324','Toyota','Corolla XEI',2020,'TEST0807','CHASIS-TEST-0807-001','Negro',67000,'COMPRADO',0.00,15500.00,'Toyota Corolla XEI 2020.',_binary '\0','Datos modificados durante prueba de actualización.'),(2,_binary '','2026-08-07 13:25:41.980569','2026-08-07 14:11:11.013483','Toyota','Corolla',1998,'TEST0809','CHASIS-TEST-0807-002','Gris',65000,'VENDIDO',6000.00,7500.00,'Toyota Corolla 1998 en excelente estado.',_binary '\0','Vehículo utilizado para pruebas del backend.'),(3,_binary '','2026-08-14 03:57:17.041556','2026-08-21 02:03:49.832255','Volkswagen','Gol 1.6',2000,'IAF3459','1FA6P8CF0H1234567','negro',0,'DISPONIBLE',5400.00,5900.00,'ta joya',_binary '','no anda ni pa tras');
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activo` bit(1) NOT NULL DEFAULT b'1',
  `creado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `actualizado_en` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `vehiculo_id` bigint NOT NULL,
  `cliente_comprador_id` bigint NOT NULL,
  `vendedor_id` bigint NOT NULL,
  `fecha_venta` date NOT NULL,
  `costo_compra_al_vender` decimal(14,2) NOT NULL,
  `costo_refacciones_al_vender` decimal(14,2) NOT NULL,
  `costo_total_al_vender` decimal(14,2) NOT NULL,
  `precio_final` decimal(14,2) NOT NULL,
  `rentabilidad_calculada` decimal(14,2) NOT NULL,
  `comprobante_path` varchar(500) DEFAULT NULL,
  `observaciones` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ventas_vehiculo` (`vehiculo_id`),
  KEY `fk_ventas_cliente` (`cliente_comprador_id`),
  KEY `fk_ventas_usuario` (`vendedor_id`),
  KEY `idx_ventas_vehiculo_activo` (`vehiculo_id`,`activo`),
  CONSTRAINT `fk_ventas_cliente` FOREIGN KEY (`cliente_comprador_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `fk_ventas_usuario` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_ventas_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,_binary '','2026-08-07 14:11:10.968797','2026-08-07 14:11:11.019125',2,2,1,'2026-08-07',6000.00,1000.00,7000.00,8500.00,1500.00,'ventas/venta-f14506b1-53d5-464e-9bb3-4cc8113954c9.pdf','Venta utilizada para validar el cierre del ciclo.');
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-16 12:31:07

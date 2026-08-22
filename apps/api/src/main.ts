import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    configService.get<string>("CORS_ORIGIN") || "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development / testing
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  });

  // Serve static uploads
  const uploadsPath = join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  const port = configService.get<number>("PORT") || 4000;
  await app.listen(port);
  logger.log(`🚀 GlobeTrotter API server running at http://localhost:${port}`);
}

bootstrap();

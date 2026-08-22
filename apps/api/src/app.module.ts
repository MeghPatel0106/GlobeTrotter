import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { UploadsModule } from "./uploads/uploads.module";
import { CitiesModule } from "./cities/cities.module";
import { TripsModule } from "./trips/trips.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>("MONGODB_URI") ||
          "mongodb://localhost:27017/globetrotter",
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    UploadsModule,
    CitiesModule,
    TripsModule,
    ExpensesModule,
    AdminModule,
  ],
})
export class AppModule {}

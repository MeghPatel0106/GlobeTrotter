import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuthModule } from "../auth/auth.module";
import { User, UserSchema } from "../schemas/user.schema";
import { Trip, TripSchema } from "../schemas/trip.schema";
import { City, CitySchema } from "../schemas/city.schema";
import { Activity, ActivitySchema } from "../schemas/activity.schema";
import { Expense, ExpenseSchema } from "../schemas/expense.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Trip.name, schema: TripSchema },
      { name: City.name, schema: CitySchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Expense.name, schema: ExpenseSchema },
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

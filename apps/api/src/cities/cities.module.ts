import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { City, CitySchema } from "../schemas/city.schema";
import { Activity, ActivitySchema } from "../schemas/activity.schema";
import { CitiesController } from "./cities.controller";
import { CitiesService } from "./cities.service";
import { CitiesSeedService } from "./cities.seed";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: City.name, schema: CitySchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [CitiesController],
  providers: [CitiesService, CitiesSeedService],
  exports: [CitiesService],
})
export class CitiesModule {}

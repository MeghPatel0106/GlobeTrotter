import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Trip, TripSchema } from "../schemas/trip.schema";
import { City, CitySchema } from "../schemas/city.schema";
import { TripsController } from "./trips.controller";
import { StopsController } from "./stops.controller";
import { ItineraryItemsController } from "./itinerary-items.controller";
import { TripsService } from "./trips.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
      { name: City.name, schema: CitySchema },
    ]),
  ],
  controllers: [TripsController, StopsController, ItineraryItemsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}

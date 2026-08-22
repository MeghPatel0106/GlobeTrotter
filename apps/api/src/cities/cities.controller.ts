import { Controller, Get, Param, Query } from "@nestjs/common";
import { CitiesService } from "./cities.service";

@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get("countries")
  async getCountries() {
    return this.citiesService.getDistinctCountries();
  }

  @Get("top")
  async getTopCities(
    @Query("limit") limit?: string,
    @Query("country") country?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 5;
    return this.citiesService.getTopCities(numLimit, country);
  }

  @Get("search")
  async searchCities(
    @Query("q") query?: string,
    @Query("limit") limit?: string,
    @Query("country") country?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.citiesService.searchCities(query || "", numLimit, country);
  }

  @Get(":id/activities")
  async getActivitiesForCity(
    @Param("id") cityId: string,
    @Query("top") top?: string
  ) {
    const numTop = top ? parseInt(top, 10) : 6;
    return this.citiesService.getActivitiesForCity(cityId, numTop);
  }

  @Get(":id")
  async getCityById(@Param("id") id: string) {
    return this.citiesService.getCityById(id);
  }
}

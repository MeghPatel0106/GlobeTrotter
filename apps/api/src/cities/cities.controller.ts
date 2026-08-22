import { Controller, Get, Param, Query } from "@nestjs/common";
import { CitiesService } from "./cities.service";

@Controller("cities")
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get("countries")
  async getCountries() {
    return this.citiesService.getDistinctCountries();
  }

  @Get("external-search")
  async searchExternalCities(
    @Query("country") country: string,
    @Query("q") query?: string,
    @Query("limit") limit?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 15;
    return this.citiesService.searchExternalCities(
      country || "",
      query || "",
      numLimit
    );
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
    @Query("top") top?: string,
    @Query("q") query?: string,
    @Query("category") category?: string,
    @Query("maxCost") maxCost?: string,
    @Query("cityName") cityName?: string
  ) {
    const numTop = top ? parseInt(top, 10) : 20;
    const numMaxCost = maxCost ? parseFloat(maxCost) : undefined;
    return this.citiesService.getActivitiesForCity(
      cityId,
      numTop,
      query,
      category,
      numMaxCost,
      cityName
    );
  }

  @Get(":id")
  async getCityById(@Param("id") id: string) {
    return this.citiesService.getCityById(id);
  }
}

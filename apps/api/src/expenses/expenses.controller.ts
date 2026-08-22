import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto, UpdateExpenseDto } from "./dto/expense.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post("trips/:id/expenses")
  async createTripExpense(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Body() dto: CreateExpenseDto
  ) {
    return this.expensesService.createExpense(userId, tripId, dto);
  }

  @Post("expenses")
  async createDirectExpense(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateExpenseDto
  ) {
    const tripId = dto.tripId;
    if (!tripId) {
      throw new Error("tripId is required when posting to /expenses");
    }
    return this.expensesService.createExpense(userId, tripId, dto);
  }

  @Get("trips/:id/expenses")
  async getTripExpenses(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.expensesService.getTripExpenses(userId, tripId);
  }

  @Patch("expenses/:id")
  async updateExpense(
    @CurrentUser("id") userId: string,
    @Param("id") expenseId: string,
    @Body() dto: UpdateExpenseDto
  ) {
    return this.expensesService.updateExpense(userId, expenseId, dto);
  }

  @Patch("trips/:tripId/expenses/:id")
  async updateTripExpense(
    @CurrentUser("id") userId: string,
    @Param("id") expenseId: string,
    @Body() dto: UpdateExpenseDto
  ) {
    return this.expensesService.updateExpense(userId, expenseId, dto);
  }

  @Delete("expenses/:id")
  async deleteExpense(
    @CurrentUser("id") userId: string,
    @Param("id") expenseId: string
  ) {
    return this.expensesService.deleteExpense(userId, expenseId);
  }

  @Delete("trips/:tripId/expenses/:id")
  async deleteTripExpense(
    @CurrentUser("id") userId: string,
    @Param("id") expenseId: string
  ) {
    return this.expensesService.deleteExpense(userId, expenseId);
  }
}

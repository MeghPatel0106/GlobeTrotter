import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Expense, ExpenseDocument } from "../schemas/expense.schema";
import { Trip, TripDocument } from "../schemas/trip.schema";
import { CreateExpenseDto, UpdateExpenseDto } from "./dto/expense.dto";

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>
  ) {}

  async createExpense(
    userId: string,
    tripId: string,
    dto: CreateExpenseDto
  ): Promise<Expense> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    let stopObjectId: Types.ObjectId | null = null;
    if (dto.stopId && Types.ObjectId.isValid(dto.stopId)) {
      stopObjectId = new Types.ObjectId(dto.stopId);
    }

    let expenseDate: Date | null = null;
    if (dto.date) {
      const parsed = new Date(dto.date);
      if (!isNaN(parsed.getTime())) {
        expenseDate = parsed;
      }
    }

    const newExpense = new this.expenseModel({
      tripId: new Types.ObjectId(tripId),
      stopId: stopObjectId,
      dayNumber: dto.dayNumber || 1,
      category: dto.category,
      amount: dto.amount,
      currency: dto.currency || "INR",
      date: expenseDate || new Date(),
      notes: dto.notes ? dto.notes.trim() : null,
    });

    const saved = await newExpense.save();
    return saved;
  }

  async getTripExpenses(userId: string, tripId: string): Promise<Expense[]> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to view expenses for this trip.");
    }

    return this.expenseModel
      .find({ tripId: new Types.ObjectId(tripId) })
      .sort({ dayNumber: 1, date: 1, createdAt: 1 })
      .exec();
  }

  async updateExpense(
    userId: string,
    expenseId: string,
    dto: UpdateExpenseDto
  ): Promise<Expense> {
    if (!Types.ObjectId.isValid(expenseId)) {
      throw new BadRequestException("Invalid expense ID format.");
    }

    const expense = await this.expenseModel.findById(expenseId).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found.`);
    }

    const trip = await this.tripModel.findById(expense.tripId).exec();
    if (!trip || trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this expense.");
    }

    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.amount !== undefined) expense.amount = dto.amount;
    if (dto.currency !== undefined) expense.currency = dto.currency;
    if (dto.dayNumber !== undefined) expense.dayNumber = dto.dayNumber;
    if (dto.notes !== undefined) expense.notes = dto.notes ? dto.notes.trim() : "";
    if (dto.stopId !== undefined) {
      expense.stopId = dto.stopId && Types.ObjectId.isValid(dto.stopId) ? new Types.ObjectId(dto.stopId) : (null as any);
    }
    if (dto.date !== undefined) {
      if (dto.date) {
        const parsed = new Date(dto.date);
        if (!isNaN(parsed.getTime())) expense.date = parsed;
      } else {
        expense.date = undefined as any;
      }
    }

    const saved = await expense.save();
    return saved;
  }

  async deleteExpense(
    userId: string,
    expenseId: string
  ): Promise<{ success: boolean; id: string }> {
    if (!Types.ObjectId.isValid(expenseId)) {
      throw new BadRequestException("Invalid expense ID format.");
    }

    const expense = await this.expenseModel.findById(expenseId).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found.`);
    }

    const trip = await this.tripModel.findById(expense.tripId).exec();
    if (!trip || trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to delete this expense.");
    }

    await this.expenseModel.findByIdAndDelete(expenseId).exec();
    return { success: true, id: expenseId };
  }
}

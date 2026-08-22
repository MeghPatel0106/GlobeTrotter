
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "../schemas/user.schema";
import { Trip, TripDocument } from "../schemas/trip.schema";
import { City, CityDocument } from "../schemas/city.schema";
import { Activity, ActivityDocument } from "../schemas/activity.schema";
import { Expense, ExpenseDocument } from "../schemas/expense.schema";
import { Role, Visibility } from "../schemas/enums";

export interface AdminSummaryDto {
  totalUsers: number;
  totalTrips: number;
  totalPublicTrips: number;
  totalActivitiesPlanned: number;
  totalExpensesRecorded: number;
}

export interface AdminUserItemDto {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  role: Role;
  tripsCount: number;
  createdAt: Date;
}

export interface AdminCityStatDto {
  cityName: string;
  country: string;
  visitCount: number;
  totalBudgetPlanned: number;
}

export interface AdminActivityStatDto {
  activityName: string;
  category?: string;
  count: number;
  averageCost: number;
}

export interface AdminTrendPointDto {
  period: string; // e.g. "2026-08" or "Aug 2026"
  usersCount: number;
  tripsCount: number;
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(City.name) private readonly cityModel: Model<CityDocument>,
    @InjectModel(Activity.name) private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>
  ) { }

  async onModuleInit() {
    await this.seedAdminUserIfNone();
  }

  /**
   * Ensures an admin user exists in MongoDB for administrative dashboard access.
   */
  async seedAdminUserIfNone() {
    try {
      const existingAdmin = await this.userModel.findOne({ role: Role.ADMIN }).exec();
      if (!existingAdmin) {
        const adminEmail = "admin@globetrotter.com";
        const existingByEmail = await this.userModel.findOne({ email: adminEmail }).exec();

        if (existingByEmail) {
          existingByEmail.role = Role.ADMIN;
          await existingByEmail.save();
          this.logger.log(`Promoted user ${adminEmail} to ADMIN role.`);
        } else {
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash("Admin@1234", saltRounds);

          await this.userModel.create({
            firstName: "Admin",
            lastName: "GlobeTrotter",
            username: "admin",
            email: adminEmail,
            passwordHash,
            role: Role.ADMIN,
            city: "San Francisco",
            country: "USA",
          });
          this.logger.log(`Seeded default ADMIN user: ${adminEmail} / Admin@1234`);
        }
      }
    } catch (err) {
      this.logger.error("Failed to seed admin user", err);
    }
  }

  /**
   * Aggregate overall platform KPIs
   */
  async getSummary(): Promise<AdminSummaryDto> {
    const [totalUsers, totalTrips, totalPublicTrips, totalExpensesRecorded] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.tripModel.countDocuments().exec(),
      this.tripModel.countDocuments({ visibility: Visibility.PUBLIC }).exec(),
      this.expenseModel.countDocuments().exec(),
    ]);

    // Count all itinerary items scheduled across all trips
    const activityCountRes = await this.tripModel.aggregate([
      { $unwind: "$stops" },
      { $unwind: "$stops.itineraryItems" },
      { $count: "total" },
    ]);
    const totalActivitiesPlanned = activityCountRes[0]?.total || 0;

    return {
      totalUsers,
      totalTrips,
      totalPublicTrips,
      totalActivitiesPlanned,
      totalExpensesRecorded,
    };
  }

  /**
   * List all users with their trip count and metadata
   */
  async getUsers(): Promise<AdminUserItemDto[]> {
    const users = await this.userModel
      .find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Aggregate trip counts per user
    const tripCounts = await this.tripModel.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of tripCounts) {
      if (item._id) {
        countMap.set(String(item._id), item.count);
      }
    }

    return users.map((u: any) => ({
      id: String(u._id),
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      email: u.email,
      phone: u.phone,
      photoUrl: u.photoUrl,
      role: u.role || Role.USER,
      tripsCount: countMap.get(String(u._id)) || 0,
      createdAt: u.createdAt,
    }));
  }

  /**
   * Aggregate most visited cities across all trip stops
   */
  async getPopularCities(limit = 10): Promise<AdminCityStatDto[]> {
    const parsedLimit = Math.max(1, Math.min(limit, 50));

    const results = await this.tripModel.aggregate([
      { $unwind: "$stops" },
      {
        $group: {
          _id: {
            cityName: "$stops.cityName",
            country: "$stops.country",
          },
          visitCount: { $sum: 1 },
          totalBudgetPlanned: {
            $sum: { $ifNull: ["$stops.sectionBudget", 0] },
          },
        },
      },
      { $sort: { visitCount: -1, "_id.cityName": 1 } },
      { $limit: parsedLimit },
    ]);

    return results.map((r) => ({
      cityName: r._id.cityName || "Unspecified City",
      country: r._id.country || "Global",
      visitCount: r.visitCount,
      totalBudgetPlanned: r.totalBudgetPlanned,
    }));
  }

  /**
   * Aggregate most popular itinerary activities scheduled by explorers
   */
  async getPopularActivities(limit = 10): Promise<AdminActivityStatDto[]> {
    const parsedLimit = Math.max(1, Math.min(limit, 50));

    const results = await this.tripModel.aggregate([
      { $unwind: "$stops" },
      { $unwind: "$stops.itineraryItems" },
      {
        $group: {
          _id: "$stops.itineraryItems.activityName",
          count: { $sum: 1 },
          averageCost: {
            $avg: { $ifNull: ["$stops.itineraryItems.costOverride", 0] },
          },
        },
      },
      { $match: { _id: { $ne: null, $exists: true } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: parsedLimit },
    ]);

    return results.map((r) => ({
      activityName: r._id || "Activity",
      count: r.count,
      averageCost: Math.round(r.averageCost || 0),
    }));
  }

  /**
   * Time-series trend aggregations for user growth and trip creation
   */
  async getTrends(): Promise<AdminTrendPointDto[]> {
    // 1. User registrations by Month
    const userMonthly = await this.userModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 2. Trip creations by Month
    const tripMonthly = await this.tripModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Combine into unified map
    const periodMap = new Map<string, { usersCount: number; tripsCount: number; sortKey: string }>();

    for (const u of userMonthly) {
      if (u._id?.year && u._id?.month) {
        const key = `${monthNames[u._id.month - 1]} ${u._id.year}`;
        const sortKey = `${u._id.year}-${String(u._id.month).padStart(2, "0")}`;
        const existing = periodMap.get(key) || { usersCount: 0, tripsCount: 0, sortKey };
        existing.usersCount += u.count;
        periodMap.set(key, existing);
      }
    }

    for (const t of tripMonthly) {
      if (t._id?.year && t._id?.month) {
        const key = `${monthNames[t._id.month - 1]} ${t._id.year}`;
        const sortKey = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
        const existing = periodMap.get(key) || { usersCount: 0, tripsCount: 0, sortKey };
        existing.tripsCount += t.count;
        periodMap.set(key, existing);
      }
    }

    // Sort periods chronologically
    const sortedEntries = Array.from(periodMap.entries()).sort((a, b) =>
      a[1].sortKey.localeCompare(b[1].sortKey)
    );

    if (sortedEntries.length === 0) {
      const now = new Date();
      const currentLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      return [
        {
          period: currentLabel,
          usersCount: await this.userModel.countDocuments().exec(),
          tripsCount: await this.tripModel.countDocuments().exec(),
        },
      ];
    }

    return sortedEntries.map(([period, data]) => ({
      period,
      usersCount: data.usersCount,
      tripsCount: data.tripsCount,
    }));
  }
}

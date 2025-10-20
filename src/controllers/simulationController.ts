import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middlewares/errorHandler';
import { z } from 'zod';

// Validation schema for simulation request
const simulationSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  roiPercent: z.number().min(0, 'ROI must be non-negative').max(1000, 'ROI seems unrealistic'),
  durationMonths: z.number().int().min(1, 'Duration must be at least 1 month').max(120, 'Duration too long'),
});

export class SimulationController {
  /**
   * Calculate investment returns and monthly breakdown
   * POST /api/simulation
   * @access Public
   */
  static async calculateROI(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate input
      const { amount, roiPercent, durationMonths } = simulationSchema.parse(req.body);

      // Calculate total return
      const profit = (amount * roiPercent) / 100;
      const totalReturn = amount + profit;

      // Calculate monthly breakdown (compound interest approach)
      const monthlyRate = roiPercent / 100 / durationMonths;
      const monthlyBreakdown = [];

      for (let month = 0; month <= durationMonths; month++) {
        const value = amount * (1 + monthlyRate * month);
        monthlyBreakdown.push({
          month,
          value: parseFloat(value.toFixed(2)),
          profit: parseFloat((value - amount).toFixed(2)),
        });
      }

      // Calculate expected return date
      const currentDate = new Date();
      const expectedReturnDate = new Date(currentDate);
      expectedReturnDate.setMonth(expectedReturnDate.getMonth() + durationMonths);

      res.status(200).json({
        success: true,
        data: {
          input: {
            amount,
            roiPercent,
            durationMonths,
          },
          results: {
            initialInvestment: amount,
            totalReturn: parseFloat(totalReturn.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            profitPercentage: roiPercent,
            expectedReturnDate: expectedReturnDate.toISOString(),
          },
          monthlyBreakdown,
          statistics: {
            monthlyProfit: parseFloat((profit / durationMonths).toFixed(2)),
            dailyProfit: parseFloat((profit / (durationMonths * 30)).toFixed(2)),
            annualizedReturn: parseFloat(((roiPercent / durationMonths) * 12).toFixed(2)),
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * Compare multiple investment scenarios
   * POST /api/simulation/compare
   * @access Public
   */
  static async compareScenarios(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const scenariosSchema = z.object({
        scenarios: z.array(simulationSchema).min(2, 'At least 2 scenarios required').max(5, 'Maximum 5 scenarios'),
      });

      const { scenarios } = scenariosSchema.parse(req.body);

      const comparisons = scenarios.map((scenario, index) => {
        const profit = (scenario.amount * scenario.roiPercent) / 100;
        const totalReturn = scenario.amount + profit;

        return {
          scenario: index + 1,
          input: scenario,
          results: {
            initialInvestment: scenario.amount,
            totalReturn: parseFloat(totalReturn.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            profitPercentage: scenario.roiPercent,
            monthlyProfit: parseFloat((profit / scenario.durationMonths).toFixed(2)),
          },
        };
      });

      // Find best scenario
      const bestScenario = comparisons.reduce((best, current) =>
        current.results.profit > best.results.profit ? current : best
      );

      res.status(200).json({
        success: true,
        data: {
          comparisons,
          bestScenario: {
            scenario: bestScenario.scenario,
            reason: 'Highest total profit',
            profit: bestScenario.results.profit,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new AppError(error.errors[0].message, 400));
      } else {
        next(error);
      }
    }
  }
}

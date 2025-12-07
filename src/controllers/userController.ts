import { Request, Response, NextFunction } from 'express';
import { User, IBankAccount } from '../models/User';
import { z } from 'zod';

// Colombian bank codes reference
const COLOMBIAN_BANKS: Record<string, string> = {
  '001': 'Banco de Bogotá',
  '002': 'Banco Popular',
  '006': 'Banco Corpbanca',
  '007': 'Bancolombia',
  '009': 'Citibank',
  '012': 'Banco GNB Sudameris',
  '013': 'BBVA Colombia',
  '019': 'Banco Colpatria',
  '023': 'Banco de Occidente',
  '031': 'Bancoldex',
  '032': 'BCSC',
  '040': 'Banco Agrario',
  '041': 'Banco Davivienda',
  '042': 'Banco AV Villas',
  '051': 'Banco Caja Social',
  '052': 'Banco Falabella',
  '053': 'Banco Finandina',
  '054': 'Banco W',
  '055': 'Banco Pichincha',
  '056': 'Bancoomeva',
  '057': 'Banco Itaú',
  '058': 'Banco Santander',
  '059': 'Banco Mundo Mujer',
  '060': 'Banco Multibank',
  '061': 'Banco Bancompartir',
  '062': 'Banco Coopcentral',
  '063': 'Banco Serfinanza',
  '065': 'Banco Coomeva',
  '066': 'Banco Compartir',
  '067': 'Lulo Bank',
  '068': 'Banco Pibank',
  '069': 'Banco J.P. Morgan',
  '070': 'Dale',
  '071': 'Rappipay',
  '072': 'Movii',
  '073': 'Nequi',
  '074': 'Daviplata',
  '075': 'Banco Nu Colombia',
};

// Validation schema for bank account
const bankAccountSchema = z.object({
  bankCode: z.string().min(1, 'Bank code is required').max(10),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountType: z.enum(['savings', 'checking'], { errorMap: () => ({ message: 'Account type must be savings or checking' }) }),
  accountNumber: z.string().min(5, 'Account number must be at least 5 digits').max(20),
  accountHolderName: z.string().min(2, 'Account holder name is required').max(100),
  documentType: z.string().min(1, 'Document type is required').max(10),
  documentNumber: z.string().min(5, 'Document number is required').max(20),
});

export class UserController {
  /**
   * Get user statistics
   * GET /api/users/stats
   * @access Admin only
   */
  static async getUserStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get total users
      const total = await User.countDocuments();

      // Get users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalLastMonth = await User.countDocuments({
        createdAt: { $lt: thirtyDaysAgo },
      });

      // Calculate growth percentage
      const growth = totalLastMonth > 0
        ? ((total - totalLastMonth) / totalLastMonth) * 100
        : 0;

      // Get users by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]);

      // Get users by plan
      const usersByPlan = await User.aggregate([
        {
          $group: {
            _id: '$planKey',
            count: { $sum: 1 },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          growth: parseFloat(growth.toFixed(2)),
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
          byPlan: usersByPlan.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   * GET /api/users
   * @access Admin only
   */
  static async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          users,
          count: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * @access Admin only
   */
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's profile
   * PUT /api/users/profile
   * @access Authenticated user
   */
  static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const { name, phone } = req.body;

      // Only allow updating name and phone
      const updateData: { name?: string; phone?: string } = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   * @access Admin only
   */
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Prevent deleting admin users
      if (user.role === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Cannot delete admin users',
        });
        return;
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // BANK ACCOUNT MANAGEMENT FOR PAYOUTS
  // ============================================

  /**
   * Get list of Colombian banks
   * GET /api/users/banks
   * @access Public
   */
  static async getBanks(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Return the static list of Colombian banks
      const banks = Object.entries(COLOMBIAN_BANKS).map(([code, name]) => ({
        code,
        name,
      }));

      res.status(200).json({
        success: true,
        data: { banks },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's bank account
   * GET /api/users/bank-account
   * @access Authenticated user
   */
  static async getBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await User.findById(userId).select('bankAccount');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Mask account number for security
      let maskedBankAccount = null;
      if (user.bankAccount && user.bankAccount.accountNumber) {
        const accountNumber = user.bankAccount.accountNumber;
        const bankAccountObj = user.bankAccount as any;
        maskedBankAccount = {
          bankCode: bankAccountObj.bankCode,
          bankName: bankAccountObj.bankName,
          accountType: bankAccountObj.accountType,
          accountHolderName: bankAccountObj.accountHolderName,
          documentType: bankAccountObj.documentType,
          documentNumber: bankAccountObj.documentNumber,
          isVerified: bankAccountObj.isVerified,
          verifiedAt: bankAccountObj.verifiedAt,
          accountNumber: `****${accountNumber.slice(-4)}`,
          accountNumberFull: accountNumber, // Include full number for the user
        };
      }

      res.status(200).json({
        success: true,
        data: { bankAccount: maskedBankAccount },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add or update bank account for payouts
   * POST /api/users/bank-account
   * @access Authenticated user
   */
  static async updateBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Validate input
      const validationResult = bankAccountSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }

      const bankData = validationResult.data;

      // Validate bank code exists
      if (!COLOMBIAN_BANKS[bankData.bankCode]) {
        res.status(400).json({
          success: false,
          message: 'Invalid bank code',
        });
        return;
      }

      // Prepare bank account data
      const bankAccount: IBankAccount = {
        bankCode: bankData.bankCode,
        bankName: bankData.bankName,
        accountType: bankData.accountType,
        accountNumber: bankData.accountNumber,
        accountHolderName: bankData.accountHolderName,
        documentType: bankData.documentType.toUpperCase(),
        documentNumber: bankData.documentNumber,
        isVerified: false, // Will be verified through a micro-deposit or manual review
      };

      const user = await User.findByIdAndUpdate(
        userId,
        { bankAccount },
        { new: true, runValidators: true }
      ).select('bankAccount name email');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const savedBankAccount = user.bankAccount as any;
      res.status(200).json({
        success: true,
        message: 'Bank account saved successfully. Your account will be used for future payouts.',
        data: {
          bankAccount: {
            bankCode: savedBankAccount?.bankCode,
            bankName: savedBankAccount?.bankName,
            accountType: savedBankAccount?.accountType,
            accountHolderName: savedBankAccount?.accountHolderName,
            documentType: savedBankAccount?.documentType,
            isVerified: savedBankAccount?.isVerified,
            accountNumber: `****${bankData.accountNumber.slice(-4)}`,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete bank account
   * DELETE /api/users/bank-account
   * @access Authenticated user
   */
  static async deleteBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { bankAccount: 1 } },
        { new: true }
      );

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Bank account removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Verify a user's bank account
   * PUT /api/users/:id/verify-bank-account
   * @access Admin only
   */
  static async verifyBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (!user.bankAccount || !user.bankAccount.accountNumber) {
        res.status(400).json({
          success: false,
          message: 'User does not have a bank account configured',
        });
        return;
      }

      user.bankAccount.isVerified = true;
      user.bankAccount.verifiedAt = new Date();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Bank account verified successfully',
        data: {
          userId: user._id,
          bankAccount: {
            bankName: user.bankAccount.bankName,
            accountNumber: `****${user.bankAccount.accountNumber.slice(-4)}`,
            isVerified: true,
            verifiedAt: user.bankAccount.verifiedAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

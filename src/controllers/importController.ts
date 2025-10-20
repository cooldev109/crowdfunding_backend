import { Request, Response, NextFunction } from 'express';
import { ExcelImportService } from '../services/excelImportService';
import { cleanupFile } from '../config/multer';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';
import ExcelJS from 'exceljs';

export class ImportController {
  /**
   * Import projects from Excel file
   * POST /api/import/projects
   * @access Admin only
   */
  static async importProjects(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let filePath: string | undefined;

    try {
      // Check if file was uploaded
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      filePath = req.file.path;
      const adminId = String(req.user!._id);

      logger.info(`Starting Excel import: ${req.file.originalname}`);
      logger.info(`File saved temporarily at: ${filePath}`);

      // Import projects
      const result = await ExcelImportService.importProjects(
        filePath,
        adminId
      );

      // Cleanup uploaded file
      logger.info(`Deleting temporary file: ${filePath}`);
      cleanupFile(filePath);
      logger.info('File deleted successfully');

      // Return result
      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.success
          ? `Successfully imported ${result.imported} projects`
          : 'Import completed with errors',
        data: {
          totalRows: result.totalRows,
          imported: result.imported,
          failed: result.failed,
          errors: result.errors,
          projects: result.projects,
        },
      });
    } catch (error) {
      // Cleanup file on error
      if (filePath) {
        logger.info(`Error occurred, deleting temporary file: ${filePath}`);
        cleanupFile(filePath);
      }
      next(error);
    }
  }

  /**
   * Download sample Excel template
   * GET /api/import/template
   * @access Admin only
   */
  static async downloadTemplate(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Projects');

      // Define columns
      worksheet.columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'MinInvestment', key: 'minInvestment', width: 15 },
        { header: 'RoiPercent', key: 'roiPercent', width: 12 },
        { header: 'TargetAmount', key: 'targetAmount', width: 15 },
        { header: 'FundedAmount', key: 'fundedAmount', width: 15 },
        { header: 'DurationMonths', key: 'durationMonths', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'ImageUrl', key: 'imageUrl', width: 40 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add sample data
      const sampleData = ExcelImportService.getSampleTemplate();
      sampleData.forEach((project) => {
        worksheet.addRow(project);
      });

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=project-import-template.xlsx'
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();

      logger.info('Template downloaded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get import history
   * GET /api/import/history
   * @access Admin only
   */
  static async getImportHistory(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { Upload } = await import('../models/Upload');

      const uploads = await Upload.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('adminId', 'name email');

      res.status(200).json({
        success: true,
        data: { uploads },
      });
    } catch (error) {
      next(error);
    }
  }
}

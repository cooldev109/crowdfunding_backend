import ExcelJS from 'exceljs';
import { Project, IProject } from '../models/Project';
import { Upload } from '../models/Upload';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../config/logger';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  projects: IProject[];
}

export interface ProjectImportData {
  title: string;
  description: string;
  category: string;
  minInvestment: number;
  roiPercent: number;
  targetAmount: number;
  fundedAmount?: number;
  durationMonths: number;
  status?: 'active' | 'completed' | 'closed';
  imageUrl?: string;
}

export class ExcelImportService {
  /**
   * Parse Excel file and import projects
   */
  static async importProjects(
    filePath: string,
    adminId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      imported: 0,
      failed: 0,
      errors: [],
      projects: [],
    };

    try {
      // Create upload record
      const upload = await Upload.create({
        adminId,
        fileName: filePath.split(/[\\/]/).pop() || 'unknown',
        importedCount: 0,
        status: 'processing',
      });

      // Read Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      // Get first worksheet
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new AppError('No worksheet found in Excel file', 400);
      }

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers: { [key: string]: number } = {};

      headerRow.eachCell((cell, colNumber) => {
        const headerValue = String(cell.value).toLowerCase().trim();
        headers[headerValue] = colNumber;
      });

      // Validate required columns exist
      const requiredColumns = [
        'title',
        'description',
        'category',
        'mininvestment',
        'roipercent',
        'targetamount',
        'durationmonths',
      ];

      for (const col of requiredColumns) {
        if (!headers[col]) {
          throw new AppError(
            `Missing required column: ${col}. Required columns: ${requiredColumns.join(', ')}`,
            400
          );
        }
      }

      // Process each row (skip header)
      const rowCount = worksheet.rowCount;
      result.totalRows = rowCount - 1; // Exclude header

      for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Skip empty rows
        if (row.hasValues === false) {
          continue;
        }

        try {
          // Extract data
          const projectData: ProjectImportData = {
            title: String(row.getCell(headers['title']).value || '').trim(),
            description: String(
              row.getCell(headers['description']).value || ''
            ).trim(),
            category: String(
              row.getCell(headers['category']).value || ''
            ).trim(),
            minInvestment: Number(
              row.getCell(headers['mininvestment']).value || 0
            ),
            roiPercent: Number(
              row.getCell(headers['roipercent']).value || 0
            ),
            targetAmount: Number(
              row.getCell(headers['targetamount']).value || 0
            ),
            fundedAmount: headers['fundedamount']
              ? Number(row.getCell(headers['fundedamount']).value || 0)
              : 0,
            durationMonths: Number(
              row.getCell(headers['durationmonths']).value || 0
            ),
            status: headers['status']
              ? (String(row.getCell(headers['status']).value || 'active')
                  .toLowerCase()
                  .trim() as 'active' | 'completed' | 'closed')
              : 'active',
            imageUrl: headers['imageurl']
              ? String(row.getCell(headers['imageurl']).value || '').trim()
              : undefined,
          };

          // Validate data
          this.validateProjectData(projectData, rowNumber);

          // Create project
          const project = await Project.create({
            ...projectData,
            createdBy: adminId,
          });

          result.projects.push(project);
          result.imported++;

          logger.info(
            `Row ${rowNumber}: Imported project "${projectData.title}"`
          );
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error',
            data: row.values,
          });

          logger.warn(
            { err: error },
            `Row ${rowNumber}: Failed to import project`
          );
        }
      }

      // Update upload record
      upload.importedCount = result.imported;
      upload.status = result.failed > 0 ? 'partial' : 'completed';
      if (result.errors.length > 0) {
        upload.errorMessage = `${result.failed} rows failed. See logs for details.`;
      }
      await upload.save();

      result.success = result.imported > 0;

      logger.info({
        uploadId: upload._id,
        total: result.totalRows,
        imported: result.imported,
        failed: result.failed,
      });

      return result;
    } catch (error: any) {
      logger.error({ err: error }, 'Excel import failed');
      throw error;
    }
  }

  /**
   * Validate project data from Excel row
   */
  private static validateProjectData(
    data: ProjectImportData,
    rowNumber: number
  ): void {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    if (data.title && data.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    // Description validation
    if (!data.description || data.description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    if (data.description && data.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    // Category validation
    if (!data.category || data.category.length < 1) {
      errors.push('Category is required');
    }

    // Numeric validations
    if (!data.minInvestment || data.minInvestment <= 0) {
      errors.push('Minimum investment must be greater than 0');
    }

    if (!data.roiPercent || data.roiPercent <= 0) {
      errors.push('ROI percent must be greater than 0');
    }
    if (data.roiPercent > 1000) {
      errors.push('ROI percent cannot exceed 1000%');
    }

    if (!data.targetAmount || data.targetAmount <= 0) {
      errors.push('Target amount must be greater than 0');
    }

    if (data.fundedAmount && data.fundedAmount < 0) {
      errors.push('Funded amount cannot be negative');
    }

    if (!data.durationMonths || data.durationMonths < 1) {
      errors.push('Duration must be at least 1 month');
    }
    if (data.durationMonths > 240) {
      errors.push('Duration cannot exceed 240 months (20 years)');
    }

    // Status validation
    if (
      data.status &&
      !['active', 'completed', 'closed'].includes(data.status)
    ) {
      errors.push('Status must be: active, completed, or closed');
    }

    // Image URL validation (if provided)
    if (data.imageUrl && data.imageUrl.length > 0) {
      try {
        new URL(data.imageUrl);
      } catch {
        errors.push('Image URL is not a valid URL');
      }
    }

    if (errors.length > 0) {
      throw new AppError(
        `Row ${rowNumber} validation failed: ${errors.join(', ')}`,
        400
      );
    }
  }

  /**
   * Get sample Excel template data
   */
  static getSampleTemplate(): ProjectImportData[] {
    return [
      {
        title: 'Green Energy Farm',
        description:
          'Solar energy farm project in rural Brazil providing clean energy to 500 homes',
        category: 'Energy',
        minInvestment: 1000,
        roiPercent: 15,
        targetAmount: 500000,
        fundedAmount: 0,
        durationMonths: 36,
        status: 'active',
        imageUrl: 'https://example.com/images/solar-farm.jpg',
      },
      {
        title: 'Tech Startup Series A',
        description:
          'AI-powered financial technology platform expanding to Latin America',
        category: 'Technology',
        minInvestment: 5000,
        roiPercent: 25,
        targetAmount: 2000000,
        fundedAmount: 0,
        durationMonths: 24,
        status: 'active',
        imageUrl: 'https://example.com/images/tech-startup.jpg',
      },
    ];
  }
}

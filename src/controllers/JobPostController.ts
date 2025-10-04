import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { JobPostService } from '../services/JobPostService';
import { ApiResponse, JobPostRequest, JobPostResponse } from '../types';
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';

export class JobPostController {
  private static readonly logger = new Logger('JobPostController');

  public static async getJobPosts(
    req: Request,
    res: Response<ApiResponse<JobPostResponse[]>>,
    next: NextFunction
  ): Promise<void> {
    try {
      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ErrorHandler.handleValidationError(res, errors);
      }

      const { page = 1, limit = 10, status, department, location, type, search } = req.query;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      // Business logic
      const result = await JobPostService.getJobPosts({
        tenantId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: {
          status: status as string,
          department: department as string,
          location: location as string,
          type: type as string
        },
        search: search as string
      });
      
      // Response
      res.status(200).json({
        success: true,
        data: result.jobPosts,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        },
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job posts retrieved successfully', { 
        userId: req.user?.id,
        tenantId,
        count: result.jobPosts.length
      });
    } catch (error) {
      this.logger.error('Error retrieving job posts', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async getJobPostById(
    req: Request,
    res: Response<ApiResponse<JobPostResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ErrorHandler.handleValidationError(res, errors);
      }

      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const result = await JobPostService.getJobPostById(id, tenantId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post retrieved successfully', { 
        userId: req.user?.id,
        jobPostId: id,
        tenantId
      });
    } catch (error) {
      this.logger.error('Error retrieving job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async createJobPost(
    req: Request<{}, JobPostResponse, JobPostRequest>,
    res: Response<ApiResponse<JobPostResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ErrorHandler.handleValidationError(res, errors);
      }

      const tenantId = req.user?.tenantId;
      const createdBy = req.user?.id;

      if (!tenantId || !createdBy) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      const jobPostData = {
        ...req.body,
        tenantId,
        createdBy
      };

      const result = await JobPostService.createJobPost(jobPostData);
      
      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post created successfully', { 
        userId: createdBy,
        tenantId,
        jobPostId: result._id
      });
    } catch (error) {
      this.logger.error('Error creating job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async updateJobPost(
    req: Request,
    res: Response<ApiResponse<JobPostResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ErrorHandler.handleValidationError(res, errors);
      }

      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      const result = await JobPostService.updateJobPost(id, req.body, tenantId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post updated successfully', { 
        userId,
        tenantId,
        jobPostId: id
      });
    } catch (error) {
      this.logger.error('Error updating job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async deleteJobPost(
    req: Request,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ErrorHandler.handleValidationError(res, errors);
      }

      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      await JobPostService.deleteJobPost(id, tenantId, userId);
      
      res.status(200).json({
        success: true,
        data: null,
        message: 'Job post deleted successfully',
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post deleted successfully', { 
        userId,
        tenantId,
        jobPostId: id
      });
    } catch (error) {
      this.logger.error('Error deleting job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async likeJobPost(
    req: Request,
    res: Response<ApiResponse<{ likes: number; isLiked: boolean }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      const result = await JobPostService.likeJobPost(id, tenantId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post liked successfully', { 
        userId,
        tenantId,
        jobPostId: id
      });
    } catch (error) {
      this.logger.error('Error liking job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async commentJobPost(
    req: Request,
    res: Response<ApiResponse<{ comments: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      const result = await JobPostService.commentJobPost(id, comment, tenantId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post commented successfully', { 
        userId,
        tenantId,
        jobPostId: id
      });
    } catch (error) {
      this.logger.error('Error commenting job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async shareJobPost(
    req: Request,
    res: Response<ApiResponse<{ shares: number }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and User ID are required'
        });
      }

      const result = await JobPostService.shareJobPost(id, tenantId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post shared successfully', { 
        userId,
        tenantId,
        jobPostId: id
      });
    } catch (error) {
      this.logger.error('Error sharing job post', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }

  public static async getJobPostStats(
    req: Request,
    res: Response<ApiResponse<Record<string, number>>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const result = await JobPostService.getJobPostStats(tenantId);
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

      this.logger.info('Job post statistics retrieved successfully', { 
        userId: req.user?.id,
        tenantId
      });
    } catch (error) {
      this.logger.error('Error retrieving job post statistics', error);
      return ErrorHandler.handleServerError(res, error as Error);
    }
  }
}

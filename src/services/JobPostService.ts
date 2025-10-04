import { JobPost, IJobPost } from '../models/JobPost';
import { Logger } from '../utils/Logger';

export class JobPostService {
  private static readonly logger = new Logger('JobPostService');

  public static async getJobPosts(params: {
    tenantId: string;
    page: number;
    limit: number;
    filters: {
      status?: string;
      department?: string;
      location?: string;
      type?: string;
    };
    search?: string;
  }): Promise<{
    jobPosts: IJobPost[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    try {
      const { tenantId, page, limit, filters, search } = params;
      
      // Build query
      const query: any = { tenantId };
      
      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }
      
      if (filters.department && filters.department !== 'all') {
        query.department = filters.department;
      }
      
      if (filters.location && filters.location !== 'all') {
        query.location = filters.location;
      }
      
      if (filters.type && filters.type !== 'all') {
        query.type = filters.type;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { requirements: { $regex: search, $options: 'i' } },
          { skills: { $in: [new RegExp(search, 'i')] } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Get total count
      const total = await JobPost.countDocuments(query);
      
      // Get job posts with pagination
      const jobPosts = await JobPost.find(query)
        .populate('createdBy', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        jobPosts,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error getting job posts', error);
      throw error;
    }
  }

  public static async getJobPostById(id: string, tenantId: string): Promise<IJobPost> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId })
        .populate('createdBy', 'firstName lastName email avatar department position');
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Increment views
      await jobPost.incrementViews();
      
      return jobPost;
    } catch (error) {
      this.logger.error('Error getting job post by ID', error);
      throw error;
    }
  }

  public static async createJobPost(data: any): Promise<IJobPost> {
    try {
      // Validate business rules
      if (data.applicationDeadline && new Date(data.applicationDeadline) < new Date()) {
        throw new Error('Application deadline cannot be in the past');
      }
      
      if (data.startDate && data.applicationDeadline && new Date(data.startDate) < new Date(data.applicationDeadline)) {
        throw new Error('Start date cannot be before application deadline');
      }
      
      const jobPost = new JobPost(data);
      await jobPost.save();
      
      this.logger.info('Job post created successfully', { 
        jobPostId: jobPost._id,
        tenantId: data.tenantId,
        createdBy: data.createdBy
      });
      
      return jobPost;
    } catch (error) {
      this.logger.error('Error creating job post', error);
      throw error;
    }
  }

  public static async updateJobPost(
    id: string, 
    data: any, 
    tenantId: string, 
    userId: string
  ): Promise<IJobPost> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId });
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Check permissions (only creator, admin, or trainer can update)
      if (jobPost.createdBy.toString() !== userId) {
        // TODO: Add role-based permission check here
        // For now, allow if user is admin or trainer
        throw new Error('Unauthorized to update this job post');
      }
      
      // Update fields
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          jobPost[key] = data[key];
        }
      });
      
      await jobPost.save();
      
      this.logger.info('Job post updated successfully', { 
        jobPostId: id,
        tenantId,
        userId
      });
      
      return jobPost;
    } catch (error) {
      this.logger.error('Error updating job post', error);
      throw error;
    }
  }

  public static async deleteJobPost(
    id: string, 
    tenantId: string, 
    userId: string
  ): Promise<void> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId });
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Check permissions (only creator, admin, or trainer can delete)
      if (jobPost.createdBy.toString() !== userId) {
        // TODO: Add role-based permission check here
        // For now, allow if user is admin or trainer
        throw new Error('Unauthorized to delete this job post');
      }
      
      await JobPost.findByIdAndDelete(id);
      
      this.logger.info('Job post deleted successfully', { 
        jobPostId: id,
        tenantId,
        userId
      });
    } catch (error) {
      this.logger.error('Error deleting job post', error);
      throw error;
    }
  }

  public static async likeJobPost(
    id: string, 
    tenantId: string, 
    userId: string
  ): Promise<{ likes: number; isLiked: boolean }> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId });
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Increment likes
      await jobPost.incrementLikes();
      
      // TODO: Implement user-specific like tracking
      // For now, we'll assume the user can like multiple times
      const isLiked = true;
      
      return {
        likes: jobPost.likes,
        isLiked
      };
    } catch (error) {
      this.logger.error('Error liking job post', error);
      throw error;
    }
  }

  public static async commentJobPost(
    id: string, 
    comment: string, 
    tenantId: string, 
    userId: string
  ): Promise<{ comments: number }> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId });
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Increment comments
      await jobPost.incrementComments();
      
      // TODO: Implement actual comment storage
      // For now, we'll just increment the counter
      
      return {
        comments: jobPost.comments
      };
    } catch (error) {
      this.logger.error('Error commenting job post', error);
      throw error;
    }
  }

  public static async shareJobPost(
    id: string, 
    tenantId: string, 
    userId: string
  ): Promise<{ shares: number }> {
    try {
      const jobPost = await JobPost.findOne({ _id: id, tenantId });
      
      if (!jobPost) {
        throw new Error('Job post not found');
      }
      
      // Increment shares
      await jobPost.incrementShares();
      
      return {
        shares: jobPost.shares
      };
    } catch (error) {
      this.logger.error('Error sharing job post', error);
      throw error;
    }
  }

  public static async getJobPostStats(tenantId: string): Promise<Record<string, number>> {
    try {
      const stats = await JobPost.getStatistics(tenantId);
      return stats;
    } catch (error) {
      this.logger.error('Error getting job post statistics', error);
      throw error;
    }
  }

  public static async searchJobPosts(
    tenantId: string, 
    query: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{
    jobPosts: IJobPost[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    try {
      const jobPosts = await JobPost.searchJobPosts(tenantId, query);
      
      const total = jobPosts.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobPosts = jobPosts.slice(startIndex, endIndex);
      const totalPages = Math.ceil(total / limit);
      
      return {
        jobPosts: paginatedJobPosts,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error searching job posts', error);
      throw error;
    }
  }
}

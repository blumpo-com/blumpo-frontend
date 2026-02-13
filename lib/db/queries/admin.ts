import { eq, and, desc, sql, count, gte, lte, like, or, inArray } from 'drizzle-orm';
import { db } from '../drizzle';
import { 
  user, 
  tokenAccount, 
  brand, 
  generationJob, 
  adImage,
  n8nWorkflowErrors,
  subscriptionPlan,
  topupPlan,
  generationPricing,
  UserRole,
  JobStatus
} from '../schema/index';

// ==================== Users ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  banned?: boolean;
}

export interface UsersResult {
  users: Array<{
    id: string;
    email: string;
    displayName: string | null;
    photoUrl: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
    banFlag: boolean;
    role: UserRole;
    tokenAccount: {
      balance: number;
      planCode: string;
      subscriptionStatus: string | null;
    } | null;
    brandsCount: number;
    jobsCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllUsers(
  params: PaginationParams & { filters?: UserFilters } = {}
): Promise<UsersResult> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;
  const filters = params.filters || {};

  // Build conditions
  const conditions = [];
  
  if (filters.search) {
    conditions.push(
      or(
        like(user.email, `%${filters.search}%`),
        like(user.displayName, `%${filters.search}%`)
      )!
    );
  }
  
  if (filters.role) {
    conditions.push(eq(user.role, filters.role));
  }
  
  if (filters.banned !== undefined) {
    conditions.push(eq(user.banFlag, filters.banned));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(user)
    .where(whereClause);
  const total = Number(totalResult[0]?.count || 0);

  // Get users with related data
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      banFlag: user.banFlag,
      role: user.role,
    })
    .from(user)
    .where(whereClause)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  // Get token accounts and counts for each user
  const userIds = users.map(u => u.id);
  
  const tokenAccounts = userIds.length > 0 ? await db
    .select({
      userId: tokenAccount.userId,
      balance: tokenAccount.balance,
      planCode: tokenAccount.planCode,
      subscriptionStatus: tokenAccount.subscriptionStatus,
    })
    .from(tokenAccount)
    .where(inArray(tokenAccount.userId, userIds)) : [];

  const brandsCounts = userIds.length > 0 ? await db
    .select({
      userId: brand.userId,
      count: count(),
    })
    .from(brand)
    .where(inArray(brand.userId, userIds))
    .groupBy(brand.userId) : [];

  const jobsCounts = userIds.length > 0 ? await db
    .select({
      userId: generationJob.userId,
      count: count(),
    })
    .from(generationJob)
    .where(inArray(generationJob.userId, userIds))
    .groupBy(generationJob.userId) : [];

  // Combine data
  const usersWithDetails = users.map(u => {
    const tokenAcc = tokenAccounts.find(ta => ta.userId === u.id);
    const brandsCount = brandsCounts.find(bc => bc.userId === u.id);
    const jobsCount = jobsCounts.find(jc => jc.userId === u.id);

    return {
      ...u,
      tokenAccount: tokenAcc ? {
        balance: Number(tokenAcc.balance),
        planCode: tokenAcc.planCode,
        subscriptionStatus: tokenAcc.subscriptionStatus,
      } : null,
      brandsCount: Number(brandsCount?.count || 0),
      jobsCount: Number(jobsCount?.count || 0),
    };
  });

  return {
    users: usersWithDetails,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserWithDetails(userId: string) {
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userData.length === 0) {
    return null;
  }

  const tokenAcc = await db
    .select()
    .from(tokenAccount)
    .where(eq(tokenAccount.userId, userId))
    .limit(1);

  const brandsCount = await db
    .select({ count: count() })
    .from(brand)
    .where(eq(brand.userId, userId));

  const jobsCount = await db
    .select({ count: count() })
    .from(generationJob)
    .where(eq(generationJob.userId, userId));

  return {
    ...userData[0],
    tokenAccount: tokenAcc[0] || null,
    brandsCount: Number(brandsCount[0]?.count || 0),
    jobsCount: Number(jobsCount[0]?.count || 0),
  };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const result = await db
    .update(user)
    .set({ role })
    .where(eq(user.id, userId))
    .returning();

  return result[0] || null;
}

export async function updateUserBanStatus(userId: string, banned: boolean) {
  const result = await db
    .update(user)
    .set({ banFlag: banned })
    .where(eq(user.id, userId))
    .returning();

  return result[0] || null;
}

// ==================== Brands ====================

export interface BrandsResult {
  brands: Array<{
    id: string;
    name: string;
    websiteUrl: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    userEmail: string;
    userDisplayName: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllBrands(
  params: PaginationParams & { search?: string } = {}
): Promise<BrandsResult> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(brand.isDeleted, false)];
  
  if (params.search) {
    conditions.push(
      or(
        like(brand.name, `%${params.search}%`),
        like(brand.websiteUrl, `%${params.search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(brand)
    .where(whereClause);
  const total = Number(totalResult[0]?.count || 0);

  // Get brands with user info
  const brands = await db
    .select({
      id: brand.id,
      name: brand.name,
      websiteUrl: brand.websiteUrl,
      userId: brand.userId,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
      userEmail: user.email,
      userDisplayName: user.displayName,
    })
    .from(brand)
    .innerJoin(user, eq(brand.userId, user.id))
    .where(whereClause)
    .orderBy(desc(brand.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    brands,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== Generation Jobs ====================

export interface JobFilters {
  status?: JobStatus;
  userId?: string;
  brandId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface JobsResult {
  jobs: Array<{
    id: string;
    userId: string;
    brandId: string | null;
    status: JobStatus;
    tokensCost: number;
    createdAt: Date;
    completedAt: Date | null;
    userEmail: string;
    brandName: string | null;
    imagesCount: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllJobs(
  params: PaginationParams & { filters?: JobFilters } = {}
): Promise<JobsResult> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;
  const filters = params.filters || {};

  const conditions = [];
  
  if (filters.status) {
    conditions.push(eq(generationJob.status, filters.status));
  }
  
  if (filters.userId) {
    conditions.push(eq(generationJob.userId, filters.userId));
  }
  
  if (filters.brandId) {
    conditions.push(eq(generationJob.brandId, filters.brandId));
  }
  
  if (filters.dateFrom) {
    conditions.push(gte(generationJob.createdAt, filters.dateFrom));
  }
  
  if (filters.dateTo) {
    conditions.push(lte(generationJob.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(generationJob)
    .where(whereClause);
  const total = Number(totalResult[0]?.count || 0);

  // Get jobs with related data
  const jobs = await db
    .select({
      id: generationJob.id,
      userId: generationJob.userId,
      brandId: generationJob.brandId,
      status: generationJob.status,
      tokensCost: generationJob.tokensCost,
      createdAt: generationJob.createdAt,
      completedAt: generationJob.completedAt,
      userEmail: user.email,
      brandName: brand.name,
    })
    .from(generationJob)
    .leftJoin(user, eq(generationJob.userId, user.id))
    .leftJoin(brand, eq(generationJob.brandId, brand.id))
    .where(whereClause)
    .orderBy(desc(generationJob.createdAt))
    .limit(limit)
    .offset(offset);

  // Get image counts
  const jobIds = jobs.map(j => j.id);
  const imageCounts = jobIds.length > 0 ? await db
    .select({
      jobId: adImage.jobId,
      count: count(),
    })
    .from(adImage)
    .where(inArray(adImage.jobId, jobIds))
    .groupBy(adImage.jobId) : [];

  const jobsWithDetails = jobs.map(job => {
    const imageCount = imageCounts.find(ic => ic.jobId === job.id);
    return {
      ...job,
      imagesCount: Number(imageCount?.count || 0),
    };
  });

  return {
    jobs: jobsWithDetails,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== Analytics ====================

export interface AdminStats {
  totalUsers: number;
  totalBrands: number;
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  totalTokensUsed: number;
  totalErrors: number;
  unresolvedErrors: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalBrands,
    totalJobs,
    activeJobs,
    failedJobs,
    totalTokensUsed,
    totalErrors,
    unresolvedErrors,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(brand).where(eq(brand.isDeleted, false)),
    db.select({ count: count() }).from(generationJob),
    db.select({ count: count() }).from(generationJob).where(
      or(
        eq(generationJob.status, JobStatus.QUEUED),
        eq(generationJob.status, JobStatus.RUNNING)
      )!
    ),
    db.select({ count: count() }).from(generationJob).where(eq(generationJob.status, JobStatus.FAILED)),
    db.select({ total: sql<number>`COALESCE(SUM(${generationJob.tokensCost}), 0)` }).from(generationJob),
    db.select({ count: count() }).from(n8nWorkflowErrors),
    db.select({ count: count() }).from(n8nWorkflowErrors).where(eq(n8nWorkflowErrors.isResolved, false)),
  ]);

  return {
    totalUsers: Number(totalUsers[0]?.count || 0),
    totalBrands: Number(totalBrands[0]?.count || 0),
    totalJobs: Number(totalJobs[0]?.count || 0),
    activeJobs: Number(activeJobs[0]?.count || 0),
    failedJobs: Number(failedJobs[0]?.count || 0),
    totalTokensUsed: Number(totalTokensUsed[0]?.total || 0),
    totalErrors: Number(totalErrors[0]?.count || 0),
    unresolvedErrors: Number(unresolvedErrors[0]?.count || 0),
  };
}

// ==================== Workflow Errors ====================

export interface WorkflowErrorFilters {
  workflowId?: string;
  nodeId?: string;
  errorLevel?: string;
  isResolved?: boolean;
}

export interface WorkflowErrorsResult {
  errors: Array<typeof n8nWorkflowErrors.$inferSelect>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getWorkflowErrors(
  params: PaginationParams & { filters?: WorkflowErrorFilters } = {}
): Promise<WorkflowErrorsResult> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;
  const filters = params.filters || {};

  const conditions = [];
  
  if (filters.workflowId) {
    conditions.push(eq(n8nWorkflowErrors.workflowId, filters.workflowId));
  }
  
  if (filters.nodeId) {
    conditions.push(eq(n8nWorkflowErrors.nodeId, filters.nodeId));
  }
  
  if (filters.errorLevel) {
    conditions.push(eq(n8nWorkflowErrors.errorLevel, filters.errorLevel));
  }
  
  if (filters.isResolved !== undefined) {
    conditions.push(eq(n8nWorkflowErrors.isResolved, filters.isResolved));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(n8nWorkflowErrors)
    .where(whereClause);
  const total = Number(totalResult[0]?.count || 0);

  // Get errors
  const errors = await db
    .select()
    .from(n8nWorkflowErrors)
    .where(whereClause)
    .orderBy(desc(n8nWorkflowErrors.lastSeenAt))
    .limit(limit)
    .offset(offset);

  return {
    errors,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markErrorResolved(
  errorId: number,
  resolvedBy: string,
  resolutionNote?: string
) {
  const result = await db
    .update(n8nWorkflowErrors)
    .set({
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNote: resolutionNote || null,
    })
    .where(eq(n8nWorkflowErrors.id, errorId))
    .returning();

  return result[0] || null;
}

// ==================== Subscriptions ====================

export async function getAllSubscriptionPlans() {
  return await db
    .select()
    .from(subscriptionPlan)
    .orderBy(subscriptionPlan.sortOrder);
}

export async function getAllTopupPlans() {
  return await db
    .select()
    .from(topupPlan)
    .orderBy(topupPlan.sortOrder);
}

export async function getAllGenerationPricing() {
  return await db
    .select()
    .from(generationPricing)
    .orderBy(generationPricing.createdAt);
}

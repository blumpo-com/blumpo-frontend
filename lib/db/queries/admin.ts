import { eq, and, desc, sql, count, gte, lte, like, or, inArray } from 'drizzle-orm';
import { db } from '../drizzle';
import { 
  user, 
  tokenAccount,
  tokenLedger,
  brand, 
  generationJob, 
  adImage,
  n8nWorkflowErrors,
  n8nWorkflowErrorOccurrences,
  subscriptionPlan,
  topupPlan,
  generationPricing,
  adArchetype,
  adWorkflow,
  adEvent,
  brandInsights,
  brandExtractionStatus,
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
      role: u.role as UserRole,
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
      status: job.status as JobStatus,
      userEmail: job.userEmail || '',
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
  activeSubscriptions: number;
  avgTokensPerUser: number;
  avgJobsPerUser: number;
  mostPopularArchetype: string | null;
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
    activeSubscriptions,
    avgTokensPerUser,
    jobStats,
    mostPopularArchetype,
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
    db.select({ count: count() }).from(tokenAccount).where(
      or(
        eq(tokenAccount.subscriptionStatus, 'active'),
        eq(tokenAccount.subscriptionStatus, 'trialing')
      )!
    ),
    db.select({ avg: sql<number>`COALESCE(AVG(${tokenAccount.balance}), 0)` }).from(tokenAccount),
    db.select({ 
      totalJobs: sql<number>`COUNT(${generationJob.id})`,
      uniqueUsers: sql<number>`COUNT(DISTINCT ${generationJob.userId})`
    }).from(generationJob),
    db.select({
      archetypeCode: generationJob.archetypeCode,
      count: count(),
    })
      .from(generationJob)
      .where(sql`${generationJob.archetypeCode} IS NOT NULL`)
      .groupBy(generationJob.archetypeCode)
      .orderBy(desc(count()))
      .limit(1),
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
    activeSubscriptions: Number(activeSubscriptions[0]?.count || 0),
    avgTokensPerUser: Number(avgTokensPerUser[0]?.avg || 0),
    avgJobsPerUser: (() => {
      const stats = jobStats[0];
      const uniqueUsers = Number(stats?.uniqueUsers || 0);
      const totalJobs = Number(stats?.totalJobs || 0);
      return uniqueUsers > 0 ? totalJobs / uniqueUsers : 0;
    })(),
    mostPopularArchetype: mostPopularArchetype[0]?.archetypeCode || null,
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

// ==================== Chart Data Queries ====================

export interface UserGrowthDataPoint {
  date: string;
  count: number;
}

export async function getUserGrowthData(days: number = 30): Promise<UserGrowthDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`DATE(${user.createdAt})`,
      count: count(),
    })
    .from(user)
    .where(gte(user.createdAt, startDate))
    .groupBy(sql`DATE(${user.createdAt})`)
    .orderBy(sql`DATE(${user.createdAt})`);

  return results.map(r => ({
    date: r.date,
    count: Number(r.count || 0),
  }));
}

export interface TokenUsageDataPoint {
  date: string;
  credits: number;
  debits: number;
  net: number;
}

export async function getTokenUsageData(days: number = 30): Promise<TokenUsageDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`DATE(${tokenLedger.occurredAt})`,
      credits: sql<number>`COALESCE(SUM(CASE WHEN ${tokenLedger.delta} > 0 THEN ${tokenLedger.delta} ELSE 0 END), 0)`,
      debits: sql<number>`COALESCE(SUM(CASE WHEN ${tokenLedger.delta} < 0 THEN ABS(${tokenLedger.delta}) ELSE 0 END), 0)`,
      net: sql<number>`COALESCE(SUM(${tokenLedger.delta}), 0)`,
    })
    .from(tokenLedger)
    .where(gte(tokenLedger.occurredAt, startDate))
    .groupBy(sql`DATE(${tokenLedger.occurredAt})`)
    .orderBy(sql`DATE(${tokenLedger.occurredAt})`);

  return results.map(r => ({
    date: r.date,
    credits: Number(r.credits || 0),
    debits: Number(r.debits || 0),
    net: Number(r.net || 0),
  }));
}

export interface JobStatusDataPoint {
  status: string;
  count: number;
}

export async function getJobStatusDistribution(): Promise<JobStatusDataPoint[]> {
  const results = await db
    .select({
      status: generationJob.status,
      count: count(),
    })
    .from(generationJob)
    .groupBy(generationJob.status)
    .orderBy(generationJob.status);

  return results.map(r => ({
    status: r.status,
    count: Number(r.count || 0),
  }));
}

export interface JobsOverTimeDataPoint {
  date: string;
  count: number;
  succeeded: number;
  failed: number;
}

export async function getJobsOverTime(days: number = 30): Promise<JobsOverTimeDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`DATE(${generationJob.createdAt})`,
      count: count(),
      succeeded: sql<number>`COUNT(CASE WHEN ${generationJob.status} = 'SUCCEEDED' THEN 1 END)`,
      failed: sql<number>`COUNT(CASE WHEN ${generationJob.status} = 'FAILED' THEN 1 END)`,
    })
    .from(generationJob)
    .where(gte(generationJob.createdAt, startDate))
    .groupBy(sql`DATE(${generationJob.createdAt})`)
    .orderBy(sql`DATE(${generationJob.createdAt})`);

  return results.map(r => ({
    date: r.date,
    count: Number(r.count || 0),
    succeeded: Number(r.succeeded || 0),
    failed: Number(r.failed || 0),
  }));
}

export interface SubscriptionDistributionDataPoint {
  planCode: string;
  count: number;
}

export async function getSubscriptionDistribution(): Promise<SubscriptionDistributionDataPoint[]> {
  const results = await db
    .select({
      planCode: tokenAccount.planCode,
      count: count(),
    })
    .from(tokenAccount)
    .groupBy(tokenAccount.planCode)
    .orderBy(desc(count()));

  return results.map(r => ({
    planCode: r.planCode,
    count: Number(r.count || 0),
  }));
}

export interface RecentActivityItem {
  type: 'user' | 'job' | 'error';
  description: string;
  timestamp: Date;
  link?: string;
}

export async function getRecentActivity(limit: number = 15): Promise<RecentActivityItem[]> {
  const [recentUsers, recentJobs, recentErrors] = await Promise.all([
    db
      .select({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5),
    db
      .select({
        id: generationJob.id,
        status: generationJob.status,
        createdAt: generationJob.createdAt,
      })
      .from(generationJob)
      .orderBy(desc(generationJob.createdAt))
      .limit(5),
    db
      .select({
        id: n8nWorkflowErrors.id,
        workflowName: n8nWorkflowErrors.workflowName,
        errorMessage: n8nWorkflowErrors.errorMessage,
        lastSeenAt: n8nWorkflowErrors.lastSeenAt,
      })
      .from(n8nWorkflowErrors)
      .where(eq(n8nWorkflowErrors.isResolved, false))
      .orderBy(desc(n8nWorkflowErrors.lastSeenAt))
      .limit(5),
  ]);

  const activities: RecentActivityItem[] = [
    ...recentUsers.map(u => ({
      type: 'user' as const,
      description: `New user registered: ${u.email}`,
      timestamp: u.createdAt,
      link: `/admin/users/${u.id}`,
    })),
    ...recentJobs.map(j => ({
      type: 'job' as const,
      description: `Job ${j.status.toLowerCase()}: ${j.id.slice(0, 8)}...`,
      timestamp: j.createdAt,
      link: `/admin/jobs`,
    })),
    ...recentErrors.map(e => ({
      type: 'error' as const,
      description: `Error in ${e.workflowName || 'workflow'}: ${e.errorMessage?.slice(0, 50)}...`,
      timestamp: e.lastSeenAt,
      link: `/admin/workflow-errors`,
    })),
  ];

  // Sort by timestamp descending and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// ==================== Related Entity Queries ====================

// User related entities
export async function getUserBrands(userId: string, limit: number = 10) {
  return await db
    .select({
      id: brand.id,
      name: brand.name,
      websiteUrl: brand.websiteUrl,
      createdAt: brand.createdAt,
    })
    .from(brand)
    .where(and(eq(brand.userId, userId), eq(brand.isDeleted, false)))
    .orderBy(desc(brand.createdAt))
    .limit(limit);
}

export async function getUserJobs(userId: string, limit: number = 10) {
  return await db
    .select({
      id: generationJob.id,
      status: generationJob.status,
      createdAt: generationJob.createdAt,
      tokensCost: generationJob.tokensCost,
      brandId: generationJob.brandId,
    })
    .from(generationJob)
    .where(eq(generationJob.userId, userId))
    .orderBy(desc(generationJob.createdAt))
    .limit(limit);
}

export async function getUserAdImages(userId: string, limit: number = 10) {
  return await db
    .select({
      id: adImage.id,
      title: adImage.title,
      createdAt: adImage.createdAt,
      publicUrl: adImage.publicUrl,
      brandId: adImage.brandId,
      jobId: adImage.jobId,
    })
    .from(adImage)
    .where(and(eq(adImage.userId, userId), eq(adImage.isDeleted, false)))
    .orderBy(desc(adImage.createdAt))
    .limit(limit);
}

export async function getUserTokenLedger(userId: string, limit: number = 10) {
  return await db
    .select({
      id: tokenLedger.id,
      occurredAt: tokenLedger.occurredAt,
      delta: tokenLedger.delta,
      reason: tokenLedger.reason,
      referenceId: tokenLedger.referenceId,
      balanceAfter: tokenLedger.balanceAfter,
    })
    .from(tokenLedger)
    .where(eq(tokenLedger.userId, userId))
    .orderBy(desc(tokenLedger.occurredAt))
    .limit(limit);
}

// Brand related entities
export async function getBrandWithFullDetails(brandId: string) {
  const brandData = await db
    .select()
    .from(brand)
    .where(and(eq(brand.id, brandId), eq(brand.isDeleted, false)))
    .limit(1);

  if (brandData.length === 0) {
    return null;
  }

  const [userData, insights, extractionStatus, jobsCount, imagesCount] = await Promise.all([
    db
      .select({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      })
      .from(user)
      .where(eq(user.id, brandData[0].userId))
      .limit(1),
    db
      .select()
      .from(brandInsights)
      .where(eq(brandInsights.brandId, brandId))
      .limit(1),
    db
      .select()
      .from(brandExtractionStatus)
      .where(eq(brandExtractionStatus.brandId, brandId))
      .limit(1),
    db
      .select({ count: count() })
      .from(generationJob)
      .where(eq(generationJob.brandId, brandId)),
    db
      .select({ count: count() })
      .from(adImage)
      .where(and(eq(adImage.brandId, brandId), eq(adImage.isDeleted, false))),
  ]);

  return {
    ...brandData[0],
    user: userData[0] || null,
    insights: insights[0] || null,
    extractionStatus: extractionStatus[0] || null,
    jobsCount: Number(jobsCount[0]?.count || 0),
    imagesCount: Number(imagesCount[0]?.count || 0),
  };
}

export async function getBrandJobs(brandId: string, limit: number = 10) {
  return await db
    .select({
      id: generationJob.id,
      status: generationJob.status,
      createdAt: generationJob.createdAt,
      tokensCost: generationJob.tokensCost,
      userId: generationJob.userId,
    })
    .from(generationJob)
    .where(eq(generationJob.brandId, brandId))
    .orderBy(desc(generationJob.createdAt))
    .limit(limit);
}

export async function getBrandAdImages(brandId: string, limit: number = 10) {
  return await db
    .select({
      id: adImage.id,
      title: adImage.title,
      createdAt: adImage.createdAt,
      publicUrl: adImage.publicUrl,
      jobId: adImage.jobId,
      userId: adImage.userId,
    })
    .from(adImage)
    .where(eq(adImage.brandId, brandId))
    .orderBy(desc(adImage.createdAt))
    .limit(limit);
}

// Job related entities
export async function getJobWithFullDetails(jobId: string) {
  const jobData = await db
    .select()
    .from(generationJob)
    .where(eq(generationJob.id, jobId))
    .limit(1);

  if (jobData.length === 0) {
    return null;
  }

  const job = jobData[0];
  const [userData, brandData, archetypeData, ledgerData, imagesCount] = await Promise.all([
    db
      .select({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      })
      .from(user)
      .where(eq(user.id, job.userId))
      .limit(1),
    job.brandId
      ? db
          .select({
            id: brand.id,
            name: brand.name,
            websiteUrl: brand.websiteUrl,
          })
          .from(brand)
          .where(eq(brand.id, job.brandId))
          .limit(1)
      : Promise.resolve([]),
    job.archetypeCode
      ? db
          .select()
          .from(adArchetype)
          .where(eq(adArchetype.code, job.archetypeCode))
          .limit(1)
      : Promise.resolve([]),
    job.ledgerId
      ? db
          .select()
          .from(tokenLedger)
          .where(eq(tokenLedger.id, job.ledgerId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ count: count() })
      .from(adImage)
      .where(eq(adImage.jobId, jobId)),
  ]);

  return {
    ...job,
    user: userData[0] || null,
    brand: brandData[0] || null,
    archetype: archetypeData[0] || null,
    ledgerEntry: ledgerData[0] || null,
    imagesCount: Number(imagesCount[0]?.count || 0),
  };
}

export async function getJobAdImages(jobId: string) {
  return await db
    .select({
      id: adImage.id,
      title: adImage.title,
      createdAt: adImage.createdAt,
      publicUrl: adImage.publicUrl,
      brandId: adImage.brandId,
      userId: adImage.userId,
    })
    .from(adImage)
    .where(and(eq(adImage.jobId, jobId)))
    .orderBy(desc(adImage.createdAt));
}

// Ad Image related entities
export async function getAdImageWithFullDetails(imageId: string) {
  const imageData = await db
    .select()
    .from(adImage)
    .where(eq(adImage.id, imageId))
    .limit(1);

  if (imageData.length === 0) {
    return null;
  }

  const image = imageData[0];
  const [userData, brandData, jobData, workflowData, eventsCount] = await Promise.all([
    db
      .select({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      })
      .from(user)
      .where(eq(user.id, image.userId))
      .limit(1),
    image.brandId
      ? db
          .select({
            id: brand.id,
            name: brand.name,
            websiteUrl: brand.websiteUrl,
          })
          .from(brand)
          .where(eq(brand.id, image.brandId))
          .limit(1)
      : Promise.resolve([]),
    image.jobId
      ? db
          .select({
            id: generationJob.id,
            status: generationJob.status,
            createdAt: generationJob.createdAt,
          })
          .from(generationJob)
          .where(eq(generationJob.id, image.jobId))
          .limit(1)
      : Promise.resolve([]),
    image.workflowId
      ? db
          .select()
          .from(adWorkflow)
          .where(eq(adWorkflow.id, image.workflowId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ count: count() })
      .from(adEvent)
      .where(eq(adEvent.adImageId, imageId)),
  ]);

  return {
    ...image,
    user: userData[0] || null,
    brand: brandData[0] || null,
    job: jobData[0] || null,
    workflow: workflowData[0] || null,
    eventsCount: Number(eventsCount[0]?.count || 0),
  };
}

export async function getAdImageEvents(imageId: string, limit: number = 10) {
  return await db
    .select({
      id: adEvent.id,
      eventType: adEvent.eventType,
      eventSource: adEvent.eventSource,
      createdAt: adEvent.createdAt,
      metadata: adEvent.metadata,
    })
    .from(adEvent)
    .where(eq(adEvent.adImageId, imageId))
    .orderBy(desc(adEvent.createdAt))
    .limit(limit);
}

// Workflow Error related entities
export async function getWorkflowErrorWithOccurrences(errorId: number) {
  const errorData = await db
    .select()
    .from(n8nWorkflowErrors)
    .where(eq(n8nWorkflowErrors.id, errorId))
    .limit(1);

  if (errorData.length === 0) {
    return null;
  }

  const occurrences = await db
    .select()
    .from(n8nWorkflowErrorOccurrences)
    .where(eq(n8nWorkflowErrorOccurrences.errorId, errorId))
    .orderBy(desc(n8nWorkflowErrorOccurrences.occurredAt))
    .limit(50);

  return {
    ...errorData[0],
    occurrences,
  };
}

// ==================== Ad Images ====================

export interface AdImagesResult {
  adImages: Array<{
    id: string;
    title: string | null;
    userId: string;
    brandId: string | null;
    jobId: string;
    createdAt: Date;
    publicUrl: string | null;
    width: number;
    height: number;
    format: string;
    banFlag: boolean;
    errorFlag: boolean;
    isDeleted: boolean;
    userEmail: string;
    userDisplayName: string | null;
    brandName: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllAdImages(
  params: PaginationParams & { userId?: string; brandId?: string; jobId?: string } = {}
): Promise<AdImagesResult> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  const conditions = [eq(adImage.isDeleted, false)];

  if (params.userId) {
    conditions.push(eq(adImage.userId, params.userId));
  }

  if (params.brandId) {
    conditions.push(eq(adImage.brandId, params.brandId));
  }

  if (params.jobId) {
    conditions.push(eq(adImage.jobId, params.jobId));
  }

  const whereClause = and(...conditions);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(adImage)
    .where(whereClause);
  const total = Number(totalResult[0]?.count || 0);

  // Get ad images with user and brand info
  const adImages = await db
    .select({
      id: adImage.id,
      title: adImage.title,
      userId: adImage.userId,
      brandId: adImage.brandId,
      jobId: adImage.jobId,
      createdAt: adImage.createdAt,
      publicUrl: adImage.publicUrl,
      width: adImage.width,
      height: adImage.height,
      format: adImage.format,
      banFlag: adImage.banFlag,
      errorFlag: adImage.errorFlag,
      isDeleted: adImage.isDeleted,
      userEmail: user.email,
      userDisplayName: user.displayName,
      brandName: brand.name,
    })
    .from(adImage)
    .innerJoin(user, eq(adImage.userId, user.id))
    .leftJoin(brand, eq(adImage.brandId, brand.id))
    .where(whereClause)
    .orderBy(desc(adImage.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    adImages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ==================== Ads Analytics ====================

// Jobs per archetype
export async function getArchetypeJobCounts() {
  return await db
    .select({
      archetypeCode: generationJob.archetypeCode,
      count: count(),
      displayName: adArchetype.displayName,
    })
    .from(generationJob)
    .leftJoin(adArchetype, eq(generationJob.archetypeCode, adArchetype.code))
    .where(sql`${generationJob.archetypeCode} IS NOT NULL`)
    .groupBy(generationJob.archetypeCode, adArchetype.displayName)
    .orderBy(desc(count()));
}

// Images per archetype (via workflow)
export async function getArchetypeImageCounts() {
  return await db
    .select({
      archetypeCode: adWorkflow.archetypeCode,
      count: count(),
      displayName: adArchetype.displayName,
    })
    .from(adImage)
    .innerJoin(adWorkflow, eq(adImage.workflowId, adWorkflow.id))
    .innerJoin(adArchetype, eq(adWorkflow.archetypeCode, adArchetype.code))
    .where(eq(adImage.isDeleted, false))
    .groupBy(adWorkflow.archetypeCode, adArchetype.displayName)
    .orderBy(desc(count()));
}

// Images per workflow
export async function getWorkflowImageCounts() {
  return await db
    .select({
      workflowId: adImage.workflowId,
      count: count(),
      workflowUid: adWorkflow.workflowUid,
      variantKey: adWorkflow.variantKey,
      archetypeCode: adWorkflow.archetypeCode,
      archetypeDisplayName: adArchetype.displayName,
    })
    .from(adImage)
    .innerJoin(adWorkflow, eq(adImage.workflowId, adWorkflow.id))
    .leftJoin(adArchetype, eq(adWorkflow.archetypeCode, adArchetype.code))
    .where(eq(adImage.isDeleted, false))
    .groupBy(adImage.workflowId, adWorkflow.workflowUid, adWorkflow.variantKey, adWorkflow.archetypeCode, adArchetype.displayName)
    .orderBy(desc(count()));
}

// Actions per archetype
export async function getArchetypeActionCounts() {
  // Get archetypeCode from either direct event.archetypeCode OR from workflow.archetypeCode
  // This handles cases where events only have workflowId set but not archetypeCode
  return await db
    .select({
      archetypeCode: sql<string>`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode})`.as('archetype_code'),
      eventType: adEvent.eventType,
      count: count(),
      displayName: adArchetype.displayName,
    })
    .from(adEvent)
    .leftJoin(adWorkflow, eq(adEvent.workflowId, adWorkflow.id))
    .leftJoin(adArchetype, sql`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode}) = ${adArchetype.code}`)
    .where(sql`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode}) IS NOT NULL`)
    .groupBy(
      sql`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode})`,
      adEvent.eventType,
      adArchetype.displayName
    )
    .orderBy(
      sql`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode})`,
      adEvent.eventType
    );
}

// Actions per workflow
export async function getWorkflowActionCounts() {
  return await db
    .select({
      workflowId: adEvent.workflowId,
      eventType: adEvent.eventType,
      count: count(),
      workflowUid: adWorkflow.workflowUid,
      variantKey: adWorkflow.variantKey,
      archetypeCode: adWorkflow.archetypeCode,
      archetypeDisplayName: adArchetype.displayName,
    })
    .from(adEvent)
    .innerJoin(adWorkflow, eq(adEvent.workflowId, adWorkflow.id))
    .leftJoin(adArchetype, eq(adWorkflow.archetypeCode, adArchetype.code))
    .where(sql`${adEvent.workflowId} IS NOT NULL`)
    .groupBy(adEvent.workflowId, adEvent.eventType, adWorkflow.workflowUid, adWorkflow.variantKey, adWorkflow.archetypeCode, adArchetype.displayName)
    .orderBy(adEvent.workflowId, adEvent.eventType);
}

// Top users by action count (user engagement)
export async function getTopUsersByActions(limit: number = 10) {
  return await db
    .select({
      userId: adEvent.userId,
      totalActions: count(),
      email: user.email,
      displayName: user.displayName,
    })
    .from(adEvent)
    .innerJoin(user, eq(adEvent.userId, user.id))
    .where(sql`${adEvent.userId} IS NOT NULL`)
    .groupBy(adEvent.userId, user.email, user.displayName)
    .orderBy(desc(count()))
    .limit(limit);
}

// Action conversion/engagement rates
export async function getActionConversionRates() {
  // Get total counts for each event type
  const eventTypeCounts = await db
    .select({
      eventType: adEvent.eventType,
      count: count(),
    })
    .from(adEvent)
    .groupBy(adEvent.eventType);

  // Calculate total events
  const totalEvents = eventTypeCounts.reduce((sum, item) => sum + Number(item.count), 0);

  // Calculate engagement metrics
  const savedCount = eventTypeCounts.find(e => e.eventType === 'saved')?.count || 0;
  const downloadedCount = eventTypeCounts.find(e => e.eventType === 'downloaded')?.count || 0;
  const deletedCount = eventTypeCounts.find(e => e.eventType === 'deleted')?.count || 0;
  const restoredCount = eventTypeCounts.find(e => e.eventType === 'restored')?.count || 0;

  const positiveActions = Number(savedCount) + Number(downloadedCount);
  const engagementRate = totalEvents > 0 ? (positiveActions / totalEvents) * 100 : 0;
  const saveDownloadRatio = deletedCount > 0 ? positiveActions / Number(deletedCount) : positiveActions;
  const restoreRate = deletedCount > 0 ? (Number(restoredCount) / Number(deletedCount)) * 100 : 0;

  return {
    totalEvents,
    eventTypeCounts: eventTypeCounts.map(e => ({
      eventType: e.eventType,
      count: Number(e.count),
      percentage: totalEvents > 0 ? (Number(e.count) / totalEvents) * 100 : 0,
    })),
    engagementRate,
    saveDownloadRatio,
    restoreRate,
    positiveActions,
    deletedCount: Number(deletedCount),
  };
}

// Recent ad activity timeline
export async function getRecentAdActivity(limit: number = 50) {
  return await db
    .select({
      id: adEvent.id,
      createdAt: adEvent.createdAt,
      eventType: adEvent.eventType,
      eventSource: adEvent.eventSource,
      userId: adEvent.userId,
      userEmail: user.email,
      userDisplayName: user.displayName,
      brandId: adEvent.brandId,
      brandName: brand.name,
      jobId: adEvent.jobId,
      adImageId: adEvent.adImageId,
      archetypeCode: sql<string | null>`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode})`.as('archetype_code'),
      archetypeDisplayName: adArchetype.displayName,
      workflowId: adEvent.workflowId,
      workflowUid: adWorkflow.workflowUid,
      variantKey: adWorkflow.variantKey,
    })
    .from(adEvent)
    .leftJoin(user, eq(adEvent.userId, user.id))
    .leftJoin(brand, eq(adEvent.brandId, brand.id))
    .leftJoin(adWorkflow, eq(adEvent.workflowId, adWorkflow.id))
    .leftJoin(adArchetype, sql`COALESCE(${adEvent.archetypeCode}, ${adWorkflow.archetypeCode}) = ${adArchetype.code}`)
    .orderBy(desc(adEvent.createdAt))
    .limit(limit);
}

// ==================== Brand Extraction Status ====================

export async function getBrandExtractionStatusList(options?: {
  page?: number;
  limit?: number;
  problemsOnly?: boolean;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const offset = (page - 1) * limit;

  const hasProblem =
    or(
      sql`${brandExtractionStatus.colorsStatus} IS DISTINCT FROM 'success' AND ${brandExtractionStatus.colorsStatus} IS NOT NULL`,
      sql`${brandExtractionStatus.colorsError} IS NOT NULL`,
      sql`${brandExtractionStatus.fontsStatus} IS DISTINCT FROM 'success' AND ${brandExtractionStatus.fontsStatus} IS NOT NULL`,
      sql`${brandExtractionStatus.fontsError} IS NOT NULL`,
      sql`${brandExtractionStatus.logoStatus} IS DISTINCT FROM 'success' AND ${brandExtractionStatus.logoStatus} IS NOT NULL`,
      sql`${brandExtractionStatus.logoError} IS NOT NULL`,
      sql`${brandExtractionStatus.heroStatus} IS DISTINCT FROM 'success' AND ${brandExtractionStatus.heroStatus} IS NOT NULL`,
      sql`${brandExtractionStatus.heroError} IS NOT NULL`,
      sql`${brandExtractionStatus.insightsStatus} IS DISTINCT FROM 'success' AND ${brandExtractionStatus.insightsStatus} IS NOT NULL`,
      sql`${brandExtractionStatus.insightsError} IS NOT NULL`
    );

  const whereClause = options?.problemsOnly ? hasProblem : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: brandExtractionStatus.id,
        brandId: brandExtractionStatus.brandId,
        colorsStatus: brandExtractionStatus.colorsStatus,
        colorsError: brandExtractionStatus.colorsError,
        fontsStatus: brandExtractionStatus.fontsStatus,
        fontsError: brandExtractionStatus.fontsError,
        logoStatus: brandExtractionStatus.logoStatus,
        logoError: brandExtractionStatus.logoError,
        heroStatus: brandExtractionStatus.heroStatus,
        heroError: brandExtractionStatus.heroError,
        insightsStatus: brandExtractionStatus.insightsStatus,
        insightsError: brandExtractionStatus.insightsError,
        createdAt: brandExtractionStatus.createdAt,
        updatedAt: brandExtractionStatus.updatedAt,
        brandName: brand.name,
        brandWebsiteUrl: brand.websiteUrl,
        userEmail: user.email,
        userDisplayName: user.displayName,
        userId: brand.userId,
      })
      .from(brandExtractionStatus)
      .innerJoin(brand, eq(brandExtractionStatus.brandId, brand.id))
      .leftJoin(user, eq(brand.userId, user.id))
      .where(whereClause)
      .orderBy(desc(brandExtractionStatus.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(brandExtractionStatus)
      .innerJoin(brand, eq(brandExtractionStatus.brandId, brand.id))
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: rows,
    page,
    limit,
    total,
    totalPages,
  };
}

// ==================== Ad Image Errors ====================

export async function getAdImageErrorsList(options?: { page?: number; limit?: number }) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: adImage.id,
        jobId: adImage.jobId,
        userId: adImage.userId,
        brandId: adImage.brandId,
        createdAt: adImage.createdAt,
        title: adImage.title,
        errorFlag: adImage.errorFlag,
        errorMessage: adImage.errorMessage,
        workflowId: adImage.workflowId,
        workflowUid: adWorkflow.workflowUid,
        variantKey: adWorkflow.variantKey,
        archetypeCode: adWorkflow.archetypeCode,
        archetypeDisplayName: adArchetype.displayName,
        brandName: brand.name,
        userEmail: user.email,
        userDisplayName: user.displayName,
      })
      .from(adImage)
      .leftJoin(adWorkflow, eq(adImage.workflowId, adWorkflow.id))
      .leftJoin(adArchetype, eq(adWorkflow.archetypeCode, adArchetype.code))
      .leftJoin(brand, eq(adImage.brandId, brand.id))
      .leftJoin(user, eq(adImage.userId, user.id))
      .where(eq(adImage.errorFlag, true))
      .orderBy(desc(adImage.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(adImage)
      .where(eq(adImage.errorFlag, true)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: rows,
    page,
    limit,
    total,
    totalPages,
  };
}

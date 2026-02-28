import { getAdminUser } from '@/lib/auth/admin';
import { getBrandWithFullDetails } from '@/lib/db/queries/admin';
import { redirect } from 'next/navigation';
import { AdminCard } from '@/components/admin/AdminCard';
import Link from 'next/link';

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function InsightField({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const str = formatValue(value);
  const isLong = typeof value === 'object' || (typeof str === 'string' && str.length > 200);
  return (
    <div className="mb-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {isLong ? (
          <pre className="whitespace-pre-wrap break-words rounded bg-gray-50 p-3 text-xs max-h-48 overflow-auto">
            {str}
          </pre>
        ) : (
          str
        )}
      </dd>
    </div>
  );
}

export default async function BrandInsightsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/dashboard?error=unauthorized');
  }

  const { brandId } = await params;
  const brand = await getBrandWithFullDetails(brandId);

  if (!brand) {
    return <div className="p-8">Brand not found</div>;
  }

  if (!brand.insights) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link
            href={`/admin/brands/${brandId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Brand
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Brand Insights – {brand.name}
        </h1>
        <AdminCard title="Brand Insights">
          <p className="text-gray-500">No insights found for this brand.</p>
        </AdminCard>
      </div>
    );
  }

  const i = brand.insights;

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={`/admin/brands/${brandId}`}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Brand
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Brand Insights
      </h1>
      <p className="text-gray-600 mb-8">{brand.name}</p>

      <div className="space-y-6">
        <AdminCard title="Metadata">
          <dl className="space-y-2">
            <InsightField label="Created At" value={i.createdAt ? new Date(i.createdAt).toLocaleString() : null} />
            <InsightField label="Updated At" value={i.updatedAt ? new Date(i.updatedAt).toLocaleString() : null} />
          </dl>
        </AdminCard>

        <AdminCard title="Brand & customer">
          <dl>
            <InsightField label="Industry" value={i.industry} />
            <InsightField label="Product description" value={i.productDescription} />
            <InsightField label="Key features" value={i.keyFeatures} />
            <InsightField label="Brand voice" value={i.brandVoice} />
            <InsightField label="Unique value prop" value={i.uniqueValueProp} />
            <InsightField label="Key benefits" value={i.keyBenefits} />
            <InsightField label="Customer pain points" value={i.customerPainPoints} />
            <InsightField label="Competitors" value={i.competitors} />
            <InsightField label="Target customers" value={i.targetCustomers} />
            <InsightField label="Solution" value={i.solution} />
          </dl>
        </AdminCard>

        <AdminCard title="Marketing">
          <dl>
            <InsightField label="Marketing brief" value={i.marketingBrief} />
            <InsightField label="Client ad preferences" value={i.clientAdPreferences} />
          </dl>
        </AdminCard>

        <AdminCard title="LLM insights">
          <dl>
            <InsightField label="Trigger events" value={i.insTriggerEvents} />
            <InsightField label="Aspirations" value={i.insAspirations} />
            <InsightField label="Marketing insight" value={i.insMarketingInsight} />
            <InsightField label="Trend opportunity" value={i.insTrendOpportunity} />
            <InsightField label="Raw (ins_raw)" value={i.insRaw} />
          </dl>
        </AdminCard>

        <AdminCard title="Reddit research">
          <dl>
            <InsightField label="Customer desires" value={i.redditCustomerDesires} />
            <InsightField label="Customer pain points" value={i.redditCustomerPainPoints} />
            <InsightField label="Interesting quotes" value={i.redditInterestingQuotes} />
            <InsightField label="Purchase triggers" value={i.redditPurchaseTriggers} />
            <InsightField label="Reddit marketing brief" value={i.redditMarketingBrief} />
          </dl>
        </AdminCard>

        <AdminCard title="Website">
          <dl>
            <InsightField label="Website text" value={i.websiteText} />
          </dl>
        </AdminCard>
      </div>
    </div>
  );
}

import { requireAdmin } from '@/lib/supabase/auth'

export default async function AdminAnalytics() {
  await requireAdmin()
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">Analytics</h1>
      
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">
          Analytics dashboard coming soon. This will include:
        </p>
        <ul className="mt-4 space-y-2 text-admin-light-text-secondary dark:text-admin-text-secondary">
          <li>• Sales performance charts</li>
          <li>• Customer behavior analytics</li>
          <li>• Product performance metrics</li>
          <li>• Revenue tracking and forecasting</li>
          <li>• Custom reporting tools</li>
        </ul>
      </div>
    </div>
  )
}
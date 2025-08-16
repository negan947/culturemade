'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function toTitle(segment: string): string {
  if (!segment) return '';
  if (segment === 'admin') return 'Dashboard';
  if (segment === 'orders') return 'Orders';
  if (segment === 'customers') return 'Customers';
  if (segment === 'products') return 'Products';
  if (segment === 'analytics') return 'Analytics';
  if (segment === 'settings') return 'Settings';
  if (segment === 'new') return 'New';
  if (segment === 'edit') return 'Edit';
  return segment.length > 12 ? `${segment.slice(0, 12)}…` : segment;
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = (pathname || '').split('/').filter(Boolean);

  const adminIndex = segments.indexOf('admin');
  const crumbs = segments.slice(adminIndex).map((seg, idx, arr) => {
    const href = '/' + arr.slice(0, idx + 1).join('/');
    return { href, label: toTitle(seg) };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
      <ol className="flex items-center gap-2">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-admin-light-text-disabled dark:text-admin-text-disabled">/</span>}
              {isLast ? (
                <span className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-admin-accent transition-colors duration-200">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}



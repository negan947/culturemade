'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filters Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <div className="h-4 w-96 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="w-full sm:w-40">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="w-full sm:w-40">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="w-10">
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table Skeleton */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-admin-light-border dark:border-admin-border">
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(8)].map((_, index) => (
                    <tr
                      key={index}
                      className="border-b border-admin-light-border dark:border-admin-border"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                          <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                          <div className="h-6 w-14 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Skeleton */}
          <div className="lg:hidden space-y-4">
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                      <div className="h-6 w-14 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-admin-light-border dark:border-admin-border">
            <div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
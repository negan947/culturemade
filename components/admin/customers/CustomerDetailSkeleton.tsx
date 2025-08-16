'use client';

import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div>
            <div className="h-8 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </CardTitle>
              <CardDescription>
                <span className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded animate-pulse inline-block" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </CardTitle>
              <CardDescription>
                <span className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse inline-block" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-admin-light-border dark:border-admin-border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Stats Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Addresses Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </CardTitle>
              <CardDescription>
                <span className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse inline-block" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={index}
                    className="p-3 border border-admin-light-border dark:border-admin-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                      <div className="h-6 w-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      {[...Array(6)].map((_, lineIndex) => (
                        <div key={lineIndex} className="h-3 w-full bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
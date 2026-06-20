'use client';

import React from 'react';
import { KPICard } from '@/components/kpi-card';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Wrench, Package, Clock, Lock, type LucideIcon } from 'lucide-react';
import type { MaintenanceCase } from '@/lib/models';

interface StatusCount {
  status: string;
  count: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'amber' | 'orange' | 'slate' | 'emerald';
}

interface MaintenanceMiniDashboardProps {
  cases: MaintenanceCase[];
  onStatusFilter?: (status: string) => void;
}

export function MaintenanceMiniDashboard({cases, onStatusFilter}: MaintenanceMiniDashboardProps) {
  const totalCount = cases.length;
  
  const statusCounts: StatusCount[] = [
    {
      status: 'Total',
      count: totalCount,
      icon: Package,
      color: 'emerald',
    },
    {
      status: 'open',
      count: cases.filter((c) => c.status === 'open').length,
      icon: AlertCircle,
      color: 'blue',
    },
    {
      status: 'under_inspection',
      count: cases.filter((c) => c.status === 'under_inspection').length,
      icon: Wrench,
      color: 'amber',
    },
    {
      status: 'under_repair',
      count: cases.filter((c) => c.status === 'under_repair').length,
      icon: Wrench,
      color: 'orange',
    },
    {
      status: 'resolved',
      count: cases.filter((c) => c.status === 'resolved').length,
      icon: CheckCircle2,
      color: 'green',
    },
    {
      status: 'closed',
      count: cases.filter((c) => c.status === 'closed').length,
      icon: Lock,
      color: 'slate',
    },
  ];

  const handleStatusClick = (status: string) => {
    if (onStatusFilter) {
      onStatusFilter(status);
    }
  };

  return (
    <div className="">
         {statusCounts.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-6 items-stretch">
            {statusCounts.map((item) => (
              <button
                key={item.status}
                
                onClick={() => item.status === 'Total' ? handleStatusClick('all') : handleStatusClick(item.status)}
                className="w-full h-full cursor-pointer transition-transform hover:scale-105 "
              >
                <div className = "h-full w-full">

                
                <KPICard
                  title={item.status.replace(/_/g, ' ').charAt(0).toUpperCase() + item.status.replace(/_/g, ' ').slice(1)}
                  value={item.count}
                  change={item.status != 'Total'? Math.round(100* item.count/totalCount):0}
                  icon={item.icon}
                  accentColor={item.color}
                />
                </div>
              </button>
            ))}
          </div>
      )}
    </div>
  );
}


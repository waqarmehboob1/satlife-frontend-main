'use client';

import { useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Package, Wrench, AlertTriangle, Zap, Pause, CheckCircle, Clock } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PIE_COLORS = ['oklch(0.62 0.15 250)', 'oklch(0.55 0.14 250)', 'oklch(0.65 0.15 165)', 'oklch(0.70 0.18 45)', 'oklch(0.55 0.2 15)'];

export default function DashboardPage() {
  const router = useRouter();
  const { projects, orders, inventory, maintenanceLogs, loading, statuses } = useDataStore();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // Calculate KPIs
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status_id && p.status_id.toString().includes('4')).length;
  const inProgressProjects = projects.filter((p) => p.status_id && p.status_id.toString().includes('2')).length;
  const totalOrders = orders.length;
  const inventoryItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const maintenanceRecords = maintenanceLogs.length;

  // Project status breakdown - count projects by status name
  const projectStatuses = {
    'Initiation': projects.filter(p => p.status_name === 'Initiation').length,
    'Planning': projects.filter(p => p.status_name === 'Planning').length,
    'Execution': projects.filter(p => p.status_name === 'Execution').length,
    'Monitoring': projects.filter(p => p.status_name === 'Monitoring').length,
    'Completed': projects.filter(p => p.status_name === 'Completed').length,
    'On Hold': projects.filter(p => p.status_name === 'On Hold').length,
  };

  const handleKPIClick = (path: string) => {
    router.push(path);
  };

  // Project status distribution (dummy calculation for demo)
  const projectStatusData = [
    { name: 'Planning', value: Math.max(1, totalProjects - inProgressProjects - completedProjects) },
    { name: 'In Progress', value: inProgressProjects },
    { name: 'Completed', value: completedProjects },
  ].filter((d) => d.value > 0);

  // Monthly orders data (dummy for demo)
  const monthlyOrdersData = [
    { month: 'Jan', orders: Math.floor(totalOrders * 0.1) || 0 },
    { month: 'Feb', orders: Math.floor(totalOrders * 0.12) || 0 },
    { month: 'Mar', orders: Math.floor(totalOrders * 0.15) || 0 },
    { month: 'Apr', orders: totalOrders },
  ];

  // Inventory by type (all same type, so just show total)
  const inventoryData = [{ name: 'Components', value: inventoryItems }];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of satellite lifecycle management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleKPIClick('/projects')}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Card className="h-full hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">{inProgressProjects} in progress</p>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handleKPIClick('/orders')}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Card className="h-full hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">All orders</p>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handleKPIClick('/inventory')}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Card className="h-full hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems}</div>
              <p className="text-xs text-muted-foreground">Total components</p>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => handleKPIClick('/maintenanceLogs')}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Card className="h-full hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Logs</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenanceRecords}</div>
              <p className="text-xs text-muted-foreground">All records</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Project Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status Breakdown</CardTitle>
          <CardDescription>Click on a status card to filter projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => handleKPIClick('/projects?status=Initiation')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Initiation</p>
                      <p className="text-2xl font-bold">{projectStatuses['Initiation']}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => handleKPIClick('/projects?status=Planning')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Planning</p>
                      <p className="text-2xl font-bold">{projectStatuses['Planning']}</p>
                    </div>
                    <Rocket className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => handleKPIClick('/projects?status=Execution')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Execution</p>
                      <p className="text-2xl font-bold">{projectStatuses['Execution']}</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => handleKPIClick('/projects?status=Monitoring')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monitoring</p>
                      <p className="text-2xl font-bold">{projectStatuses['Monitoring']}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => handleKPIClick('/projects?status=Completed')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{projectStatuses['Completed']}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => handleKPIClick('/projects?status=On%20Hold')}
              className="text-left cursor-pointer transition-transform hover:scale-105"
            >
              <Card className="hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">On Hold</p>
                      <p className="text-2xl font-bold">{projectStatuses['On Hold']}</p>
                    </div>
                    <Pause className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-75 flex items-center justify-center text-muted-foreground">
                No project data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Orders Trend</CardTitle>
            <CardDescription>Order volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="oklch(0.62 0.15 250)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Component inventory distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryData.length > 0 && inventoryData[0].value > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-75 flex items-center justify-center text-muted-foreground">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
            <CardDescription>Current project metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Projects</span>
                <span className="font-bold">{totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">In Progress</span>
                <span className="font-bold text-blue-600">{inProgressProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed</span>
                <span className="font-bold text-green-600">{completedProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="font-bold">{totalProjects > 0 ? `${Math.round((completedProjects / totalProjects) * 100)}%` : '0%'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

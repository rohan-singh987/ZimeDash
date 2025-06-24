'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { projectsAPI, tasksAPI, usersAPI } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: { total: 0, inProgress: 0, completed: 0 },
    tasks: { total: 0, pending: 0, completed: 0 },
    users: { total: 0, active: 0, roles: {} },
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, isAdmin, isManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsResponse = await projectsAPI.getAll();
      const projects = projectsResponse.data.data.projects;
      setRecentProjects(projects.slice(0, 5)); // Show only first 5 for dashboard
      
      // Calculate project stats
      const projectStats = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'In Progress').length,
        completed: projects.filter(p => p.status === 'Completed').length,
      };

      // Fetch my tasks
      const tasksResponse = await tasksAPI.getMyTasks();
      const tasks = tasksResponse.data.data.tasks;
      setMyTasks(tasks.slice(0, 5)); // Show only first 5 for dashboard

      // Calculate task stats
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        completed: tasks.filter(t => t.status === 'Done').length,
      };

      let userStats = { total: 0, active: 0, roles: {} };
      
      // Fetch user stats (admin only)
      if (isAdmin()) {
        try {
          const usersStatsResponse = await usersAPI.getStats();
          userStats = usersStatsResponse.data.data;
        } catch (error) {
          console.log('Could not fetch user stats:', error);
        }
      }

      setStats({
        projects: projectStats,
        tasks: taskStats,
        users: userStats,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'Planned':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your projects and tasks.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Projects Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">📁</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.projects.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>In Progress: {stats.projects.inProgress}</span>
                  <span>Completed: {stats.projects.completed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tasks.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pending: {stats.tasks.pending}</span>
                  <span>Completed: {stats.tasks.completed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats (Admin only) */}
          {isAdmin() && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.users.totalUsers}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Active: {stats.users.activeUsers}</span>
                    <span>Admins: {stats.users.roleDistribution?.admin || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {(isAdmin() || isManager()) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard/projects/new')}
                  >
                    + New Project
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/tasks')}
                >
                  View My Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/dashboard/projects')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div key={project._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-600 truncate">{project.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No projects yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Recent Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">My Recent Tasks</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push('/dashboard/tasks')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myTasks.length > 0 ? (
                  myTasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">{task.projectId?.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 
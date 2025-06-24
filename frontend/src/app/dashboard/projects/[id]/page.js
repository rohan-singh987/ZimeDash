'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { projectsAPI, tasksAPI } from '@/lib/api';

export default function ProjectDetailPage() {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const { user, isAuthenticated, isAdmin, isManager } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (projectId) {
      fetchProject();
      fetchProjectTasks();
    }
  }, [isAuthenticated, projectId, router]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getById(projectId);
      setProject(response.data.data.project);
    } catch (error) {
      console.error('Error fetching project:', error);
      if (error.response?.status === 404) {
        router.push('/dashboard/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTasks = async () => {
    try {
      setTasksLoading(true);
      const response = await tasksAPI.getByProject(projectId);
      setTasks(response.data.data.tasks);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Planned':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusBadgeColor = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageProject = () => {
    if (isAdmin()) return true;
    if (isManager() && project?.createdBy?._id === user._id) return true;
    return false;
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

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-gray-400 text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
                     <p className="text-gray-600 mb-4">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/dashboard/projects')}>
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => router.push('/dashboard/projects')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
            <p className="text-gray-600">{project.description}</p>
          </div>
          {canManageProject() && (
            <div className="flex space-x-2">
              <Button variant="outline">Edit Project</Button>
              <Button onClick={() => router.push(`/dashboard/tasks`)}>Add Task</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="text-sm text-gray-900">{project.createdBy?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-sm text-gray-900">{new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  {project.startDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-sm text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-sm text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tasks ({tasks.length})
                  </h3>
                  {canManageProject() && (
                    <Button onClick={() => router.push(`/dashboard/tasks`)} size="sm">Add Task</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusBadgeColor(task.status)}`}>
                                {task.status}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Assigned to: {task.assignedTo?.name || 'Unassigned'}</span>
                              <span>Created by: {task.createdBy?.name}</span>
                              {task.dueDate && (
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">✅</div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">No tasks yet</h4>
                    <p className="text-sm text-gray-600">Start by creating your first task for this project.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">
                  Team Members ({project.members?.length || 0})
                </h3>
              </CardHeader>
              <CardContent>
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div key={member._id || member.user?._id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{member.user?.name || member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-2xl mb-2">👥</div>
                    <p className="text-sm text-gray-600">No team members assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">Project Stats</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Tasks</span>
                    <span className="text-sm font-medium text-gray-900">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">
                      {tasks.filter(t => t.status === 'Done').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="text-sm font-medium text-blue-600">
                      {tasks.filter(t => t.status === 'Ongoing').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {tasks.filter(t => t.status === 'Pending').length}
                    </span>
                  </div>
                  {tasks.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round((tasks.filter(t => t.status === 'Done').length / tasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(tasks.filter(t => t.status === 'Done').length / tasks.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
import React, { useState, useEffect } from "react";
import Layout from "../Components/Layout";
import Card from "../Components/Card";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Shield,
  FileText,
  UserCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download
} from "lucide-react";

// Mock data for admin functionality
const mockUsers = [
  {
    id: 1,
    name: "Ramesh Kumar",
    email: "ramesh@example.com",
    role: "farmer",
    status: "active",
    joinDate: "2024-01-15",
    lastActive: "2024-01-20",
    activities: 15
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya@example.com",
    role: "collector",
    status: "active",
    joinDate: "2024-01-10",
    lastActive: "2024-01-19",
    activities: 23
  },
  {
    id: 3,
    name: "Dr. Amit Singh",
    email: "amit@example.com",
    role: "lab_technician",
    status: "active",
    joinDate: "2024-01-05",
    lastActive: "2024-01-20",
    activities: 45
  },
  {
    id: 4,
    name: "Suresh Processing",
    email: "suresh@example.com",
    role: "processor",
    status: "inactive",
    joinDate: "2024-01-08",
    lastActive: "2024-01-15",
    activities: 8
  },
  {
    id: 5,
    name: "Manufacturing Corp",
    email: "corp@example.com",
    role: "manufacturer",
    status: "active",
    joinDate: "2024-01-12",
    lastActive: "2024-01-20",
    activities: 67
  }
];

const mockActivities = [
  {
    id: 1,
    user: "Ramesh Kumar",
    action: "Created collection event",
    target: "Ashwagandha Batch #001",
    timestamp: "2024-01-20T10:30:00Z",
    type: "collection",
    status: "success"
  },
  {
    id: 2,
    user: "Dr. Amit Singh",
    action: "Completed quality test",
    target: "Turmeric Batch #002",
    timestamp: "2024-01-20T09:15:00Z",
    type: "quality_test",
    status: "success"
  },
  {
    id: 3,
    user: "Priya Sharma",
    action: "Updated batch status",
    target: "Neem Batch #003",
    timestamp: "2024-01-20T08:45:00Z",
    type: "processing",
    status: "warning"
  },
  {
    id: 4,
    user: "Manufacturing Corp",
    action: "Initiated recall",
    target: "Contaminated Batch #004",
    timestamp: "2024-01-19T16:20:00Z",
    type: "recall",
    status: "error"
  },
  {
    id: 5,
    user: "Suresh Processing",
    action: "Failed login attempt",
    target: "System",
    timestamp: "2024-01-19T14:10:00Z",
    type: "security",
    status: "error"
  }
];

const mockAuditLogs = [
  {
    id: 1,
    admin: "Admin User",
    action: "Assigned farmer role",
    target: "Ramesh Kumar",
    timestamp: "2024-01-20T11:00:00Z",
    reason: "User requested role change"
  },
  {
    id: 2,
    admin: "Admin User",
    action: "Approved batch",
    target: "Ashwagandha Batch #001",
    timestamp: "2024-01-20T10:45:00Z",
    reason: "Quality tests passed"
  },
  {
    id: 3,
    admin: "Admin User",
    action: "Deactivated user",
    target: "Suresh Processing",
    timestamp: "2024-01-19T15:30:00Z",
    reason: "Inactivity for 5 days"
  }
];

const roleOptions = [
  { value: "farmer", label: "Farmer", color: "bg-green-500" },
  { value: "collector", label: "Collector", color: "bg-blue-500" },
  { value: "lab_technician", label: "Lab Technician", color: "bg-purple-500" },
  { value: "processor", label: "Processor", color: "bg-orange-500" },
  { value: "manufacturer", label: "Manufacturer", color: "bg-red-500" },
  { value: "admin", label: "Admin", color: "bg-gray-500" }
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState(mockUsers);
  const [activities, setActivities] = useState(mockActivities);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter activities based on search
  const filteredActivities = activities.filter(activity =>
    activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case "collection": return <Users className="w-4 h-4" />;
      case "quality_test": return <Shield className="w-4 h-4" />;
      case "processing": return <Settings className="w-4 h-4" />;
      case "recall": return <AlertTriangle className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success": return "text-green-400 bg-green-400/20";
      case "warning": return "text-yellow-400 bg-yellow-400/20";
      case "error": return "text-red-400 bg-red-400/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    ));
    // Add to audit log
    setAuditLogs([{
      id: Date.now(),
      admin: "Current Admin",
      action: `Changed role to ${newRole}`,
      target: users.find(u => u.id === userId)?.name,
      timestamp: new Date().toISOString(),
      reason: "Admin role assignment"
    }, ...auditLogs]);
  };

  const handleUserStatusChange = (userId, newStatus) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "Active Users",
      value: users.filter(u => u.status === "active").length,
      icon: <UserCheck className="w-6 h-6 text-green-400" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Total Activities",
      value: activities.length,
      icon: <Activity className="w-6 h-6 text-purple-400" />,
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "System Alerts",
      value: activities.filter(a => a.status === "error").length,
      icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
      color: "from-red-500 to-rose-600",
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "User Management", icon: <Users className="w-4 h-4" /> },
    { id: "activities", label: "Activity Tracking", icon: <Activity className="w-4 h-4" /> },
    { id: "audit", label: "Audit Logs", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage users, roles, and monitor system activity</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                    <div className="text-3xl font-bold text-white mt-1">
                      {stat.value}
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card title="Recent Activities">
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{activity.user}</p>
                        <p className="text-xs text-gray-400">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* System Health */}
              <Card title="System Health">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Database Status</span>
                    <span className="text-green-400">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">API Response Time</span>
                    <span className="text-blue-400">~150ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Sessions</span>
                    <span className="text-purple-400">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Storage Used</span>
                    <span className="text-yellow-400">2.4 GB / 10 GB</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <Card title="User Management">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Roles</option>
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-gray-400">User</th>
                      <th className="py-3 px-4 text-gray-400">Role</th>
                      <th className="py-3 px-4 text-gray-400">Status</th>
                      <th className="py-3 px-4 text-gray-400">Activities</th>
                      <th className="py-3 px-4 text-gray-400">Last Active</th>
                      <th className="py-3 px-4 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-white font-medium">{user.name}</div>
                            <div className="text-gray-400 text-sm">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                          >
                            {roleOptions.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.activities}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {new Date(user.lastActive).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUserStatusChange(user.id,
                                user.status === "active" ? "inactive" : "active"
                              )}
                              className="p-1 text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "activities" && (
            <Card title="Activity Tracking">
              {/* Activity Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className={`p-3 rounded-lg ${getStatusColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium">{activity.user}</h4>
                          <p className="text-gray-300 text-sm">{activity.action}</p>
                          <p className="text-gray-400 text-xs mt-1">Target: {activity.target}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "audit" && (
            <Card title="Audit Logs">
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white font-medium">{log.admin}</h4>
                          <p className="text-gray-300 text-sm">{log.action}</p>
                          <p className="text-gray-400 text-xs mt-1">Target: {log.target}</p>
                          {log.reason && (
                            <p className="text-gray-500 text-xs mt-1">Reason: {log.reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

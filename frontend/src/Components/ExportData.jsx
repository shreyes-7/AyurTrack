import React from 'react';

// ExportData utility component for handling CSV exports
class ExportData {

  // CSV conversion utility
  static convertToCSV(data, headers) {
    console.log('Converting to CSV:', data, headers);

    if (!data || data.length === 0) {
      console.warn('No data to convert');
      return "No data available";
    }

    // Create header row
    const csvHeaders = headers.join(",");

    // Create data rows
    const csvRows = data.map(item => {
      return headers.map(header => {
        let value = item[header];

        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }

        // Handle arrays (like commonNames, parts)
        if (Array.isArray(value)) {
          return `"${value.join("; ")}"`;
        }

        // Handle dates
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }

        // Convert to string and handle special characters
        const stringValue = String(value);

        // Handle strings with commas, quotes, or newlines
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      }).join(",");
    });

    const csvContent = [csvHeaders, ...csvRows].join("\n");
    console.log('CSV Content generated:', csvContent.substring(0, 200) + '...');

    return csvContent;
  }

  // Download CSV file
  static downloadCSV(csvContent, filename) {
    console.log('Starting download:', filename);

    try {
      // Create CSV content with BOM for better Excel compatibility
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // Create blob
      const blob = new Blob([csvWithBOM], { 
        type: 'text/csv;charset=utf-8;' 
      });

      console.log('Blob created:', blob.size, 'bytes');

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Set link attributes
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.display = 'none';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL object
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      console.log('Download initiated successfully');

      // Show success message
      alert(`File "${filename}" downloaded successfully!`);

    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    }
  }

  // Get timestamp for filenames
  static getTimestamp() {
    return new Date().toISOString().split('T')[0];
  }

  // Export Users
  static exportUsers(users) {
    console.log('Exporting users:', users?.length || 0);

    if (!users || users.length === 0) {
      alert("No users data available to export");
      return;
    }

    const headers = ['id', 'name', 'email', 'role', 'status', 'joinDate', 'lastActive', 'activities'];
    const csvContent = this.convertToCSV(users, headers);
    const timestamp = this.getTimestamp();
    this.downloadCSV(csvContent, `users_export_${timestamp}.csv`);
  }

  // Export Herbs
  static exportHerbs(herbs) {
    console.log('Exporting herbs:', herbs?.length || 0);

    if (!herbs || herbs.length === 0) {
      alert("No herbs data available to export. Please fetch herbs data first.");
      return;
    }

    const headers = ['id', 'name', 'scientificName', 'commonNames', 'category', 'parts'];
    const csvContent = this.convertToCSV(herbs, headers);
    const timestamp = this.getTimestamp();
    this.downloadCSV(csvContent, `herbs_export_${timestamp}.csv`);
  }

  // Export Activities
  static exportActivities(activities) {
    console.log('Exporting activities:', activities?.length || 0);

    if (!activities || activities.length === 0) {
      alert("No activities data available to export");
      return;
    }

    const headers = ['id', 'user', 'action', 'target', 'timestamp', 'type', 'status'];
    const csvContent = this.convertToCSV(activities, headers);
    const timestamp = this.getTimestamp();
    this.downloadCSV(csvContent, `activities_export_${timestamp}.csv`);
  }

  // Export Audit Logs
  static exportAuditLogs(auditLogs) {
    console.log('Exporting audit logs:', auditLogs?.length || 0);

    if (!auditLogs || auditLogs.length === 0) {
      alert("No audit logs data available to export");
      return;
    }

    const headers = ['id', 'admin', 'action', 'target', 'timestamp', 'reason'];
    const csvContent = this.convertToCSV(auditLogs, headers);
    const timestamp = this.getTimestamp();
    this.downloadCSV(csvContent, `audit_logs_export_${timestamp}.csv`);
  }

  // Export Summary
  static exportSummary(users, herbs, activities, auditLogs) {
    console.log('Exporting summary');

    const timestamp = this.getTimestamp();

    const summaryData = [{
      export_date: new Date().toLocaleString(),
      total_users: users ? users.length : 0,
      active_users: users ? users.filter(u => u.status === "active").length : 0,
      total_herbs: herbs ? herbs.length : 0,
      total_activities: activities ? activities.length : 0,
      total_audit_logs: auditLogs ? auditLogs.length : 0,
      system_alerts: activities ? activities.filter(a => a.status === "error").length : 0
    }];

    const summaryHeaders = [
      'export_date', 
      'total_users', 
      'active_users', 
      'total_herbs', 
      'total_activities', 
      'total_audit_logs', 
      'system_alerts'
    ];

    const summaryCSV = this.convertToCSV(summaryData, summaryHeaders);
    this.downloadCSV(summaryCSV, `admin_dashboard_summary_${timestamp}.csv`);
  }

  // Export Current Tab Data
  static exportCurrentTabData(activeTab, users, herbs, activities, auditLogs) {
    console.log(`Exporting current tab data: ${activeTab}`);

    switch (activeTab) {
      case "users":
        this.exportUsers(users);
        break;
      case "herbs":
        this.exportHerbs(herbs);
        break;
      case "activities":
        this.exportActivities(activities);
        break;
      case "audit":
        this.exportAuditLogs(auditLogs);
        break;
      case "overview":
      default:
        this.exportSummary(users, herbs, activities, auditLogs);
        break;
    }
  }

  // Export All Data
  static exportAllData(users, herbs, activities, auditLogs) {
    console.log('Exporting all data...');

    // Export users
    if (users && users.length > 0) {
      this.exportUsers(users);
    }

    // Export herbs if available (with delay)
    if (herbs && herbs.length > 0) {
      setTimeout(() => {
        this.exportHerbs(herbs);
      }, 500);
    }

    // Export activities (with delay)
    if (activities && activities.length > 0) {
      setTimeout(() => {
        this.exportActivities(activities);
      }, 1000);
    }

    // Export audit logs (with delay)
    if (auditLogs && auditLogs.length > 0) {
      setTimeout(() => {
        this.exportAuditLogs(auditLogs);
      }, 1500);
    }

    // Export summary (with delay)
    setTimeout(() => {
      this.exportSummary(users, herbs, activities, auditLogs);
    }, 2000);
  }

  // Main export handler
  static handleExport(activeTab, users, herbs, activities, auditLogs) {
    console.log('Export handler called');
    console.log('Current tab:', activeTab);
    console.log('Available data:', {
      users: users?.length || 0,
      herbs: herbs?.length || 0,
      activities: activities?.length || 0,
      auditLogs: auditLogs?.length || 0
    });

    try {
      const choice = window.confirm(
        "Export Options:\n\n" +
        "✅ OK = Export All Available Data\n" +
        "❌ Cancel = Export Current Tab Data Only"
      );

      if (choice) {
        this.exportAllData(users, herbs, activities, auditLogs);
      } else {
        this.exportCurrentTabData(activeTab, users, herbs, activities, auditLogs);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  }

  // Test function
  static testCSVExport() {
    const testData = [
      { name: "Test User", email: "test@example.com", role: "admin" },
      { name: "Another User", email: "user@example.com", role: "user" }
    ];
    const headers = ['name', 'email', 'role'];
    const csvContent = this.convertToCSV(testData, headers);
    this.downloadCSV(csvContent, 'test_export.csv');
  }
}

export default ExportData;
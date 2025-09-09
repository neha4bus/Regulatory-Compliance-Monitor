/**
 * Utility functions for formatting data in the dashboard
 */

/**
 * Format a date for display
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Show relative time for recent dates
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} min ago`;
    }
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  // Show formatted date for older dates
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a risk score for display
 */
export const formatRiskScore = (score: number): string => {
  if (typeof score !== 'number' || isNaN(score)) return '0.0';
  return score.toFixed(1);
};

/**
 * Get color for priority level
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'low': return '#38a169';
    case 'medium': return '#ed8936';
    case 'high': return '#e53e3e';
    case 'critical': return '#9f1239';
    default: return '#718096';
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Format duration in milliseconds to human readable
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'new': return '#3182ce';
    case 'analyzed': return '#38a169';
    case 'reviewed': return '#805ad5';
    case 'archived': return '#718096';
    case 'pending': return '#ed8936';
    case 'in_progress': return '#3182ce';
    case 'completed': return '#38a169';
    case 'overdue': return '#e53e3e';
    case 'failed': return '#e53e3e';
    default: return '#4a5568';
  }
};

/**
 * Format compliance score
 */
export const formatComplianceScore = (score: number): string => {
  if (typeof score !== 'number' || isNaN(score)) return 'N/A';
  return `${Math.round(score)}%`;
};

/**
 * Get time ago string
 */
export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format array as comma-separated list with "and"
 */
export const formatList = (items: string[], maxItems: number = 3): string => {
  if (!items || items.length === 0) return '';
  
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  
  if (items.length <= maxItems) {
    const lastItem = items[items.length - 1];
    const otherItems = items.slice(0, -1);
    return `${otherItems.join(', ')}, and ${lastItem}`;
  }
  
  const visibleItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  return `${visibleItems.join(', ')}, and ${remainingCount} more`;
};
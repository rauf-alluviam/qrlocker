import { 
  ClockIcon, 
  LockClosedIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export const getGroupDisplayName = (group, groupByField) => {
  if (!group._id) return 'Ungrouped';
  
  switch (groupByField) {
    case 'creator':
      return group._id.name || group._id.email || 'Unknown Creator';
    case 'organization':
      return group._id.name || 'Unknown Organization';
    case 'department':
      return group._id.name || 'Unknown Department';
    case 'status':
      return group._id.charAt(0).toUpperCase() + group._id.slice(1);
    case 'accessType':
      return group._id === 'public' ? 'Public Access' : 'Restricted Access';
    default:
      return group._id.toString();
  }
};

export const getStatusBadge = (bundle) => {
  const { approvalStatus, accessControl } = bundle;
  
  if (approvalStatus.status === 'pending') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending Approval
      </span>
    );
  }
  
  if (approvalStatus.status === 'rejected') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="h-3 w-3 mr-1" />
        Rejected
      </span>
    );
  }
  
  if (accessControl.expiryDate && new Date(accessControl.expiryDate) < new Date()) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Expired
      </span>
    );
  }
  
  if (accessControl.maxViews > 0 && accessControl.currentViews >= accessControl.maxViews) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        View Limit Reached
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircleIcon className="h-3 w-3 mr-1" />
      Active
    </span>
  );
};

export const getAccessIcon = (bundle) => {
  if (bundle.accessControl.hasPasscode) {
    return <LockClosedIcon className="h-4 w-4 text-orange-500" title="Password Protected" />;
  }
  if (bundle.accessControl.isPublic) {
    return <GlobeAltIcon className="h-4 w-4 text-blue-500" title="Public Access" />;
  }
  return <LockClosedIcon className="h-4 w-4 text-gray-500" title="Restricted Access" />;
};

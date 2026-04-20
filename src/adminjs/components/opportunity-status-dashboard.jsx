import React from 'react';
import { Box, Button, H2, Icon, Text } from '@adminjs/design-system';

const baseHref = '/admin/resources/Opportunity';

const filterCards = (data) => [
  {
    label: 'All Opportunities',
    count: data?.allCount ?? 0,
    href: baseHref,
    icon: 'Events',
    color: '#2f6b52',
  },
  {
    label: 'Open Status',
    count: data?.openCount ?? 0,
    href: `${baseHref}?filters.status=open`,
    icon: 'ChevronUp',
    color: '#2f6b52',
  },
  {
    label: 'Closed Status',
    count: data?.closedCount ?? 0,
    href: `${baseHref}?filters.status=closed`,
    icon: 'Close',
    color: '#d87953',
  },
  {
    label: 'Pending Review',
    count: data?.pendingApprovalCount ?? 0,
    href: `${baseHref}?filters.approvalStatus=pending`,
    icon: 'Time',
    color: '#e5b35a',
  },
  {
    label: 'Approved',
    count: data?.approvedCount ?? 0,
    href: `${baseHref}?filters.approvalStatus=approved`,
    icon: 'Check',
    color: '#4f8a62',
  },
  {
    label: 'Rejected',
    count: data?.rejectedCount ?? 0,
    href: `${baseHref}?filters.approvalStatus=rejected`,
    icon: 'Warning',
    color: '#c5634d',
  },
];

const FilterCard = ({ label, count, href, icon, color }) => (
  <Box
    flex="1 1 240px"
    minWidth="240px"
    variant="white"
    border="default"
    borderRadius="xl"
    boxShadow="card"
    p="xl"
  >
    <Box flex alignItems="center" justifyContent="space-between" mb="lg">
      <Box
        bg={color}
        color="white"
        borderRadius="circle"
        width="40px"
        height="40px"
        flex
        alignItems="center"
        justifyContent="center"
      >
        <Icon icon={icon} />
      </Box>
      <Text fontWeight="bold" fontSize="xl">
        {count}
      </Text>
    </Box>
    <Text mb="lg" fontWeight="bold">
      {label}
    </Text>
    <Button as="a" href={href} variant="primary">
      Filter Opportunities
    </Button>
  </Box>
);

const OpportunityStatusDashboard = (props) => {
  const cards = filterCards(props?.data);

  return (
    <Box variant="grey" p={['lg', 'xl']}>
      <Box mb="xl">
        <H2>Opportunity Status Filters</H2>
        <Text color="grey60">
          Jump straight into the opportunities list with the status filter you need.
        </Text>
      </Box>
      <Box display="flex" flexWrap="wrap" gap="xl">
        {cards.map((card) => (
          <FilterCard key={card.label} {...card} />
        ))}
      </Box>
    </Box>
  );
};

export default OpportunityStatusDashboard;

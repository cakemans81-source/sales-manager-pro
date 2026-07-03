export const getEffectiveUserStatus = (user) => {
    const rawStatus = typeof user?.status === 'string' ? user.status.trim() : user?.status;

    if (rawStatus === 'inactive') return 'inactive';
    if (rawStatus === 'active') return 'active';
    if (rawStatus === 'pending') return 'pending';

    return user?.isApproved === true ? 'active' : 'pending';
};

export const isActiveUser = (user) => getEffectiveUserStatus(user) === 'active';

export const isPendingUser = (user) => getEffectiveUserStatus(user) === 'pending';

export const isInactiveUser = (user) => getEffectiveUserStatus(user) === 'inactive';

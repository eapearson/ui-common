require(['kb.systemnotifications', 'postal'], function (SystemNotifications, Postal) {
   
    'use strict';
    var tn = SystemNotifications.systemNotifications;

    // This one is an upcoming outage
    tn.addNotification({
        id: 1,
        addedAt: '2015-03-13T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-31T14:04:00-08:00',
        updatedBy: 'eap',
        title: 'System Maintenance Window',
        notification: 'KBase will be undergoing maintenance and may be unavailable during this period',
        description: 'As part of our ongoing effort to improve our infrastructure, we will put KBase into maintenance mode for up to two hours in order to dust off the disk drives.',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'maintenance',
        status: 'active',
        startAt: '2015-04-12T14:00:00-08:00',
        endAt: '2015-04-12T16:00:00-08:00'
    });
    
    tn.addNotification({
        id: 6,
        addedAt: '2015-03-12T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-31T14:04:00-08:00',
        updatedBy: 'eap',
        title: 'System Maintenance Window',
        notification: 'KBase will be undergoing maintenance and may be unavailable during this period',
        description: 'As part of our ongoing effort to improve our infrastructure, we have put KBase into maintenance mode, for a few days, to tighten up some loose screws.',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'maintenance',
        status: 'active',
        startAt: '2015-03-12T14:00:00-08:00',
        endAt: '2015-04-12T16:00:00-08:00'
    });

    // This is an ongoing outage.
    tn.addNotification({
        id: 2,
        addedAt: '2015-03-12T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-13T14:04:00-08:00',
        updatedBy: 'eap',
        title: 'System is Down',
        notification: 'Sorry, the system is down. The rabbit chewed off the power cord.',
        description: 'Our bunny got hungry and ate the entire power cord. This is a special order from Saturn, and will take several days to order, ship, and install.',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'issue',
        status: 'active',
        startAt: '2015-03-24T14:04:00-08:00',
        endAt: '2015-03-26T14:04:00-08:00'
    });

    // This is an update.
    tn.addNotification({
        id: 3,
        addedAt: '2015-03-12T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-13T18:04:00-08:00',
        updatedBy: 'eap',
        title: 'KBase is now Faster',
        notification: 'A series of optimizations was launched today, and KBase is faster.',
        description: 'We finally removed the 1 second wait time that had been inadvertently introducted into every service call.',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'update',
        status: 'active',
        startAt: '2015-03-12T14:04:00-08:00'
    });

    // This is an update.
    tn.addNotification({
        id: 4,
        addedAt: '2015-03-12T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-13T18:04:00-08:00',
        updatedBy: 'eap',
        title: 'KBase is now Better',
        notification: 'A good solid round of testing led to lots of bug fixes',
        description: 'Over 1001 bugs were found in a recent round of testing. All but 1000 of those bugs are fixed in this new release of KBase',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'update',
        status: 'active',
        startAt: '2015-03-13T14:04:00-08:00'
    });

    // This is an update.
    tn.addNotification({
        id: 5,
        addedAt: '2015-03-12T14:04:00-08:00',
        addedBy: 'eap',
        updatedAt: '2015-03-13T18:04:00-08:00',
        updatedBy: 'eap',
        title: 'KBase is now Slicker',
        notification: 'We switched our ui framework and everything now looks much better',
        description: 'Who says form over function any more? We sure don\'t! We switched from Bootstrap to Sandal, the latest fork. And users agree. 4 out of 5 users who use kbase say they prefer the new look!',
        url: 'http://kbase.us/read/more/about/me.html',
        type: 'update',
        status: 'active',
        startAt: '2015-03-14T14:04:00-08:00'
    });

    var ns = tn.getNotifications();
    
    Postal.channel('notifications').publish('updated', tn);
    
});
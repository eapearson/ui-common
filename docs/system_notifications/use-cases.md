# Use Cases for System Notifications

## Introduction 

System Notifications are global messages targeted at all KBase users regarding 
past, present, or future events of importance in the KBase system.

Events include outages, service degradation, or updates to any service or the ui, 

Notifications typically include:

- a concise _notification message_, appropriate for a 
sidebar display, twitter message (note 140 chars or less!), or text message
- a full _description_ of the nature of the issue
- since the notifications regard events, they have a _beginning time_ and possibly 
and _ending time_. not all events have an ending time
- a _notification type_ to indicate what type of event the notification describes. 
Includes outage, degradation, and update. 
- _tags_ allow further specification of characteristics of the event. E.g. bug fix,
new functionality, breaking, aesthetic, improvement, etc.
- the original _posting and update times_ are available, and allow the user and user interface
to evaluate freshness of notices.
- a _url for more information_ may be available if there are additional resources describing 
the event. E.g. there may be a release notes page for a system update.

## Design



## Use Cases

### System Outage

A system outage is an event that degrades the performance of the system and will
probably affect users' ability to work in kbase. 

It must describe the nature of the outage, what services are affected, when the 
outage will start and end, and where to look for further information.

Anticipated outages will be reflected in notifications with a future start time, and is the primary
use case. Ongoing outages are of great interest to users, of course, but the efficacy of
a notification on the production system ui about an ongoing outage is of some question.


### System Degradation

A system degradation is a "light outage". It may be an indication of low performance, or specific
services that are not available. 

It may be a kbase judgement call when a degradation has escalated to an outage. For instance, if a 
number of services are unavailable, it may be better to place the system into maintenance mode until 
problem is resolved.

System degradations are typically of interest in an ongoing context.


### System Updates

A system update is a change to the system that is designed as an improvement.
Update notifications point the user to new functionality, fixes, and in some 
cases breaking changes.

Unlike outages, system updates do not have an end date. They are represented 
as a point in time.

An update may be related to an outage. For instance, a system update may require
an maintenance window during which the system may be down or unstable (and
kbase may just decide to make the system unavailable.) However, there is no
relationship between system notifications.

## Tags


#### System Update, New Functionality


#### System Update, Breaking


#### System Update, Disruptive




## Time Frame


### Notification of Upcoming

The notification describes an event that is scheduled to occur in the future. 
The user interface may represent the time until the outage as a countdown.

Apples to: outage

### Notification of Ongoing

The notification describes an event that is presently occurring. The user 
interface may represent these in a special highlighted fashion, or in a special 
area, for instance at the very top.

Applies to: outage

### Notification of Past

A system event that has passed. These may not be displayed in the user interface
by default, but are available in a notification history.

Applies to: outage, update


## Lifecycle

System Notifications may not only be created one time for end user consumption, but be be modified over a period of time to reflect changes in state of the corresponding event. 

For instance, an outage may first be scheduled, so that the user is aware that it will be happening in the future and plan around it. As the event approaches there may be more information added. This would be reflected in changes to the description and the update time. The UI has a chance to update itself, and to reflect this as a new message. When the event is in progress, there may be updates to the event window -- perhaps the outage is shorter than anticpated and the end date is modified. Every time the notification is updated, the update time is set to the current moment. This gives the ui a chance to show this as a new message.

The combination of update time, updated by, and a copy of the old and new notifications gives the ui ample opportunity to alert the user to changes in status, and to show them the updated information.

An alternative, more complex design, could utilize versioned notifications.

### Past Events

Notifications that reflect past events may never be updated. It is possible that new information about the event will be added, or information corrected. When this occurs, the update time will change.

### Ongoing Events

Ongoing events are by their nature fluid, especially unplanned ones. It is common to update a notification as an event is unfolding, in real time. In the end, this event notification will represent an account of this event for future reference.

An alternative approach is to provide discrete update notifications as short updates. This approach can have the advantage of providing a stream of 
